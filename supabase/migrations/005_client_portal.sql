-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Client Portal Schema
-- ============================================================================
-- Client portal authentication and access management
-- Enables yacht owners/captains to access their dashboard via magic links
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ADD PORTAL COLUMNS TO CLIENTS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_email TEXT,
  ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_token TEXT,
  ADD COLUMN IF NOT EXISTS portal_token_expires_at TIMESTAMPTZ;

-- Index for portal email lookups
CREATE INDEX IF NOT EXISTS idx_clients_portal_email ON clients(portal_email) WHERE portal_email IS NOT NULL;

-- Index for token verification
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token) WHERE portal_token IS NOT NULL;

-- ----------------------------------------------------------------------------
-- CLIENT SESSIONS TABLE
-- Track active client portal sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_client ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON client_sessions(expires_at);

-- ----------------------------------------------------------------------------
-- CLIENT FEEDBACK TABLE
-- Structured feedback on shortlisted candidates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_candidate_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Feedback
  rating TEXT NOT NULL CHECK (rating IN ('interested', 'maybe', 'not_suitable')),
  notes TEXT,
  rejection_reason TEXT CHECK (
    rejection_reason IS NULL OR
    rejection_reason IN ('experience', 'skills', 'availability', 'salary', 'location', 'other')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint - one feedback per submission per client
  UNIQUE(client_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_client_feedback_client ON client_candidate_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_job ON client_candidate_feedback(job_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_submission ON client_candidate_feedback(submission_id);

-- ----------------------------------------------------------------------------
-- INTERVIEW REQUESTS TABLE
-- Track interview requests from clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Interview details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  requested_type TEXT CHECK (requested_type IN ('video', 'phone', 'in_person')),
  preferred_dates JSONB, -- Array of preferred datetime ranges
  notes TEXT,

  -- Scheduling (filled by recruiter)
  scheduled_at TIMESTAMPTZ,
  meeting_link TEXT,
  meeting_location TEXT,
  duration_minutes INTEGER DEFAULT 30,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_by UUID REFERENCES users(id),

  -- Unique constraint - one active interview request per submission
  UNIQUE(client_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_requests_client ON interview_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_job ON interview_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_requests_scheduled ON interview_requests(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- Client Sessions - clients can only see their own sessions
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_sessions_access ON client_sessions;
CREATE POLICY client_sessions_access ON client_sessions
  FOR ALL
  USING (
    -- Agency members can manage all sessions for their clients
    client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT organization_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Client Feedback - agency members can view all feedback for their clients
ALTER TABLE client_candidate_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_feedback_access ON client_candidate_feedback;
CREATE POLICY client_feedback_access ON client_candidate_feedback
  FOR ALL
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT organization_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Interview Requests - agency members can manage all requests for their clients
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interview_requests_access ON interview_requests;
CREATE POLICY interview_requests_access ON interview_requests
  FOR ALL
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT organization_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Auto-update updated_at for client_candidate_feedback
DROP TRIGGER IF EXISTS trg_client_feedback_updated_at ON client_candidate_feedback;
CREATE TRIGGER trg_client_feedback_updated_at
  BEFORE UPDATE ON client_candidate_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at for interview_requests
DROP TRIGGER IF EXISTS trg_interview_requests_updated_at ON interview_requests;
CREATE TRIGGER trg_interview_requests_updated_at
  BEFORE UPDATE ON interview_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to generate a secure magic link token
CREATE OR REPLACE FUNCTION generate_client_magic_link(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '1 hour';

  -- Update the client with the token
  UPDATE clients
  SET
    portal_token = v_token,
    portal_token_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_client_id
    AND portal_enabled = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found or portal not enabled';
  END IF;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a magic link token and create a session
CREATE OR REPLACE FUNCTION verify_client_magic_link(
  p_token TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE(
  client_id UUID,
  session_token TEXT,
  client_name TEXT,
  agency_id UUID
) AS $$
DECLARE
  v_client RECORD;
  v_session_token TEXT;
BEGIN
  -- Find and verify the token
  SELECT c.* INTO v_client
  FROM clients c
  WHERE c.portal_token = p_token
    AND c.portal_token_expires_at > NOW()
    AND c.portal_enabled = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');

  -- Clear the magic link token and create session
  UPDATE clients
  SET
    portal_token = NULL,
    portal_token_expires_at = NULL,
    portal_last_login = NOW(),
    updated_at = NOW()
  WHERE id = v_client.id;

  -- Create session (expires in 30 days)
  INSERT INTO client_sessions (client_id, session_token, user_agent, ip_address, expires_at)
  VALUES (v_client.id, v_session_token, p_user_agent, p_ip_address, NOW() + INTERVAL '30 days');

  RETURN QUERY SELECT v_client.id, v_session_token, v_client.name, v_client.agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate a session token
CREATE OR REPLACE FUNCTION validate_client_session(p_session_token TEXT)
RETURNS TABLE(
  client_id UUID,
  client_name TEXT,
  agency_id UUID,
  primary_contact_name TEXT,
  primary_contact_email TEXT
) AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Find and validate session
  SELECT cs.*, c.name as client_name, c.agency_id, c.primary_contact_name, c.primary_contact_email
  INTO v_session
  FROM client_sessions cs
  JOIN clients c ON c.id = cs.client_id
  WHERE cs.session_token = p_session_token
    AND cs.expires_at > NOW();

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Update last active
  UPDATE client_sessions
  SET last_active_at = NOW()
  WHERE id = v_session.id;

  RETURN QUERY SELECT v_session.client_id, v_session.client_name, v_session.agency_id,
                      v_session.primary_contact_name, v_session.primary_contact_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a client session
CREATE OR REPLACE FUNCTION revoke_client_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM client_sessions WHERE session_token = p_session_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_client_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM client_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- UPDATE SUBMISSIONS TABLE FOR CLIENT FEEDBACK
-- ----------------------------------------------------------------------------
-- Add client feedback columns if they don't exist
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS client_feedback_rating TEXT CHECK (
    client_feedback_rating IS NULL OR
    client_feedback_rating IN ('interested', 'maybe', 'not_suitable')
  ),
  ADD COLUMN IF NOT EXISTS client_feedback_notes TEXT,
  ADD COLUMN IF NOT EXISTS client_feedback_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE client_sessions IS 'Active portal sessions for yacht clients';
COMMENT ON TABLE client_candidate_feedback IS 'Structured feedback from clients on shortlisted candidates';
COMMENT ON TABLE interview_requests IS 'Interview requests initiated by clients through the portal';

COMMENT ON COLUMN clients.portal_enabled IS 'Whether this client has portal access enabled';
COMMENT ON COLUMN clients.portal_email IS 'Email address for magic link authentication';
COMMENT ON COLUMN clients.portal_last_login IS 'Last time client logged into the portal';
COMMENT ON COLUMN clients.portal_token IS 'Temporary magic link token (cleared after use)';
COMMENT ON COLUMN clients.portal_token_expires_at IS 'Expiry time for the magic link token';

COMMENT ON FUNCTION generate_client_magic_link IS 'Generate a secure magic link token for client portal access';
COMMENT ON FUNCTION verify_client_magic_link IS 'Verify a magic link token and create a client session';
COMMENT ON FUNCTION validate_client_session IS 'Validate an active client session token';
COMMENT ON FUNCTION revoke_client_session IS 'Revoke/logout a client session';

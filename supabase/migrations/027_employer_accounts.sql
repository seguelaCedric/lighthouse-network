-- Migration: Employer Accounts
-- Description: Create employer_accounts table for self-serve employer registration and portal access
-- This enables employers (yacht owners, captains, household employers) to register and access their portal

-- Employer accounts table
CREATE TABLE employer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  email TEXT UNIQUE NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,

  -- What they're hiring for
  hiring_for TEXT CHECK (hiring_for IN ('yacht', 'household', 'both')),

  -- Yacht-specific fields
  vessel_name TEXT,
  vessel_type TEXT CHECK (vessel_type IN ('motor', 'sail', 'explorer', 'catamaran', 'other') OR vessel_type IS NULL),
  vessel_size_meters INTEGER,

  -- Household-specific fields
  property_type TEXT CHECK (property_type IN ('estate', 'villa', 'apartment', 'townhouse', 'chalet', 'other') OR property_type IS NULL),
  property_location TEXT,

  -- Hiring needs
  positions_needed TEXT[],
  timeline TEXT CHECK (timeline IN ('immediate', '1-2_weeks', '1_month', 'exploring') OR timeline IS NULL),
  additional_notes TEXT,

  -- Access control
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'verified', 'premium')),
  vetting_status TEXT DEFAULT 'pending' CHECK (vetting_status IN ('pending', 'scheduled', 'completed', 'rejected')),
  vetted_at TIMESTAMPTZ,
  vetted_by UUID REFERENCES users(id),
  vetting_notes TEXT,

  -- Magic link authentication
  magic_token TEXT,
  magic_token_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,

  -- Agency assignment (for internal routing)
  assigned_agency_id UUID REFERENCES organizations(id),
  assigned_recruiter_id UUID REFERENCES users(id),

  -- Source tracking
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_code TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE employer_accounts IS 'Self-serve employer accounts for yacht owners, captains, and household employers';
COMMENT ON COLUMN employer_accounts.tier IS 'Access tier: basic (can submit briefs), verified (can view shortlists), premium (priority service)';
COMMENT ON COLUMN employer_accounts.vetting_status IS 'Vetting workflow status for tier upgrades';
COMMENT ON COLUMN employer_accounts.hiring_for IS 'Whether hiring for yacht crew, household staff, or both';

-- Enable RLS
ALTER TABLE employer_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can insert (registration) - using service role for actual inserts
CREATE POLICY "Service role can insert employer accounts"
  ON employer_accounts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role has full access (for API operations)
CREATE POLICY "Service role full access"
  ON employer_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated agency users can read employer accounts (for internal dashboard)
CREATE POLICY "Authenticated users can read employer accounts"
  ON employer_accounts
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated agency users can update employer accounts
CREATE POLICY "Authenticated users can update employer accounts"
  ON employer_accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_employer_accounts_email ON employer_accounts(email);
CREATE INDEX idx_employer_accounts_magic_token ON employer_accounts(magic_token)
  WHERE magic_token IS NOT NULL;
CREATE INDEX idx_employer_accounts_tier ON employer_accounts(tier);
CREATE INDEX idx_employer_accounts_vetting_status ON employer_accounts(vetting_status);
CREATE INDEX idx_employer_accounts_created_at ON employer_accounts(created_at DESC);
CREATE INDEX idx_employer_accounts_assigned_recruiter ON employer_accounts(assigned_recruiter_id)
  WHERE assigned_recruiter_id IS NOT NULL;

-- Employer sessions table (for portal access)
CREATE TABLE employer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_account_id UUID NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  user_agent TEXT,
  ip_address INET,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE employer_sessions IS 'Session tokens for employer portal access';

-- Enable RLS on sessions
ALTER TABLE employer_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can manage sessions
CREATE POLICY "Service role manages employer sessions"
  ON employer_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for session lookup
CREATE INDEX idx_employer_sessions_token ON employer_sessions(session_token);
CREATE INDEX idx_employer_sessions_employer ON employer_sessions(employer_account_id);
CREATE INDEX idx_employer_sessions_expires ON employer_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_employer_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM employer_sessions WHERE expires_at < now();
END;
$$;

-- Function to generate a secure magic token
CREATE OR REPLACE FUNCTION generate_employer_magic_token(p_employer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Update the employer account with the token (expires in 1 hour)
  UPDATE employer_accounts
  SET
    magic_token = v_token,
    magic_token_expires_at = now() + interval '1 hour',
    updated_at = now()
  WHERE id = p_employer_id;

  RETURN v_token;
END;
$$;

-- Function to verify magic token and create session
CREATE OR REPLACE FUNCTION verify_employer_magic_token(p_token TEXT, p_user_agent TEXT DEFAULT NULL, p_ip_address INET DEFAULT NULL)
RETURNS TABLE(
  employer_id UUID,
  session_token TEXT,
  email TEXT,
  contact_name TEXT,
  tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employer employer_accounts%ROWTYPE;
  v_session_token TEXT;
BEGIN
  -- Find and validate the token
  SELECT * INTO v_employer
  FROM employer_accounts
  WHERE magic_token = p_token
    AND magic_token_expires_at > now();

  IF v_employer.id IS NULL THEN
    RETURN;
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');

  -- Create session
  INSERT INTO employer_sessions (employer_account_id, session_token, user_agent, ip_address)
  VALUES (v_employer.id, v_session_token, p_user_agent, p_ip_address);

  -- Clear the magic token and update login stats
  UPDATE employer_accounts
  SET
    magic_token = NULL,
    magic_token_expires_at = NULL,
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = now()
  WHERE id = v_employer.id;

  -- Return the session info
  RETURN QUERY SELECT
    v_employer.id,
    v_session_token,
    v_employer.email,
    v_employer.contact_name,
    v_employer.tier;
END;
$$;

-- Function to validate an employer session
CREATE OR REPLACE FUNCTION validate_employer_session(p_session_token TEXT)
RETURNS TABLE(
  employer_id UUID,
  email TEXT,
  contact_name TEXT,
  company_name TEXT,
  tier TEXT,
  vetting_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session employer_sessions%ROWTYPE;
  v_employer employer_accounts%ROWTYPE;
BEGIN
  -- Find the session
  SELECT * INTO v_session
  FROM employer_sessions
  WHERE session_token = p_session_token
    AND expires_at > now();

  IF v_session.id IS NULL THEN
    RETURN;
  END IF;

  -- Update last active
  UPDATE employer_sessions
  SET last_active_at = now()
  WHERE id = v_session.id;

  -- Get employer info
  SELECT * INTO v_employer
  FROM employer_accounts
  WHERE id = v_session.employer_account_id;

  RETURN QUERY SELECT
    v_employer.id,
    v_employer.email,
    v_employer.contact_name,
    v_employer.company_name,
    v_employer.tier,
    v_employer.vetting_status;
END;
$$;

-- Function to revoke an employer session
CREATE OR REPLACE FUNCTION revoke_employer_session(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM employer_sessions WHERE session_token = p_session_token;
  RETURN FOUND;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employer_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employer_accounts_updated_at
  BEFORE UPDATE ON employer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_accounts_updated_at();

-- ============================================================================
-- Job Alert Notifications System
-- ============================================================================
-- This migration creates:
-- 1. A persistent notifications table for all candidate notifications
-- 2. A job_alerts table to track which job alerts have been sent
-- 3. Adds job_alerts_enabled field to candidates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Add job alerts enabled field to candidates
-- ----------------------------------------------------------------------------
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS job_alerts_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN candidates.job_alerts_enabled IS 'Whether the candidate wants to receive job alert notifications via email';

-- ----------------------------------------------------------------------------
-- Create notification type enum
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'job_alert',
      'certification',
      'application',
      'message',
      'system'
    );
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Create persistent notifications table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who receives it
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Related entities (for linking)
  entity_type TEXT, -- 'job', 'application', 'certification', etc.
  entity_id UUID,

  -- Action
  action_url TEXT,
  action_label TEXT,

  -- Extra data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_candidate ON candidate_notifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON candidate_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON candidate_notifications(candidate_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON candidate_notifications(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON candidate_notifications(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- Create job alerts tracking table
-- This prevents sending duplicate alerts for the same job to the same candidate
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_alert_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who and what
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- What was sent
  notification_id UUID REFERENCES candidate_notifications(id) ON DELETE SET NULL,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate alerts
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_alert_log_candidate ON job_alert_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_log_job ON job_alert_log(job_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_log_created ON job_alert_log(created_at DESC);

-- ----------------------------------------------------------------------------
-- RLS Policies for candidate_notifications
-- ----------------------------------------------------------------------------
ALTER TABLE candidate_notifications ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own notifications
CREATE POLICY "candidates_view_own_notifications" ON candidate_notifications
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Candidates can update (mark as read) their own notifications
CREATE POLICY "candidates_update_own_notifications" ON candidate_notifications
  FOR UPDATE
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- System can insert notifications (service role)
CREATE POLICY "service_insert_notifications" ON candidate_notifications
  FOR INSERT
  WITH CHECK (true);

-- Organization members can view candidate notifications
CREATE POLICY "org_members_view_notifications" ON candidate_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()
      AND u.organization_id IS NOT NULL
    )
  );

-- ----------------------------------------------------------------------------
-- RLS Policies for job_alert_log
-- ----------------------------------------------------------------------------
ALTER TABLE job_alert_log ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own alert logs
CREATE POLICY "candidates_view_own_alerts" ON job_alert_log
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Service role can manage alert logs
CREATE POLICY "service_manage_alert_logs" ON job_alert_log
  FOR ALL
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Function to check if a job matches candidate's positions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION job_matches_candidate_positions(
  p_job_title TEXT,
  p_candidate_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_yacht_primary TEXT;
  v_yacht_secondary TEXT[];
  v_household_primary TEXT;
  v_household_secondary TEXT[];
  v_primary_position TEXT;
  v_secondary_positions TEXT[];
  v_job_title_lower TEXT;
  v_position TEXT;
BEGIN
  -- Get candidate positions
  SELECT
    yacht_primary_position,
    yacht_secondary_positions,
    household_primary_position,
    household_secondary_positions,
    primary_position,
    secondary_positions
  INTO
    v_yacht_primary,
    v_yacht_secondary,
    v_household_primary,
    v_household_secondary,
    v_primary_position,
    v_secondary_positions
  FROM candidates
  WHERE id = p_candidate_id;

  -- Normalize job title for comparison
  v_job_title_lower := LOWER(p_job_title);

  -- Check yacht primary position
  IF v_yacht_primary IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_yacht_primary) || '%' THEN
    RETURN TRUE;
  END IF;

  -- Check yacht secondary positions
  IF v_yacht_secondary IS NOT NULL THEN
    FOREACH v_position IN ARRAY v_yacht_secondary LOOP
      IF v_position IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_position) || '%' THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  -- Check household primary position
  IF v_household_primary IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_household_primary) || '%' THEN
    RETURN TRUE;
  END IF;

  -- Check household secondary positions
  IF v_household_secondary IS NOT NULL THEN
    FOREACH v_position IN ARRAY v_household_secondary LOOP
      IF v_position IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_position) || '%' THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  -- Check legacy primary position
  IF v_primary_position IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_primary_position) || '%' THEN
    RETURN TRUE;
  END IF;

  -- Check legacy secondary positions
  IF v_secondary_positions IS NOT NULL THEN
    FOREACH v_position IN ARRAY v_secondary_positions LOOP
      IF v_position IS NOT NULL AND v_job_title_lower ILIKE '%' || LOWER(v_position) || '%' THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- Function to get candidates eligible for job alerts for a specific job
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_candidates_for_job_alert(
  p_job_id UUID
) RETURNS TABLE (
  candidate_id UUID,
  candidate_email TEXT,
  candidate_first_name TEXT,
  candidate_last_name TEXT,
  matched_position TEXT
) AS $$
DECLARE
  v_job_title TEXT;
BEGIN
  -- Get job title
  SELECT title INTO v_job_title FROM jobs WHERE id = p_job_id;

  IF v_job_title IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    COALESCE(
      c.yacht_primary_position,
      c.household_primary_position,
      c.primary_position,
      'Position'
    )::TEXT as matched_position
  FROM candidates c
  WHERE
    -- Has job alerts enabled
    c.job_alerts_enabled = true
    -- Has an email address
    AND c.email IS NOT NULL
    -- Not deleted
    AND c.deleted_at IS NULL
    -- Job matches their positions
    AND job_matches_candidate_positions(v_job_title, c.id)
    -- Has not already received an alert for this job
    AND NOT EXISTS (
      SELECT 1 FROM job_alert_log jal
      WHERE jal.candidate_id = c.id AND jal.job_id = p_job_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION job_matches_candidate_positions TO authenticated;
GRANT EXECUTE ON FUNCTION job_matches_candidate_positions TO service_role;
GRANT EXECUTE ON FUNCTION get_candidates_for_job_alert TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_for_job_alert TO service_role;

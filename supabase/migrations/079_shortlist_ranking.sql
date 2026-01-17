-- Migration: Add shortlist ranking and AI match fields to applications
-- Purpose: Enable ranked shortlists per job and store AI match reasoning

-- =============================================================================
-- Add shortlist ranking columns
-- =============================================================================

-- Shortlist rank (1 = top candidate, NULL = not ranked)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlist_rank INTEGER;

-- Shortlist-specific notes (separate from internal_notes which are general)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlist_notes TEXT;

-- Timestamp when added to shortlist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMPTZ;

-- Who added to shortlist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted_by UUID REFERENCES users(id);

-- =============================================================================
-- Add enhanced AI match fields
-- =============================================================================

-- Detailed AI reasoning (longer than ai_assessment)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_match_reasoning TEXT;

-- Source of the candidate for this application
-- e.g., 'internal_search', 'yotspot_import', 'manual', 'vincere_sync', 'candidate_apply'
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_source TEXT;

-- For YotSpot candidates: store original profile URL for reference
ALTER TABLE applications ADD COLUMN IF NOT EXISTS yotspot_profile_url TEXT;

-- =============================================================================
-- Create index for efficient shortlist queries
-- =============================================================================

-- Index for fetching shortlisted candidates in rank order
CREATE INDEX IF NOT EXISTS idx_applications_shortlist
  ON applications(job_id, shortlist_rank)
  WHERE stage = 'shortlisted' AND shortlist_rank IS NOT NULL;

-- Index for finding applications by yotspot URL (deduplication)
CREATE INDEX IF NOT EXISTS idx_applications_yotspot_url
  ON applications(yotspot_profile_url)
  WHERE yotspot_profile_url IS NOT NULL;

-- =============================================================================
-- Helper function: Get shortlist for a job
-- =============================================================================

CREATE OR REPLACE FUNCTION get_job_shortlist(p_job_id UUID)
RETURNS TABLE (
  application_id UUID,
  candidate_id UUID,
  shortlist_rank INTEGER,
  shortlist_notes TEXT,
  match_score INTEGER,
  ai_match_reasoning TEXT,
  candidate_source TEXT,
  shortlisted_at TIMESTAMPTZ,
  shortlisted_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS application_id,
    a.candidate_id,
    a.shortlist_rank,
    a.shortlist_notes,
    a.match_score,
    a.ai_match_reasoning,
    a.candidate_source,
    a.shortlisted_at,
    a.shortlisted_by
  FROM applications a
  WHERE a.job_id = p_job_id
    AND a.stage = 'shortlisted'
  ORDER BY a.shortlist_rank ASC NULLS LAST, a.match_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Helper function: Add candidate to shortlist
-- =============================================================================

CREATE OR REPLACE FUNCTION add_to_shortlist(
  p_application_id UUID,
  p_rank INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_job_id UUID;
  v_max_rank INTEGER;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();

  -- Get job_id from application
  SELECT job_id INTO v_job_id FROM applications WHERE id = p_application_id;

  -- If no rank provided, add to end of list
  IF p_rank IS NULL THEN
    SELECT COALESCE(MAX(shortlist_rank), 0) + 1 INTO v_max_rank
    FROM applications
    WHERE job_id = v_job_id AND stage = 'shortlisted';
    p_rank := v_max_rank;
  END IF;

  -- Update application
  UPDATE applications
  SET
    stage = 'shortlisted',
    stage_changed_at = NOW(),
    stage_changed_by = v_user_id,
    shortlist_rank = p_rank,
    shortlist_notes = COALESCE(p_notes, shortlist_notes),
    shortlisted_at = NOW(),
    shortlisted_by = v_user_id
  WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Helper function: Reorder shortlist
-- =============================================================================

CREATE OR REPLACE FUNCTION reorder_shortlist(
  p_job_id UUID,
  p_application_ids UUID[]  -- Array in desired order
)
RETURNS VOID AS $$
DECLARE
  v_app_id UUID;
  v_rank INTEGER := 1;
BEGIN
  -- Update each application with its new rank
  FOREACH v_app_id IN ARRAY p_application_ids
  LOOP
    UPDATE applications
    SET shortlist_rank = v_rank
    WHERE id = v_app_id AND job_id = p_job_id AND stage = 'shortlisted';

    v_rank := v_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON COLUMN applications.shortlist_rank IS 'Position in shortlist (1 = top). NULL if not ranked.';
COMMENT ON COLUMN applications.shortlist_notes IS 'Recruiter notes specific to this shortlist position.';
COMMENT ON COLUMN applications.shortlisted_at IS 'When candidate was added to shortlist.';
COMMENT ON COLUMN applications.shortlisted_by IS 'User who added candidate to shortlist.';
COMMENT ON COLUMN applications.ai_match_reasoning IS 'Detailed AI reasoning for match score.';
COMMENT ON COLUMN applications.candidate_source IS 'How candidate was sourced: internal_search, yotspot_import, manual, etc.';
COMMENT ON COLUMN applications.yotspot_profile_url IS 'Original YotSpot profile URL if imported from YotSpot.';

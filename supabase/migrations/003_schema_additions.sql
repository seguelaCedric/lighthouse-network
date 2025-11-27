-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Schema Additions
-- ============================================================================
-- Adds missing fields and the applications table
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- NEW ENUM: Application stages (different from submission_status)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE application_stage AS ENUM (
    'applied',
    'screening',
    'shortlisted',
    'submitted',
    'interview',
    'offer',
    'placed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CANDIDATES TABLE - Add missing columns
-- ============================================================================

-- External IDs
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS vincere_id TEXT;

-- Photo
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Professional (singular secondary position for compatibility)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS secondary_position TEXT;

-- Yacht experience range
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS yacht_size_min INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS yacht_size_max INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS yacht_types TEXT[];

-- Contract preferences (distinct from preferred_contract_types)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS contract_preferences TEXT[];

-- Salary as salary_min/max aliases (the table has desired_salary_min/max)
-- We'll add these as computed columns or just use the existing ones
-- Adding aliases for API compatibility:
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_max INTEGER;

-- Couple position (what position the candidate holds in a couple)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS couple_position TEXT;

-- AI Summary (alias for profile_summary for API compatibility)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Sync tracking
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create index on vincere_id for sync lookups
CREATE INDEX IF NOT EXISTS idx_candidates_vincere_id ON candidates(vincere_id);
CREATE INDEX IF NOT EXISTS idx_candidates_last_synced ON candidates(last_synced_at);

-- ============================================================================
-- BRIEFS TABLE - Add needs_clarification status
-- ============================================================================

-- Update the status column to allow 'needs_clarification' value
-- Since the column is TEXT (not enum), we just need to document it
-- The valid statuses are now: new, parsing, parsed, needs_clarification, converted, abandoned

COMMENT ON COLUMN briefs.status IS 'Status: new, parsing, parsed, needs_clarification, converted, abandoned';

-- ============================================================================
-- APPLICATIONS TABLE
-- A distinct table from submissions for tracking candidate-job pipeline
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core relationships
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  agency_id UUID NOT NULL REFERENCES organizations(id),

  -- Stage tracking (different from submission status)
  stage application_stage DEFAULT 'applied',
  stage_changed_at TIMESTAMPTZ,
  stage_changed_by UUID REFERENCES users(id),

  -- AI Matching
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_breakdown JSONB DEFAULT '{}',
  /*
  {
    "skills_match": 85,
    "experience_match": 90,
    "certification_match": 100,
    "availability_match": 75,
    "location_match": 60,
    "salary_match": 80
  }
  */
  ai_assessment TEXT,

  -- Source (how this application was created)
  source TEXT,  -- manual, ai_match, candidate_apply, vincere_sync

  -- Notes
  internal_notes TEXT,
  rejection_reason TEXT,

  -- Related submission (if converted to a formal submission)
  submission_id UUID REFERENCES submissions(id),

  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one application per candidate per job per agency
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique
  ON applications(candidate_id, job_id, agency_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_agency ON applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_match_score ON applications(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(job_id, applied_at);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: agencies can see their own applications
DROP POLICY IF EXISTS application_agency_access ON applications;
CREATE POLICY application_agency_access ON applications
  FOR ALL
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Convert application to submission
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_application_to_submission(
  p_application_id UUID,
  p_cover_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_app applications%ROWTYPE;
  v_submission_id UUID;
  v_user_id UUID;
BEGIN
  -- Get application
  SELECT * INTO v_app FROM applications WHERE id = p_application_id;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Application % not found', p_application_id;
  END IF;

  IF v_app.submission_id IS NOT NULL THEN
    RAISE EXCEPTION 'Application % already has a submission', p_application_id;
  END IF;

  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();

  -- Create submission
  INSERT INTO submissions (
    job_id,
    candidate_id,
    agency_id,
    submitted_by,
    cover_note,
    match_score,
    match_reasoning
  ) VALUES (
    v_app.job_id,
    v_app.candidate_id,
    v_app.agency_id,
    v_user_id,
    COALESCE(p_cover_note, v_app.ai_assessment),
    v_app.match_score,
    v_app.ai_assessment
  )
  RETURNING id INTO v_submission_id;

  -- Update application
  UPDATE applications
  SET
    submission_id = v_submission_id,
    stage = 'submitted',
    stage_changed_at = NOW(),
    stage_changed_by = v_user_id
  WHERE id = p_application_id;

  RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE applications IS 'Tracks candidate-job pipeline stages before/alongside formal submissions';
COMMENT ON COLUMN applications.stage IS 'Pipeline stage: applied, screening, shortlisted, submitted, interview, offer, placed, rejected';
COMMENT ON COLUMN applications.match_score IS 'AI-calculated match score 0-100';
COMMENT ON COLUMN applications.match_breakdown IS 'JSON breakdown of match score by category';
COMMENT ON COLUMN applications.submission_id IS 'Links to formal submission when converted';
COMMENT ON COLUMN candidates.vincere_id IS 'External ID from Vincere CRM for sync';
COMMENT ON COLUMN candidates.last_synced_at IS 'Last time this record was synced from Vincere';

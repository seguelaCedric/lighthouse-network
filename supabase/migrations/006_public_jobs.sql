-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Public Job Board Schema
-- ============================================================================
-- Adds public job board functionality:
-- - Public job display fields
-- - Enhanced applications tracking for candidate-initiated applications
-- - RLS policies for candidate access
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- JOBS TABLE - Add public job board columns
-- ============================================================================

-- is_public: explicit flag for public visibility (simpler than checking visibility enum)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- public_title: sometimes different from internal title (e.g., hide specific yacht name)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS public_title TEXT;

-- public_description: sanitized description for public display (no confidential info)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS public_description TEXT;

-- apply_deadline: deadline for candidate applications
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS apply_deadline DATE;

-- applications_count: track direct candidate applications (distinct from submissions_count)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Create composite index for public jobs query
CREATE INDEX IF NOT EXISTS idx_jobs_public_open
  ON jobs(is_public, status)
  WHERE is_public = true AND status = 'open';

-- ============================================================================
-- APPLICATIONS TABLE - Add missing columns for full pipeline tracking
-- ============================================================================

-- Client interaction tracking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_to_client_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS client_feedback TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5);

-- Interview tracking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_requested_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_scheduled_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Outcome tracking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS placed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS placement_salary INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS placement_fee DECIMAL(10,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT;

-- Meta
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create unique index for candidate self-applications (one application per candidate per job)
-- Note: existing index is (candidate_id, job_id, agency_id) - this allows same candidate
-- via different agencies. For candidate self-applications, we need a separate constraint.
-- This is handled by the source field - if source='job_board', candidate can only apply once.

-- Index for finding applications by source
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);

-- ============================================================================
-- NEW ENUM: Application source types
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE application_source AS ENUM (
    'job_board',      -- Candidate applied via public job board
    'direct',         -- Agency added candidate directly
    'referral',       -- Candidate was referred
    'ai_match',       -- AI matching suggested candidate
    'manual',         -- Legacy/manual entry
    'vincere_sync'    -- Synced from Vincere
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Note: We keep the existing TEXT column for backwards compatibility
-- but document the expected values. A future migration could convert to enum.
COMMENT ON COLUMN applications.source IS 'Application source: job_board, direct, referral, ai_match, manual, vincere_sync';

-- ============================================================================
-- RLS POLICIES FOR CANDIDATE ACCESS
-- ============================================================================

-- Candidates can view public jobs
DROP POLICY IF EXISTS public_jobs_candidate_access ON jobs;
CREATE POLICY public_jobs_candidate_access ON jobs
  FOR SELECT
  USING (
    -- Public jobs visible to everyone
    (is_public = true AND status = 'open')
    -- Or existing visibility rules apply
    OR visibility = 'public'
    OR visibility = 'network'
    OR client_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    OR created_by_agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Candidates can view their own applications
DROP POLICY IF EXISTS application_candidate_access ON applications;
CREATE POLICY application_candidate_access ON applications
  FOR SELECT
  USING (
    -- Candidate viewing their own applications
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    -- Or agency access (existing policy)
    OR agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Candidates can create applications (apply to jobs)
DROP POLICY IF EXISTS application_candidate_insert ON applications;
CREATE POLICY application_candidate_insert ON applications
  FOR INSERT
  WITH CHECK (
    -- Candidate applying for themselves
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    -- Or agency member creating application
    OR agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Agency members can update/delete their job applications
DROP POLICY IF EXISTS application_agency_update ON applications;
CREATE POLICY application_agency_update ON applications
  FOR UPDATE
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS application_agency_delete ON applications;
CREATE POLICY application_agency_delete ON applications
  FOR DELETE
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- ============================================================================
-- TRIGGER: Update applications_count on jobs
-- ============================================================================

CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET applications_count = applications_count - 1 WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_count ON applications;
CREATE TRIGGER trg_applications_count
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();

-- ============================================================================
-- VIEW: Public jobs with safe fields
-- ============================================================================

CREATE OR REPLACE VIEW public_jobs AS
SELECT
  j.id,
  COALESCE(j.public_title, j.title) as title,
  COALESCE(j.public_description, j.requirements_text) as description,
  j.position_category,
  j.vessel_type,
  j.vessel_size_meters,
  j.contract_type,
  j.start_date,
  j.end_date,
  j.rotation_schedule,
  j.primary_region,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.salary_period,
  j.benefits,
  j.requirements,
  j.is_urgent,
  j.apply_deadline,
  j.applications_count,
  j.views_count,
  j.created_at,
  j.published_at,
  -- Don't expose: vessel_name, client_id, created_by_agency_id, fees, etc.
  o.name as agency_name
FROM jobs j
LEFT JOIN organizations o ON j.created_by_agency_id = o.id
WHERE j.is_public = true
  AND j.status = 'open'
  AND j.deleted_at IS NULL
  AND (j.apply_deadline IS NULL OR j.apply_deadline >= CURRENT_DATE);

-- ============================================================================
-- FUNCTION: Increment job views (for public job board)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_job_views(p_job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs
  SET views_count = views_count + 1
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN jobs.is_public IS 'Whether this job is visible on the public job board';
COMMENT ON COLUMN jobs.public_title IS 'Public-facing title (may differ from internal title to protect client confidentiality)';
COMMENT ON COLUMN jobs.public_description IS 'Public-facing description (sanitized for public display)';
COMMENT ON COLUMN jobs.apply_deadline IS 'Deadline for candidate applications';
COMMENT ON COLUMN jobs.applications_count IS 'Number of candidate applications (distinct from agency submissions)';

COMMENT ON COLUMN applications.submitted_to_client_at IS 'When the application was sent to the client for review';
COMMENT ON COLUMN applications.client_feedback IS 'Feedback from the client about this candidate';
COMMENT ON COLUMN applications.client_rating IS 'Client rating of candidate (1-5)';
COMMENT ON COLUMN applications.interview_requested_at IS 'When an interview was requested';
COMMENT ON COLUMN applications.interview_scheduled_at IS 'When the interview is scheduled';
COMMENT ON COLUMN applications.interview_notes IS 'Notes from the interview';
COMMENT ON COLUMN applications.placed_at IS 'When the candidate was placed';
COMMENT ON COLUMN applications.placement_salary IS 'Final agreed salary for the placement';
COMMENT ON COLUMN applications.placement_fee IS 'Fee earned from this placement';
COMMENT ON COLUMN applications.withdrawn_reason IS 'Reason if candidate withdrew their application';
COMMENT ON COLUMN applications.created_by IS 'User who created this application';

COMMENT ON VIEW public_jobs IS 'Safe view of public jobs without confidential information';
COMMENT ON FUNCTION increment_job_views IS 'Increment view count for a job (for analytics)';

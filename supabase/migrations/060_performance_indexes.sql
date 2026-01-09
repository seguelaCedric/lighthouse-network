-- Performance indexes for dashboard queries
-- These compound indexes optimize common query patterns identified in performance analysis

-- Compound index for submissions filtered by job_id and status
-- Used by: Client Dashboard (shortlisted candidates query), agency queries
CREATE INDEX IF NOT EXISTS idx_submissions_job_status
  ON submissions(job_id, status);

-- Index for briefs filtered by assigned_agency_id
-- Used by: Agency Dashboard briefs queries
CREATE INDEX IF NOT EXISTS idx_briefs_assigned_agency
  ON briefs(assigned_agency_id);

-- Compound index for briefs filtered by assigned_agency_id and status
-- Used by: Agency Dashboard new briefs count
CREATE INDEX IF NOT EXISTS idx_briefs_agency_status
  ON briefs(assigned_agency_id, status);

-- Compound index for jobs filtered by created_by_agency_id and status
-- Used by: Agency Dashboard open jobs count, Jobs Pipeline
CREATE INDEX IF NOT EXISTS idx_jobs_agency_status
  ON jobs(created_by_agency_id, status)
  WHERE deleted_at IS NULL;

-- Compound index for applications filtered by agency_id and stage
-- Used by: Agency Dashboard placements count
CREATE INDEX IF NOT EXISTS idx_applications_agency_stage
  ON applications(agency_id, stage);

-- Index for interview_requests filtered by client_id and status
-- Used by: Client Dashboard interviews scheduled
CREATE INDEX IF NOT EXISTS idx_interview_requests_client_status
  ON interview_requests(client_id, status);

-- Compound index for submissions filtered by job_id and submitted_at for recent queries
-- Used by: Client Dashboard recent shortlisted candidates
CREATE INDEX IF NOT EXISTS idx_submissions_job_submitted
  ON submissions(job_id, submitted_at DESC)
  WHERE status = 'shortlisted';

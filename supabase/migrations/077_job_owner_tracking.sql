-- Migration: 077_job_owner_tracking
-- Description: Add job owner tracking columns for primary owner (BD) and assigned recruiter
-- This enables routing application emails to the assigned recruiter and analytics tracking

-- Primary owner: Person who brought the enquiry (BD/sales side)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_owner_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_owner_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_owner_email TEXT;

-- Assigned recruiter: Secondary owner responsible for filling the job
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_recruiter_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_recruiter_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_recruiter_email TEXT;

-- Track when owners were last synced from Vincere
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owners_synced_at TIMESTAMPTZ;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_jobs_primary_owner_id
  ON jobs(primary_owner_id)
  WHERE primary_owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_recruiter_id
  ON jobs(assigned_recruiter_id)
  WHERE assigned_recruiter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_recruiter_email
  ON jobs(assigned_recruiter_email)
  WHERE assigned_recruiter_email IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN jobs.primary_owner_id IS 'Vincere user ID of primary owner (BD who brought the enquiry)';
COMMENT ON COLUMN jobs.primary_owner_name IS 'Display name of primary owner';
COMMENT ON COLUMN jobs.primary_owner_email IS 'Email of primary owner';
COMMENT ON COLUMN jobs.assigned_recruiter_id IS 'Vincere user ID of secondary owner (recruiter assigned to fill the job)';
COMMENT ON COLUMN jobs.assigned_recruiter_name IS 'Display name of assigned recruiter';
COMMENT ON COLUMN jobs.assigned_recruiter_email IS 'Email of assigned recruiter - used for application notification routing';
COMMENT ON COLUMN jobs.owners_synced_at IS 'Timestamp when owners were last synced from Vincere API';

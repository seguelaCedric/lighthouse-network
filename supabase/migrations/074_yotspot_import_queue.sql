-- Yotspot Import Queue
-- Tracks candidate import requests from Yotspot job board notifications
-- Uses n8n for email monitoring, this queue handles scraping and processing

-- =============================================================================
-- Job Mapping Table
-- =============================================================================
-- Maps Yotspot job IDs to Lighthouse/Vincere jobs
-- Manual mapping for now, can be automated later

CREATE TABLE yotspot_job_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Yotspot identifiers
  yotspot_job_id TEXT NOT NULL,
  yotspot_job_ref TEXT,
  yotspot_position_title TEXT,

  -- Lighthouse/Vincere job
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique mapping per Yotspot job
  UNIQUE(yotspot_job_id)
);

-- Index for quick lookups
CREATE INDEX idx_yotspot_job_mapping_yotspot_id
  ON yotspot_job_mapping(yotspot_job_id)
  WHERE is_active = true;

CREATE INDEX idx_yotspot_job_mapping_job_id
  ON yotspot_job_mapping(job_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER trg_yotspot_job_mapping_updated_at
  BEFORE UPDATE ON yotspot_job_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE yotspot_job_mapping ENABLE ROW LEVEL SECURITY;

-- Service role can manage mappings
CREATE POLICY "Service role can manage job mappings"
  ON yotspot_job_mapping
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view mappings (for admin UI)
CREATE POLICY "Authenticated users can view job mappings"
  ON yotspot_job_mapping
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE yotspot_job_mapping IS 'Maps Yotspot job IDs to Lighthouse jobs for candidate import matching';
COMMENT ON COLUMN yotspot_job_mapping.yotspot_job_id IS 'Yotspot job ID (e.g., 3858143)';
COMMENT ON COLUMN yotspot_job_mapping.yotspot_job_ref IS 'Yotspot job reference (e.g., 59309)';

-- =============================================================================
-- Import Queue Table
-- =============================================================================

-- Create the import queue table
CREATE TABLE yotspot_import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source data from n8n/email
  applicant_url TEXT NOT NULL,
  yotspot_job_ref TEXT,
  yotspot_job_id TEXT,
  position_title TEXT,
  match_percentage INTEGER,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scraping', 'processing', 'completed', 'failed', 'duplicate', 'skipped')),

  -- Scraped candidate data
  scraped_at TIMESTAMPTZ,
  candidate_name TEXT,
  candidate_email TEXT,
  candidate_phone TEXT,
  scraped_data JSONB,
  cv_url TEXT,
  photo_url TEXT,

  -- Linked Lighthouse records
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Match scoring results
  match_score NUMERIC,
  match_assessment TEXT,
  notified_at TIMESTAMPTZ,

  -- Retry handling
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for finding pending items to process
CREATE INDEX idx_yotspot_import_queue_pending
  ON yotspot_import_queue(next_retry_at)
  WHERE status = 'pending';

-- Index for finding items ready to notify
CREATE INDEX idx_yotspot_import_queue_notify
  ON yotspot_import_queue(completed_at)
  WHERE status = 'completed' AND notified_at IS NULL AND match_score >= 70;

-- Index for monitoring by status
CREATE INDEX idx_yotspot_import_queue_status
  ON yotspot_import_queue(status, created_at);

-- Index for duplicate detection by URL
CREATE INDEX idx_yotspot_import_queue_url
  ON yotspot_import_queue(applicant_url, created_at);

-- Auto-update updated_at timestamp
CREATE TRIGGER trg_yotspot_import_queue_updated_at
  BEFORE UPDATE ON yotspot_import_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE yotspot_import_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access import queue (it's internal infrastructure)
CREATE POLICY "Service role can manage import queue"
  ON yotspot_import_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE yotspot_import_queue IS 'Queue for Yotspot candidate imports from job board notifications';
COMMENT ON COLUMN yotspot_import_queue.applicant_url IS 'URL to view applicant on Yotspot (from email notification)';
COMMENT ON COLUMN yotspot_import_queue.yotspot_job_ref IS 'Yotspot job reference number (e.g., 59309)';
COMMENT ON COLUMN yotspot_import_queue.yotspot_job_id IS 'Yotspot job ID (e.g., 3858143)';
COMMENT ON COLUMN yotspot_import_queue.status IS 'Processing status: pending, scraping, processing, completed, failed, duplicate, skipped';
COMMENT ON COLUMN yotspot_import_queue.scraped_data IS 'Full JSON data scraped from Yotspot candidate profile';
COMMENT ON COLUMN yotspot_import_queue.match_score IS 'AI-calculated match score against the job (0-100)';
COMMENT ON COLUMN yotspot_import_queue.match_assessment IS 'AI-generated assessment of candidate fit';

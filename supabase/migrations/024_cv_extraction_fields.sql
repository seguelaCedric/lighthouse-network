-- ============================================================================
-- CV EXTRACTION FIELDS MIGRATION
-- ============================================================================
-- Adds structured fields extracted from CV text using AI
-- Enables effective hard SQL filters in V4 search
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ADD 'villa' TO position_category ENUM
-- ----------------------------------------------------------------------------

ALTER TYPE position_category ADD VALUE IF NOT EXISTS 'villa';

-- ----------------------------------------------------------------------------
-- ADD CV EXTRACTION FIELDS TO CANDIDATES TABLE
-- ----------------------------------------------------------------------------

-- Extraction metadata
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS cv_extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cv_extraction_version INT DEFAULT 1;

-- Positions (both normalized array and detailed JSONB)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS positions_held TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS positions_extracted JSONB DEFAULT '[]';

-- Licenses (detailed, separate from certifications)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS licenses_extracted JSONB DEFAULT '[]';

-- Languages (detailed with proficiency)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS languages_extracted JSONB DEFAULT '[]';

-- Skills/keywords for search
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS cv_skills TEXT[] DEFAULT '{}';

-- Work experience (detailed)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS yacht_experience_extracted JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS villa_experience_extracted JSONB DEFAULT '[]';

-- Education
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS education_extracted JSONB DEFAULT '[]';

-- References with contact details
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS references_extracted JSONB DEFAULT '[]';

-- Certifications (detailed, extends existing boolean flags)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS certifications_extracted JSONB DEFAULT '[]';

-- Extraction confidence score
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(3,2);

-- Extraction notes/warnings
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS extraction_notes TEXT[];

-- ----------------------------------------------------------------------------
-- INDEXES FOR EFFICIENT FILTERING
-- ----------------------------------------------------------------------------

-- GIN index for positions array (enables @> contains queries)
CREATE INDEX IF NOT EXISTS idx_candidates_positions_held
  ON candidates USING GIN (positions_held);

-- GIN index for skills array
CREATE INDEX IF NOT EXISTS idx_candidates_cv_skills
  ON candidates USING GIN (cv_skills);

-- Index for extraction status (find candidates needing extraction)
CREATE INDEX IF NOT EXISTS idx_candidates_cv_extracted_at
  ON candidates (cv_extracted_at)
  WHERE cv_extracted_at IS NULL;

-- Composite index for V4 search hard filters
CREATE INDEX IF NOT EXISTS idx_candidates_v4_filters
  ON candidates (
    years_experience,
    position_category,
    has_stcw,
    has_eng1,
    availability_status
  )
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- CV EXTRACTION QUEUE TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cv_extraction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Ensure we don't queue the same document twice
  CONSTRAINT unique_cv_extraction_queue UNIQUE (candidate_id, document_id)
);

-- Index for worker to find pending jobs
CREATE INDEX IF NOT EXISTS idx_cv_extraction_queue_pending
  ON cv_extraction_queue (created_at)
  WHERE status = 'pending';

-- Index for finding failed jobs for retry
CREATE INDEX IF NOT EXISTS idx_cv_extraction_queue_failed
  ON cv_extraction_queue (attempts, created_at)
  WHERE status = 'failed' AND attempts < 3;

-- ----------------------------------------------------------------------------
-- HELPER FUNCTION: Queue CV for extraction
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION queue_cv_extraction(
  p_candidate_id UUID,
  p_document_id UUID
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  -- Insert into queue, skip if already exists
  INSERT INTO cv_extraction_queue (candidate_id, document_id)
  VALUES (p_candidate_id, p_document_id)
  ON CONFLICT (candidate_id, document_id)
  DO UPDATE SET
    status = CASE
      WHEN cv_extraction_queue.status = 'failed' AND cv_extraction_queue.attempts < 3
      THEN 'pending'
      ELSE cv_extraction_queue.status
    END,
    attempts = CASE
      WHEN cv_extraction_queue.status = 'failed' AND cv_extraction_queue.attempts < 3
      THEN 0
      ELSE cv_extraction_queue.attempts
    END
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- TRIGGER: Auto-queue new CV documents for extraction
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_queue_cv_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if it's a CV document with extracted text
  IF NEW.type = 'cv' AND NEW.extracted_text IS NOT NULL AND NEW.candidate_id IS NOT NULL THEN
    PERFORM queue_cv_extraction(NEW.candidate_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_document_cv_extraction ON documents;

CREATE TRIGGER trigger_document_cv_extraction
  AFTER INSERT OR UPDATE OF extracted_text ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_queue_cv_extraction();

-- ----------------------------------------------------------------------------
-- COMMENTS FOR DOCUMENTATION
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN candidates.cv_extracted_at IS 'Timestamp when CV was last extracted using AI';
COMMENT ON COLUMN candidates.cv_extraction_version IS 'Version of extraction algorithm used';
COMMENT ON COLUMN candidates.positions_held IS 'Array of normalized position names for filtering';
COMMENT ON COLUMN candidates.positions_extracted IS 'JSONB array of positions with raw and normalized forms';
COMMENT ON COLUMN candidates.licenses_extracted IS 'JSONB array of maritime licenses with details';
COMMENT ON COLUMN candidates.languages_extracted IS 'JSONB array of languages with proficiency levels';
COMMENT ON COLUMN candidates.cv_skills IS 'Array of searchable skills/keywords from CV';
COMMENT ON COLUMN candidates.yacht_experience_extracted IS 'JSONB array of yacht work experience';
COMMENT ON COLUMN candidates.villa_experience_extracted IS 'JSONB array of villa/estate work experience';
COMMENT ON COLUMN candidates.education_extracted IS 'JSONB array of education details';
COMMENT ON COLUMN candidates.references_extracted IS 'JSONB array of reference contacts from CV';
COMMENT ON COLUMN candidates.certifications_extracted IS 'JSONB array of certifications with details';
COMMENT ON COLUMN candidates.extraction_confidence IS 'AI confidence score 0-1 for extraction quality';
COMMENT ON COLUMN candidates.extraction_notes IS 'Warnings or notes from extraction process';

COMMENT ON TABLE cv_extraction_queue IS 'Queue for async CV extraction processing';

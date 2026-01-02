-- ============================================================================
-- CANDIDATE BIO GENERATION SCHEMA
-- ============================================================================
-- Adds fields to store pre-generated candidate bios for both anonymous
-- (public match page) and named (authenticated users) display.
--
-- The bio_full field stores the complete named bio. Anonymous versions
-- are derived at runtime by stripping identifying information.
-- ============================================================================

-- Add bio fields to candidates table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS bio_full TEXT,
  ADD COLUMN IF NOT EXISTS bio_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio_generation_version INT DEFAULT 1;

-- Index for finding candidates needing bio generation
-- (those with CV extraction but no bio)
CREATE INDEX IF NOT EXISTS idx_candidates_bio_pending
  ON candidates (cv_extracted_at)
  WHERE bio_generated_at IS NULL
    AND cv_extracted_at IS NOT NULL
    AND deleted_at IS NULL;

-- Index for finding candidates by bio generation version
-- (useful for re-running generation with updated prompts)
CREATE INDEX IF NOT EXISTS idx_candidates_bio_version
  ON candidates (bio_generation_version)
  WHERE bio_full IS NOT NULL
    AND deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN candidates.bio_full IS 'Full 5-paragraph candidate bio with name (AI-generated from CV)';
COMMENT ON COLUMN candidates.bio_generated_at IS 'Timestamp when bio was last generated';
COMMENT ON COLUMN candidates.bio_generation_version IS 'Version of bio generation algorithm used (for tracking prompt updates)';

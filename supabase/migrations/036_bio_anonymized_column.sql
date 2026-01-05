-- ============================================================================
-- BIO ANONYMIZATION ARCHITECTURE
-- ============================================================================
-- Adds bio_anonymized column for AI-generated anonymized bios.
-- This enables a two-column approach where:
--   - bio_full: Contains all names (yachts, companies, people) for paying clients
--   - bio_anonymized: AI-removed all PII for public/lead gen use
-- ============================================================================

-- Add bio_anonymized column
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS bio_anonymized TEXT DEFAULT NULL;

-- Update comments to clarify usage
COMMENT ON COLUMN candidates.bio_full IS
  'Complete professional bio WITH all names (person, yacht, company, property names). Used for paying agency clients who have full access rights.';

COMMENT ON COLUMN candidates.bio_anonymized IS
  'AI-anonymized version of bio_full. Removes ALL PII including person names, yacht names, company names, and property names. Used for public lead generation and match reasoning.';

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_candidates_bio_anonymized
  ON candidates(id) WHERE bio_anonymized IS NOT NULL;

-- Index for finding candidates that need anonymization backfill
CREATE INDEX IF NOT EXISTS idx_candidates_needs_anonymization
  ON candidates(id) WHERE bio_full IS NOT NULL AND bio_anonymized IS NULL;

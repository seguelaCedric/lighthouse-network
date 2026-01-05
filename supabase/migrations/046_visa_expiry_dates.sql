-- Migration: Add expiry date columns for visa tracking
-- This allows candidates to track when their B1/B2 and Schengen visas expire

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS b1b2_expiry DATE,
ADD COLUMN IF NOT EXISTS schengen_expiry DATE;

-- Add comments for documentation
COMMENT ON COLUMN candidates.b1b2_expiry IS 'Expiry date for B1/B2 US visa';
COMMENT ON COLUMN candidates.schengen_expiry IS 'Expiry date for Schengen visa';

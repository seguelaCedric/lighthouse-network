-- ============================================================================
-- ADD 'wellness' TO position_category ENUM
-- ============================================================================
-- This migration adds the 'wellness' category to properly classify spa therapists,
-- massage therapists, fitness trainers, and other wellness professionals.
-- This enables accurate department filtering in AI matching.
-- ============================================================================

-- Add 'wellness' to position_category enum
ALTER TYPE position_category ADD VALUE IF NOT EXISTS 'wellness';

-- Note: Existing candidates with wellness roles may have position_category = 'other'
-- or NULL. A backfill script should be run to reclassify them based on their
-- primary_position field:
-- UPDATE candidates
-- SET position_category = 'wellness'
-- WHERE position_category IS NULL OR position_category = 'other'
-- AND (
--   primary_position ILIKE '%spa%'
--   OR primary_position ILIKE '%therapist%'
--   OR primary_position ILIKE '%massage%'
--   OR primary_position ILIKE '%wellness%'
--   OR primary_position ILIKE '%beauty%'
--   OR primary_position ILIKE '%fitness%'
--   OR primary_position ILIKE '%yoga%'
--   OR primary_position ILIKE '%pilates%'
--   OR primary_position ILIKE '%trainer%'
-- );

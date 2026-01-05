-- Add candidate_type to categorize candidates by work domain
DO $$ BEGIN
  CREATE TYPE candidate_type AS ENUM (
    'yacht_crew',
    'household_staff',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS candidate_type candidate_type DEFAULT 'yacht_crew';

-- Backfill existing candidates (legacy data is yacht crew)
UPDATE candidates
SET candidate_type = 'yacht_crew'
WHERE candidate_type IS NULL;

COMMENT ON COLUMN candidates.candidate_type IS 'High-level candidate category: yacht_crew, household_staff, or other';

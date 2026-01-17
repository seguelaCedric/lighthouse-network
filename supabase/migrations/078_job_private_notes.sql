-- Migration: Add private_notes column to jobs table
-- Purpose: Store confidential recruiter notes for AI matching (never exposed to clients)

-- Add private_notes column for confidential recruiter context
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS private_notes TEXT;

-- Add comment documenting the column's purpose and security requirements
COMMENT ON COLUMN jobs.private_notes IS
  'Confidential recruiter notes (client preferences, personality fit, budget flexibility). '
  'Used by AI matching but NEVER exposed to clients or public APIs. '
  'Access restricted to agency members who own the job.';

-- Verify the public_jobs view exists and check its columns
-- Note: The existing public_jobs view should NOT include private_notes
-- If it does, we need to recreate it without that column
DO $$
BEGIN
  -- Check if public_jobs view exists
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'public_jobs'
  ) THEN
    -- Check if private_notes is accidentally included
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'public_jobs'
        AND column_name = 'private_notes'
    ) THEN
      RAISE NOTICE 'WARNING: public_jobs view includes private_notes - this should be fixed!';
    ELSE
      RAISE NOTICE 'OK: public_jobs view does not include private_notes';
    END IF;
  END IF;
END $$;

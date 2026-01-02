-- ============================================================================
-- Add avatar_url column to candidates table
-- ============================================================================
-- Photos are uploaded to the avatars storage bucket during Vincere sync.
-- This column stores the public URL to display candidate profile photos.
-- ============================================================================

-- Add avatar_url column to candidates (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE candidates ADD COLUMN avatar_url TEXT;
    COMMENT ON COLUMN candidates.avatar_url IS 'URL to candidate profile photo in avatars storage bucket';
  END IF;
END $$;

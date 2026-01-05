-- Add 'both' option to candidate_type enum
DO $$ BEGIN
  ALTER TYPE candidate_type ADD VALUE IF NOT EXISTS 'both';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ============================================================================
-- USER TYPES - Supporting different user portals
-- ============================================================================
-- Adds user_type to distinguish between recruiters, candidates, and clients
-- ============================================================================

-- Add user_type column to users table
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN user_type text DEFAULT 'recruiter';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create index for user_type queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Add constraint to limit values
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('recruiter', 'candidate', 'client'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comment
COMMENT ON COLUMN users.user_type IS 'Type of user: recruiter (agency staff), candidate (crew member), client (yacht owner/manager)';

-- Update existing users to be recruiters (they're all agency users currently)
UPDATE users SET user_type = 'recruiter' WHERE user_type IS NULL;

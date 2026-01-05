-- Profile Wizard Enhancements Migration
-- Adds second_license field and creates candidate_certifications table for checklist pattern

-- Add second_license field to candidates table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS second_license TEXT;

-- Add profile completion timestamp
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Create certification checklist table
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Certification type identifier (e.g., stcw_firefighting, food_hygiene_l2, wset_l1, etc.)
  certification_type TEXT NOT NULL,

  -- Whether the candidate has this certification
  has_certification BOOLEAN DEFAULT TRUE,

  -- Optional expiry date for time-limited certifications
  expiry_date DATE,

  -- For "other" certifications, allows custom name
  custom_name TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one entry per candidate per certification type
  UNIQUE(candidate_id, certification_type)
);

-- Create index for faster candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidate_certifications_candidate
  ON candidate_certifications(candidate_id);

-- Create index for certification type filtering
CREATE INDEX IF NOT EXISTS idx_candidate_certifications_type
  ON candidate_certifications(certification_type);

-- Enable Row Level Security
ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own certifications
CREATE POLICY "Users can view their own certifications"
  ON candidate_certifications FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can manage their own certifications
CREATE POLICY "Users can manage their own certifications"
  ON candidate_certifications FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE candidate_certifications IS
  'Certification checklist for profile edit wizard - replaces dynamic certifications array';

COMMENT ON COLUMN candidate_certifications.certification_type IS
  'Predefined certification type identifier (stcw_firefighting, food_hygiene_l2, wset_l1, etc.)';

COMMENT ON COLUMN candidate_certifications.custom_name IS
  'Custom certification name for "other" type certifications';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_candidate_certifications_updated_at ON candidate_certifications;
CREATE TRIGGER update_candidate_certifications_updated_at
  BEFORE UPDATE ON candidate_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

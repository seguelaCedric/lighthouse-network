-- ============================================================================
-- Salary Guide Leads Table
-- ============================================================================
-- Stores email addresses of users who requested the salary guide PDF
-- ============================================================================

-- Create salary_guide_leads table
CREATE TABLE IF NOT EXISTS salary_guide_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'salary_guide_page',
  sent_at TIMESTAMPTZ,
  email_id TEXT, -- Resend email ID for tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_salary_guide_leads_email ON salary_guide_leads(email);
CREATE INDEX IF NOT EXISTS idx_salary_guide_leads_requested_at ON salary_guide_leads(requested_at DESC);

-- Add comment
COMMENT ON TABLE salary_guide_leads IS 'Stores email addresses of users who requested the 2026 salary guide PDF';

-- Enable RLS
ALTER TABLE salary_guide_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users with admin role can view leads
CREATE POLICY "Admin can view salary guide leads"
  ON salary_guide_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Policy: Anyone can insert (for public form submissions)
CREATE POLICY "Anyone can request salary guide"
  ON salary_guide_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_salary_guide_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_salary_guide_leads_updated_at
  BEFORE UPDATE ON salary_guide_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_guide_leads_updated_at();


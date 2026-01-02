-- Migration: Employer Briefs
-- Description: Create employer_briefs table for hiring briefs submitted by employers

-- Employer briefs table
CREATE TABLE employer_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  employer_id UUID NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,

  -- Brief details
  title TEXT NOT NULL,
  hiring_for TEXT NOT NULL CHECK (hiring_for IN ('yacht', 'household', 'both')),

  -- Yacht-specific fields
  vessel_name TEXT,
  vessel_type TEXT,
  vessel_size_meters INTEGER,

  -- Household-specific fields
  property_type TEXT,
  property_location TEXT,

  -- Positions and requirements
  positions_needed TEXT[] NOT NULL,
  experience_years_min INTEGER,
  additional_requirements TEXT,

  -- Timeline and contract
  timeline TEXT CHECK (timeline IN ('immediate', '1_month', '3_months', 'exploring') OR timeline IS NULL),
  contract_type TEXT CHECK (contract_type IN ('permanent', 'rotational', 'seasonal', 'temporary') OR contract_type IS NULL),
  start_date DATE,
  notes TEXT,

  -- Status and workflow
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewing', 'matching', 'shortlisted', 'closed')),
  candidates_matched INTEGER DEFAULT 0,

  -- Agency handling
  assigned_recruiter_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE employer_briefs IS 'Hiring briefs submitted by employers for matching with candidates';
COMMENT ON COLUMN employer_briefs.status IS 'Workflow status: draft, submitted, reviewing, matching, shortlisted, closed';
COMMENT ON COLUMN employer_briefs.candidates_matched IS 'Number of candidates matched to this brief';

-- Enable RLS
ALTER TABLE employer_briefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role has full access
CREATE POLICY "Service role manages employer briefs"
  ON employer_briefs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated agency users can read all briefs
CREATE POLICY "Authenticated users can read employer briefs"
  ON employer_briefs
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated agency users can update briefs
CREATE POLICY "Authenticated users can update employer briefs"
  ON employer_briefs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_employer_briefs_employer ON employer_briefs(employer_id);
CREATE INDEX idx_employer_briefs_status ON employer_briefs(status);
CREATE INDEX idx_employer_briefs_created_at ON employer_briefs(created_at DESC);
CREATE INDEX idx_employer_briefs_assigned_recruiter ON employer_briefs(assigned_recruiter_id)
  WHERE assigned_recruiter_id IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE TRIGGER employer_briefs_updated_at
  BEFORE UPDATE ON employer_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_accounts_updated_at();

-- Brief shortlist table (candidates matched to briefs)
CREATE TABLE employer_brief_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  brief_id UUID NOT NULL REFERENCES employer_briefs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Match details
  match_score DECIMAL(5,2), -- AI match score 0-100
  match_reasons TEXT[], -- Array of matching reasons
  added_by UUID REFERENCES users(id),

  -- Employer feedback
  employer_status TEXT DEFAULT 'pending' CHECK (employer_status IN ('pending', 'interested', 'not_interested', 'interviewed', 'hired', 'rejected')),
  employer_notes TEXT,
  viewed_at TIMESTAMPTZ,
  feedback_at TIMESTAMPTZ,

  -- Workflow
  interview_scheduled BOOLEAN DEFAULT false,
  interview_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint
  UNIQUE(brief_id, candidate_id)
);

COMMENT ON TABLE employer_brief_candidates IS 'Candidates matched to employer briefs (shortlist)';
COMMENT ON COLUMN employer_brief_candidates.match_score IS 'AI-generated match score 0-100';
COMMENT ON COLUMN employer_brief_candidates.employer_status IS 'Employer feedback on this candidate';

-- Enable RLS
ALTER TABLE employer_brief_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brief candidates
CREATE POLICY "Service role manages brief candidates"
  ON employer_brief_candidates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read brief candidates"
  ON employer_brief_candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update brief candidates"
  ON employer_brief_candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_brief_candidates_brief ON employer_brief_candidates(brief_id);
CREATE INDEX idx_brief_candidates_candidate ON employer_brief_candidates(candidate_id);
CREATE INDEX idx_brief_candidates_status ON employer_brief_candidates(employer_status);
CREATE INDEX idx_brief_candidates_match_score ON employer_brief_candidates(match_score DESC);

-- Trigger for updated_at
CREATE TRIGGER employer_brief_candidates_updated_at
  BEFORE UPDATE ON employer_brief_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_accounts_updated_at();

-- Function to update candidates_matched count on brief
CREATE OR REPLACE FUNCTION update_brief_candidates_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE employer_briefs
    SET candidates_matched = (
      SELECT COUNT(*) FROM employer_brief_candidates WHERE brief_id = NEW.brief_id
    )
    WHERE id = NEW.brief_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE employer_briefs
    SET candidates_matched = (
      SELECT COUNT(*) FROM employer_brief_candidates WHERE brief_id = OLD.brief_id
    )
    WHERE id = OLD.brief_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_brief_candidates_count_trigger
  AFTER INSERT OR DELETE ON employer_brief_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_brief_candidates_count();

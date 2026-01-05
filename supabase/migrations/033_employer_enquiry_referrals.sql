-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Employer Enquiry Referral System
-- ============================================================================
-- Enables crew members to refer employer leads and earn EUR200 per placement
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- EMPLOYER ENQUIRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS employer_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who referred this employer
  referrer_id UUID REFERENCES candidates(id) NOT NULL,

  -- Employer/Client details
  company_name TEXT NOT NULL,        -- Company or yacht name
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,                        -- Free-text notes from referrer

  -- Status tracking
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted',      -- Initial submission
    'under_review',   -- Admin is reviewing
    'verified',       -- Confirmed as genuine lead
    'invalid',        -- Not a genuine lead
    'duplicate'       -- Already exists in system
  )),

  -- Timestamps for status progression
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,                 -- Admin notes on verification

  -- Link to client once created/verified
  client_id UUID REFERENCES organizations(id),

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employer_enquiries_referrer ON employer_enquiries(referrer_id);
CREATE INDEX IF NOT EXISTS idx_employer_enquiries_status ON employer_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_employer_enquiries_client ON employer_enquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_employer_enquiries_submitted ON employer_enquiries(submitted_at);

-- ============================================================================
-- EMPLOYER ENQUIRY JOBS TABLE
-- Links enquiries to jobs created from them
-- ============================================================================

CREATE TABLE IF NOT EXISTS employer_enquiry_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enquiry_id UUID REFERENCES employer_enquiries(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,

  linked_at TIMESTAMPTZ DEFAULT NOW(),
  linked_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(enquiry_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_enquiry_jobs_enquiry ON employer_enquiry_jobs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_jobs_job ON employer_enquiry_jobs(job_id);

-- ============================================================================
-- EMPLOYER ENQUIRY REWARDS TABLE
-- Ledger of EUR200 rewards for each placement
-- ============================================================================

CREATE TABLE IF NOT EXISTS employer_enquiry_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enquiry_id UUID REFERENCES employer_enquiries(id) NOT NULL,
  job_id UUID REFERENCES jobs(id),
  referrer_id UUID REFERENCES candidates(id) NOT NULL,

  -- Placement details (if linked)
  placed_candidate_id UUID REFERENCES candidates(id),
  placement_confirmed_at TIMESTAMPTZ,

  -- Fixed reward amount
  amount INTEGER NOT NULL DEFAULT 20000,  -- EUR200 in cents
  currency TEXT DEFAULT 'EUR',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Placement confirmed, reward created
    'approved',   -- Approved for payout
    'paid',       -- Paid out
    'cancelled'   -- Cancelled (e.g., placement fell through)
  )),

  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN (
    'bank_transfer', 'paypal', 'revolut', 'wise', 'credit'
  )),
  payment_reference TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_rewards_enquiry ON employer_enquiry_rewards(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_rewards_referrer ON employer_enquiry_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_rewards_status ON employer_enquiry_rewards(status);
CREATE INDEX IF NOT EXISTS idx_enquiry_rewards_job ON employer_enquiry_rewards(job_id);

-- ============================================================================
-- EMPLOYER ENQUIRY SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS employer_enquiry_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  program_active BOOLEAN DEFAULT TRUE,
  program_name TEXT DEFAULT 'Employer Referral Program',
  program_description TEXT DEFAULT 'Refer employers looking to hire crew and earn EUR200 for each successful placement.',

  -- Reward amount (in cents)
  placement_reward INTEGER DEFAULT 20000,  -- EUR200

  -- Requirements
  referrer_min_tier TEXT DEFAULT 'basic' CHECK (referrer_min_tier IN (
    'unverified', 'basic', 'identity', 'references', 'verified', 'premium'
  )),

  -- Limits
  max_enquiries_per_month INTEGER DEFAULT 10,
  min_payout_amount INTEGER DEFAULT 20000,  -- EUR200 minimum

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings (singleton)
INSERT INTO employer_enquiry_settings (id)
VALUES ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE employer_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_enquiry_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_enquiry_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_enquiry_settings ENABLE ROW LEVEL SECURITY;

-- Crew can view their own enquiries
DROP POLICY IF EXISTS "Crew view own enquiries" ON employer_enquiries;
CREATE POLICY "Crew view own enquiries" ON employer_enquiries
  FOR SELECT USING (
    referrer_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Crew can insert new enquiries
DROP POLICY IF EXISTS "Crew submit enquiries" ON employer_enquiries;
CREATE POLICY "Crew submit enquiries" ON employer_enquiries
  FOR INSERT WITH CHECK (
    referrer_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Recruiters/admins manage all enquiries
DROP POLICY IF EXISTS "Recruiters manage enquiries" ON employer_enquiries;
CREATE POLICY "Recruiters manage enquiries" ON employer_enquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_type = 'recruiter' OR role IN ('admin', 'owner'))
    )
  );

-- Recruiters/admins manage enquiry jobs
DROP POLICY IF EXISTS "Recruiters manage enquiry jobs" ON employer_enquiry_jobs;
CREATE POLICY "Recruiters manage enquiry jobs" ON employer_enquiry_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_type = 'recruiter' OR role IN ('admin', 'owner'))
    )
  );

-- Crew can view enquiry jobs for their enquiries
DROP POLICY IF EXISTS "Crew view own enquiry jobs" ON employer_enquiry_jobs;
CREATE POLICY "Crew view own enquiry jobs" ON employer_enquiry_jobs
  FOR SELECT USING (
    enquiry_id IN (
      SELECT id FROM employer_enquiries WHERE referrer_id IN (
        SELECT id FROM candidates WHERE user_id = auth.uid()
      )
    )
  );

-- Crew view their own rewards
DROP POLICY IF EXISTS "Crew view own enquiry rewards" ON employer_enquiry_rewards;
CREATE POLICY "Crew view own enquiry rewards" ON employer_enquiry_rewards
  FOR SELECT USING (
    referrer_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Recruiters/admins manage all rewards
DROP POLICY IF EXISTS "Recruiters manage enquiry rewards" ON employer_enquiry_rewards;
CREATE POLICY "Recruiters manage enquiry rewards" ON employer_enquiry_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_type = 'recruiter' OR role IN ('admin', 'owner'))
    )
  );

-- Public read for settings
DROP POLICY IF EXISTS "Public read enquiry settings" ON employer_enquiry_settings;
CREATE POLICY "Public read enquiry settings" ON employer_enquiry_settings
  FOR SELECT USING (TRUE);

-- Admins update settings
DROP POLICY IF EXISTS "Admins manage enquiry settings" ON employer_enquiry_settings;
CREATE POLICY "Admins manage enquiry settings" ON employer_enquiry_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get enquiry stats for a candidate
CREATE OR REPLACE FUNCTION get_employer_enquiry_stats(p_candidate_id UUID)
RETURNS TABLE (
  total_enquiries BIGINT,
  submitted BIGINT,
  under_review BIGINT,
  verified BIGINT,
  invalid BIGINT,
  total_jobs_created BIGINT,
  total_placements BIGINT,
  pending_rewards INTEGER,
  approved_rewards INTEGER,
  total_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT e.id)::BIGINT as total_enquiries,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'submitted')::BIGINT as submitted,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'under_review')::BIGINT as under_review,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'verified')::BIGINT as verified,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status IN ('invalid', 'duplicate'))::BIGINT as invalid,
    (SELECT COUNT(DISTINCT ej.job_id) FROM employer_enquiry_jobs ej
     INNER JOIN employer_enquiries ee ON ej.enquiry_id = ee.id
     WHERE ee.referrer_id = p_candidate_id)::BIGINT as total_jobs_created,
    (SELECT COUNT(*) FROM employer_enquiry_rewards er
     WHERE er.referrer_id = p_candidate_id)::BIGINT as total_placements,
    COALESCE((SELECT SUM(amount) FROM employer_enquiry_rewards
              WHERE referrer_id = p_candidate_id AND status = 'pending'), 0)::INTEGER as pending_rewards,
    COALESCE((SELECT SUM(amount) FROM employer_enquiry_rewards
              WHERE referrer_id = p_candidate_id AND status = 'approved'), 0)::INTEGER as approved_rewards,
    COALESCE((SELECT SUM(amount) FROM employer_enquiry_rewards
              WHERE referrer_id = p_candidate_id AND status = 'paid'), 0)::INTEGER as total_earned
  FROM employer_enquiries e
  WHERE e.referrer_id = p_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if candidate can submit enquiries (not over monthly limit)
CREATE OR REPLACE FUNCTION can_submit_employer_enquiry(p_candidate_id UUID)
RETURNS TABLE (
  can_submit BOOLEAN,
  reason TEXT,
  enquiries_this_month INTEGER,
  monthly_limit INTEGER
) AS $$
DECLARE
  v_settings employer_enquiry_settings;
  v_count INTEGER;
BEGIN
  SELECT * INTO v_settings FROM employer_enquiry_settings LIMIT 1;

  -- Count enquiries this month
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM employer_enquiries
  WHERE referrer_id = p_candidate_id
  AND submitted_at >= date_trunc('month', NOW());

  RETURN QUERY
  SELECT
    (v_settings.program_active AND v_count < v_settings.max_enquiries_per_month) as can_submit,
    CASE
      WHEN NOT v_settings.program_active THEN 'Program is currently inactive'
      WHEN v_count >= v_settings.max_enquiries_per_month THEN 'Monthly limit reached'
      ELSE NULL
    END as reason,
    v_count as enquiries_this_month,
    v_settings.max_enquiries_per_month as monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Admin view: Pending enquiries with referrer info
CREATE OR REPLACE VIEW pending_employer_enquiries AS
SELECT
  e.*,
  c.first_name as referrer_first_name,
  c.last_name as referrer_last_name,
  c.email as referrer_email,
  c.profile_photo_url as referrer_photo_url,
  (SELECT COUNT(*) FROM employer_enquiry_jobs ej WHERE ej.enquiry_id = e.id) as linked_jobs_count,
  (SELECT COUNT(*) FROM employer_enquiry_rewards er WHERE er.enquiry_id = e.id) as placements_count
FROM employer_enquiries e
INNER JOIN candidates c ON e.referrer_id = c.id
WHERE e.status IN ('submitted', 'under_review')
ORDER BY e.submitted_at ASC;

-- Referrer earnings summary
CREATE OR REPLACE VIEW employer_enquiry_earnings AS
SELECT
  c.id as candidate_id,
  c.first_name,
  c.last_name,
  c.email,
  COUNT(DISTINCT e.id) as total_enquiries,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'verified') as verified_enquiries,
  COUNT(DISTINCT r.id) as total_placements,
  COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'paid'), 0) as total_earned,
  COALESCE(SUM(r.amount) FILTER (WHERE r.status IN ('pending', 'approved')), 0) as pending_amount
FROM candidates c
LEFT JOIN employer_enquiries e ON e.referrer_id = c.id
LEFT JOIN employer_enquiry_rewards r ON r.referrer_id = c.id
GROUP BY c.id
HAVING COUNT(e.id) > 0;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employer_enquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employer_enquiries_updated_at ON employer_enquiries;
CREATE TRIGGER trg_employer_enquiries_updated_at
  BEFORE UPDATE ON employer_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_enquiry_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON pending_employer_enquiries TO authenticated;
GRANT SELECT ON employer_enquiry_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_enquiry_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_submit_employer_enquiry(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE employer_enquiries IS 'Employer leads referred by crew members - earn EUR200 per placement';
COMMENT ON TABLE employer_enquiry_jobs IS 'Links enquiries to jobs created from them';
COMMENT ON TABLE employer_enquiry_rewards IS 'EUR200 rewards for placements from referred employers';
COMMENT ON COLUMN employer_enquiry_rewards.amount IS 'Reward amount in cents (20000 = EUR200)';
COMMENT ON TABLE employer_enquiry_settings IS 'Singleton configuration for the employer referral program';

-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Referral System
-- ============================================================================
-- Enables candidates to refer other crew members and earn rewards
-- Tracks referral funnel: click → signup → apply → placed
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- CANDIDATES TABLE UPDATES
-- ============================================================================

-- Add referral code and tracking to candidates
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_candidate_id UUID REFERENCES candidates(id),
ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;

-- Note: We keep the existing `referred_by` column for backwards compatibility
-- but new referrals should use `referred_by_candidate_id` which links to the referrals table

-- Index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_candidates_referral_code ON candidates(referral_code);

-- ============================================================================
-- REFERRALS TABLE
-- Tracks each referral from click to conversion
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who referred
  referrer_id UUID REFERENCES candidates(id) NOT NULL,
  referrer_code TEXT NOT NULL,

  -- Who was referred
  referred_id UUID REFERENCES candidates(id),
  referred_email TEXT, -- captured before they sign up

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Link clicked, no signup yet
    'signed_up',  -- Referral signed up
    'applied',    -- Referral submitted first application
    'placed',     -- Referral got placed
    'expired',    -- Link expired without conversion
    'invalid'     -- Invalid/fraudulent referral
  )),

  -- Milestones
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  first_application_at TIMESTAMPTZ,
  placed_at TIMESTAMPTZ,

  -- Rewards tracking (denormalized for quick checks)
  signup_reward_paid BOOLEAN DEFAULT FALSE,
  signup_reward_amount INTEGER,
  signup_reward_paid_at TIMESTAMPTZ,

  application_reward_paid BOOLEAN DEFAULT FALSE,
  application_reward_amount INTEGER,
  application_reward_paid_at TIMESTAMPTZ,

  placement_reward_paid BOOLEAN DEFAULT FALSE,
  placement_reward_amount INTEGER, -- could be percentage of fee
  placement_reward_paid_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT DEFAULT 'link' CHECK (source IN (
    'link',           -- Direct link share
    'qr_code',        -- QR code scan
    'email_share',    -- Shared via email button
    'whatsapp_share', -- Shared via WhatsApp button
    'linkedin_share', -- Shared via LinkedIn
    'copy_link'       -- Copied link to clipboard
  )),
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_expires ON referrals(expires_at) WHERE status = 'pending';

-- ============================================================================
-- REFERRAL REWARDS TABLE
-- Ledger of all rewards (for both referrer and referred)
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  referral_id UUID REFERENCES referrals(id) NOT NULL,
  candidate_id UUID REFERENCES candidates(id) NOT NULL, -- who gets the reward

  -- Reward details
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'signup_bonus',      -- Referrer gets bonus when referral signs up
    'application_bonus', -- Referrer gets bonus when referral applies
    'placement_bonus',   -- Referrer gets bonus when referral placed
    'referred_bonus'     -- Referred person gets bonus (welcome bonus)
  )),
  reward_trigger TEXT NOT NULL CHECK (reward_trigger IN (
    'signup',
    'application',
    'placement'
  )),
  amount INTEGER NOT NULL, -- in cents/smallest currency unit
  currency TEXT DEFAULT 'EUR',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',   -- Reward created, awaiting approval
    'approved',  -- Approved, ready for payout
    'paid',      -- Paid out
    'cancelled'  -- Cancelled (e.g., fraud detected)
  )),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN (
    'bank_transfer',
    'paypal',
    'revolut',
    'wise',
    'credit'  -- Platform credit for future services
  )),
  payment_reference TEXT,

  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_candidate ON referral_rewards(candidate_id);
CREATE INDEX IF NOT EXISTS idx_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_pending ON referral_rewards(candidate_id, status) WHERE status IN ('pending', 'approved');

-- ============================================================================
-- REFERRAL SETTINGS TABLE
-- Admin-configurable program settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Enable/disable
  program_active BOOLEAN DEFAULT TRUE,
  program_name TEXT DEFAULT 'Crew Referral Program',
  program_description TEXT DEFAULT 'Refer fellow crew members and earn rewards when they join and find work through Lighthouse.',

  -- Reward amounts (in cents, EUR by default)
  signup_reward_referrer INTEGER DEFAULT 0,     -- €0 for signup (too easy to abuse)
  signup_reward_referred INTEGER DEFAULT 0,     -- €0 welcome bonus

  application_reward_referrer INTEGER DEFAULT 1000,  -- €10 when they apply
  application_reward_referred INTEGER DEFAULT 0,     -- €0 for referee

  placement_reward_referrer INTEGER DEFAULT 5000,    -- €50 when they get placed
  placement_reward_referred INTEGER DEFAULT 2500,    -- €25 for the new crew

  -- Limits
  max_referrals_per_month INTEGER DEFAULT 20,        -- Prevent spam
  max_pending_referrals INTEGER DEFAULT 50,          -- Max outstanding unverified referrals
  referral_expiry_days INTEGER DEFAULT 90,           -- How long before referral link expires
  min_payout_amount INTEGER DEFAULT 5000,            -- €50 minimum to request payout

  -- Requirements
  referrer_min_tier TEXT DEFAULT 'basic' CHECK (referrer_min_tier IN (
    'unverified', 'basic', 'identity', 'references', 'verified', 'premium'
  )),
  referrer_must_be_placed BOOLEAN DEFAULT FALSE,     -- Must have been placed to refer
  referred_must_apply_days INTEGER DEFAULT 30,       -- Days to apply for referrer to get credit

  -- Anti-fraud
  require_different_email_domain BOOLEAN DEFAULT FALSE,  -- Prevent self-referrals
  require_different_ip BOOLEAN DEFAULT FALSE,            -- Prevent same household gaming
  cooldown_between_referrals_hours INTEGER DEFAULT 0,    -- Minimum time between referrals

  -- Singleton enforcement
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings (singleton)
INSERT INTO referral_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own referrals (as referrer)
DROP POLICY IF EXISTS "Candidates view own referrals" ON referrals;
CREATE POLICY "Candidates view own referrals" ON referrals
  FOR SELECT USING (
    referrer_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Candidates can also see if they were referred
DROP POLICY IF EXISTS "Candidates view referral they came from" ON referrals;
CREATE POLICY "Candidates view referral they came from" ON referrals
  FOR SELECT USING (
    referred_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Candidates can view their own rewards
DROP POLICY IF EXISTS "Candidates view own rewards" ON referral_rewards;
CREATE POLICY "Candidates view own rewards" ON referral_rewards
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Recruiters/admins can manage all referrals
DROP POLICY IF EXISTS "Recruiters manage referrals" ON referrals;
CREATE POLICY "Recruiters manage referrals" ON referrals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_type = 'recruiter' OR role IN ('admin', 'owner'))
    )
  );

-- Recruiters/admins can manage all rewards
DROP POLICY IF EXISTS "Recruiters manage rewards" ON referral_rewards;
CREATE POLICY "Recruiters manage rewards" ON referral_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_type = 'recruiter' OR role IN ('admin', 'owner'))
    )
  );

-- Anyone can read referral settings (public program info)
DROP POLICY IF EXISTS "Public read referral settings" ON referral_settings;
CREATE POLICY "Public read referral settings" ON referral_settings
  FOR SELECT USING (TRUE);

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins manage referral settings" ON referral_settings;
CREATE POLICY "Admins manage referral settings" ON referral_settings
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

-- Generate unique referral code (8 chars, no confusing chars)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0,O,1,I,L
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate and assign referral code to candidate
CREATE OR REPLACE FUNCTION assign_referral_code(p_candidate_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
BEGIN
  -- Check if already has code
  SELECT referral_code INTO v_code FROM candidates WHERE id = p_candidate_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique code
  LOOP
    v_code := generate_referral_code();
    v_attempts := v_attempts + 1;

    -- Try to insert
    BEGIN
      UPDATE candidates SET referral_code = v_code WHERE id = p_candidate_id;
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= v_max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique referral code after % attempts', v_max_attempts;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Get referral stats for a candidate
CREATE OR REPLACE FUNCTION get_referral_stats(p_candidate_id UUID)
RETURNS TABLE (
  total_referrals BIGINT,
  signed_up BIGINT,
  applied BIGINT,
  placed BIGINT,
  pending_rewards INTEGER,
  approved_rewards INTEGER,
  total_earned INTEGER,
  referral_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(r.id)::BIGINT as total_referrals,
    COUNT(r.id) FILTER (WHERE r.status IN ('signed_up', 'applied', 'placed'))::BIGINT as signed_up,
    COUNT(r.id) FILTER (WHERE r.status IN ('applied', 'placed'))::BIGINT as applied,
    COUNT(r.id) FILTER (WHERE r.status = 'placed')::BIGINT as placed,
    COALESCE(SUM(rr.amount) FILTER (WHERE rr.status = 'pending'), 0)::INTEGER as pending_rewards,
    COALESCE(SUM(rr.amount) FILTER (WHERE rr.status = 'approved'), 0)::INTEGER as approved_rewards,
    COALESCE(SUM(rr.amount) FILTER (WHERE rr.status = 'paid'), 0)::INTEGER as total_earned,
    c.referral_code
  FROM candidates c
  LEFT JOIN referrals r ON r.referrer_id = c.id
  LEFT JOIN referral_rewards rr ON rr.candidate_id = c.id
  WHERE c.id = p_candidate_id
  GROUP BY c.id, c.referral_code;
END;
$$ LANGUAGE plpgsql;

-- Track referral milestone and create rewards
CREATE OR REPLACE FUNCTION track_referral_milestone(
  p_referral_id UUID,
  p_milestone TEXT -- 'signup', 'application', 'placement'
)
RETURNS VOID AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_referrer_amount INTEGER;
  v_referred_amount INTEGER;
BEGIN
  -- Get referral and settings
  SELECT * INTO v_referral FROM referrals WHERE id = p_referral_id;
  SELECT * INTO v_settings FROM referral_settings LIMIT 1;

  IF NOT v_settings.program_active THEN
    RETURN;
  END IF;

  -- Update referral status
  CASE p_milestone
    WHEN 'signup' THEN
      UPDATE referrals SET
        status = 'signed_up',
        signed_up_at = NOW(),
        updated_at = NOW()
      WHERE id = p_referral_id AND status = 'pending';
      v_referrer_amount := v_settings.signup_reward_referrer;
      v_referred_amount := v_settings.signup_reward_referred;

    WHEN 'application' THEN
      UPDATE referrals SET
        status = 'applied',
        first_application_at = NOW(),
        updated_at = NOW()
      WHERE id = p_referral_id AND status IN ('pending', 'signed_up');
      v_referrer_amount := v_settings.application_reward_referrer;
      v_referred_amount := v_settings.application_reward_referred;

    WHEN 'placement' THEN
      UPDATE referrals SET
        status = 'placed',
        placed_at = NOW(),
        updated_at = NOW()
      WHERE id = p_referral_id;
      v_referrer_amount := v_settings.placement_reward_referrer;
      v_referred_amount := v_settings.placement_reward_referred;
  END CASE;

  -- Create referrer reward
  IF v_referrer_amount > 0 THEN
    INSERT INTO referral_rewards (
      referral_id, candidate_id, reward_type, reward_trigger, amount
    ) VALUES (
      p_referral_id,
      v_referral.referrer_id,
      p_milestone || '_bonus',
      p_milestone,
      v_referrer_amount
    );
  END IF;

  -- Create referred reward
  IF v_referred_amount > 0 AND v_referral.referred_id IS NOT NULL THEN
    INSERT INTO referral_rewards (
      referral_id, candidate_id, reward_type, reward_trigger, amount
    ) VALUES (
      p_referral_id,
      v_referral.referred_id,
      'referred_bonus',
      p_milestone,
      v_referred_amount
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on referrals
DROP TRIGGER IF EXISTS trg_referrals_updated_at ON referrals;
CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at on settings
DROP TRIGGER IF EXISTS trg_referral_settings_updated_at ON referral_settings;
CREATE TRIGGER trg_referral_settings_updated_at
  BEFORE UPDATE ON referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Referral leaderboard
CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT
  c.id as candidate_id,
  c.first_name,
  c.last_name,
  c.photo_url,
  c.referral_code,
  COUNT(r.id) as total_referrals,
  COUNT(r.id) FILTER (WHERE r.status = 'placed') as placed_referrals,
  COALESCE(SUM(rr.amount) FILTER (WHERE rr.status = 'paid'), 0) as total_earned
FROM candidates c
LEFT JOIN referrals r ON r.referrer_id = c.id
LEFT JOIN referral_rewards rr ON rr.candidate_id = c.id
WHERE c.referral_code IS NOT NULL
GROUP BY c.id
HAVING COUNT(r.id) > 0
ORDER BY placed_referrals DESC, total_referrals DESC;

-- Pending payouts
CREATE OR REPLACE VIEW pending_referral_payouts AS
SELECT
  c.id as candidate_id,
  c.first_name,
  c.last_name,
  c.email,
  SUM(rr.amount) FILTER (WHERE rr.status = 'approved') as approved_amount,
  SUM(rr.amount) FILTER (WHERE rr.status = 'pending') as pending_amount,
  COUNT(rr.id) FILTER (WHERE rr.status IN ('pending', 'approved')) as pending_rewards_count
FROM candidates c
INNER JOIN referral_rewards rr ON rr.candidate_id = c.id
WHERE rr.status IN ('pending', 'approved')
GROUP BY c.id
ORDER BY approved_amount DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE referrals IS 'Tracks candidate referrals from link click through placement';
COMMENT ON TABLE referral_rewards IS 'Ledger of rewards for both referrer and referred candidates';
COMMENT ON TABLE referral_settings IS 'Admin-configurable referral program settings (singleton)';
COMMENT ON COLUMN candidates.referral_code IS 'Unique 8-character code for sharing referral links';
COMMENT ON COLUMN candidates.referred_by_candidate_id IS 'The candidate who referred this person (tracks via referrals table)';
COMMENT ON COLUMN referrals.status IS 'Funnel stage: pending → signed_up → applied → placed';
COMMENT ON COLUMN referral_rewards.amount IS 'Reward amount in cents (e.g., 5000 = €50.00)';

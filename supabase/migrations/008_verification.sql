-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Verification System
-- ============================================================================
-- Adds verification tiers, reference checking, and audit logging
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- VERIFICATION TIERS ENUM
-- ============================================================================
-- The existing enum has: basic, identity, verified, premium
-- We need to add 'unverified' and 'references' tiers
-- Since PostgreSQL doesn't support easy enum modification, we'll:
-- 1. Add the new values using ALTER TYPE ... ADD VALUE (if not exists)
-- Note: 'unverified' goes before 'basic', 'references' goes after 'identity'

DO $$
BEGIN
  -- Add 'unverified' before 'basic' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'unverified'
    AND enumtypid = 'verification_tier'::regtype
  ) THEN
    ALTER TYPE verification_tier ADD VALUE 'unverified' BEFORE 'basic';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add unverified to verification_tier: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Add 'references' after 'identity' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'references'
    AND enumtypid = 'verification_tier'::regtype
  ) THEN
    ALTER TYPE verification_tier ADD VALUE 'references' AFTER 'identity';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add references to verification_tier: %', SQLERRM;
END $$;

-- ============================================================================
-- ADD VERIFICATION COLUMNS TO CANDIDATES TABLE
-- ============================================================================

-- Verification tracking
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS verification_updated_at TIMESTAMPTZ;

-- Email verification (for self-service candidates)
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- CV tracking
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- ID verification
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS id_verification_notes TEXT;

-- Voice verification (Vapi)
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS voice_verified_at TIMESTAMPTZ;

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS voice_verification_id TEXT;

-- ============================================================================
-- ENHANCE CANDIDATE_REFERENCES TABLE
-- ============================================================================
-- The existing table has different column names, so we add new columns
-- and keep the old ones for backward compatibility

-- Status tracking (existing table uses is_verified boolean)
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
-- status: pending, contacted, verified, failed, declined

-- Contact tracking
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS contacted_via TEXT;
-- contacted_via: email, phone, vapi

-- Verification details (verified_at and verified_by already exist)

-- Feedback from reference (some exist, adding missing ones)
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Notes alias (internal notes from recruiter)
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create alias columns to match your spec (pointing to existing columns)
-- referee_name -> reference_name alias via view or just document the mapping
-- For now, we'll add the new columns with data migration

-- Company/vessel where they worked together
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS company_vessel TEXT;

-- Dates worked together (already have worked_together_from/to)
ALTER TABLE candidate_references
ADD COLUMN IF NOT EXISTS dates_worked TEXT;

-- ============================================================================
-- VERIFICATION EVENTS (AUDIT LOG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  -- event_type values:
  -- tier_changed, email_verified, cv_uploaded, id_uploaded, id_verified,
  -- reference_added, reference_contacted, reference_verified, voice_completed

  -- Change tracking
  old_value TEXT,
  new_value TEXT,

  -- Who did it
  performed_by UUID REFERENCES users(id), -- null if self-service

  -- Additional context
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_events_candidate ON verification_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_type ON verification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_verification_events_created ON verification_events(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY FOR NEW TABLE
-- ============================================================================

ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own verification events
DROP POLICY IF EXISTS "Candidates view own verification events" ON verification_events;
CREATE POLICY "Candidates view own verification events" ON verification_events
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Recruiters can view and create verification events
DROP POLICY IF EXISTS "Recruiters manage verification events" ON verification_events;
CREATE POLICY "Recruiters manage verification events" ON verification_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'recruiter')
    )
  );

-- ============================================================================
-- ENHANCE RLS ON CANDIDATE_REFERENCES
-- ============================================================================

-- Candidates can view their own references (but limit what they see)
DROP POLICY IF EXISTS "Candidates view own references" ON candidate_references;
CREATE POLICY "Candidates view own references" ON candidate_references
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Candidates can add references
DROP POLICY IF EXISTS "Candidates add references" ON candidate_references;
CREATE POLICY "Candidates add references" ON candidate_references
  FOR INSERT WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Recruiters can manage all references
DROP POLICY IF EXISTS "Recruiters manage references" ON candidate_references;
CREATE POLICY "Recruiters manage references" ON candidate_references
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'recruiter')
    )
  );

-- ============================================================================
-- ADDITIONAL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_references_status ON candidate_references(status);
CREATE INDEX IF NOT EXISTS idx_candidates_verification_tier ON candidates(verification_tier);
CREATE INDEX IF NOT EXISTS idx_candidates_email_verified ON candidates(email_verified_at) WHERE email_verified_at IS NOT NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to log verification events
CREATE OR REPLACE FUNCTION log_verification_event(
  p_candidate_id UUID,
  p_event_type TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO verification_events (
    candidate_id, event_type, old_value, new_value, performed_by, notes, metadata
  ) VALUES (
    p_candidate_id, p_event_type, p_old_value, p_new_value, p_performed_by, p_notes, p_metadata
  )
  RETURNING id INTO v_event_id;

  -- Update verification_updated_at on the candidate
  UPDATE candidates
  SET verification_updated_at = NOW()
  WHERE id = p_candidate_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate verification tier based on status
CREATE OR REPLACE FUNCTION calculate_verification_tier(p_candidate_id UUID)
RETURNS verification_tier AS $$
DECLARE
  v_candidate RECORD;
  v_verified_refs_count INTEGER;
BEGIN
  -- Get candidate data
  SELECT
    email_verified_at,
    cv_url,
    id_verified_at,
    voice_verified_at
  INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;

  IF v_candidate IS NULL THEN
    RETURN 'unverified';
  END IF;

  -- Count verified references
  SELECT COUNT(*) INTO v_verified_refs_count
  FROM candidate_references
  WHERE candidate_id = p_candidate_id
    AND (status = 'verified' OR is_verified = TRUE);

  -- Premium: ID + 2+ references + voice
  IF v_candidate.id_verified_at IS NOT NULL
     AND v_verified_refs_count >= 2
     AND v_candidate.voice_verified_at IS NOT NULL THEN
    RETURN 'premium';
  END IF;

  -- References tier: email + CV + 2+ verified references
  IF v_candidate.email_verified_at IS NOT NULL
     AND v_candidate.cv_url IS NOT NULL
     AND v_verified_refs_count >= 2 THEN
    RETURN 'references';
  END IF;

  -- Identity tier: email + CV + ID verified
  IF v_candidate.email_verified_at IS NOT NULL
     AND v_candidate.cv_url IS NOT NULL
     AND v_candidate.id_verified_at IS NOT NULL THEN
    RETURN 'identity';
  END IF;

  -- Basic tier: email verified + CV uploaded
  IF v_candidate.email_verified_at IS NOT NULL
     AND v_candidate.cv_url IS NOT NULL THEN
    RETURN 'basic';
  END IF;

  RETURN 'unverified';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE verification_events IS 'Audit log for all verification-related changes to candidates';
COMMENT ON COLUMN candidates.verification_tier IS 'Verification level: unverified, basic, identity, references, verified, premium';
COMMENT ON COLUMN candidates.email_verified_at IS 'When candidate email was verified (for self-service registrations)';
COMMENT ON COLUMN candidates.cv_url IS 'Primary CV document URL';
COMMENT ON COLUMN candidates.id_verified_at IS 'When ID document was verified by recruiter';
COMMENT ON COLUMN candidates.voice_verified_at IS 'When voice verification was completed via Vapi';
COMMENT ON COLUMN candidate_references.status IS 'Reference check status: pending, contacted, verified, failed, declined';
COMMENT ON COLUMN candidate_references.contacted_via IS 'How reference was contacted: email, phone, vapi';
COMMENT ON COLUMN candidate_references.rating IS 'Rating given by reference (1-5)';

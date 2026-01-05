-- ============================================================================
-- FIX CANDIDATE RLS POLICIES
-- ============================================================================
-- The previous RLS policies had duplicate/conflicting entries.
-- This migration cleans up and creates proper policies.
--
-- Policy logic:
-- 1. Candidates can SELECT their own record via user_id linkage OR email fallback
-- 2. Agency users can SELECT candidates they work with (via candidate_agency_relationships)
-- 3. Verified/premium candidates are visible to all authenticated users
-- 4. Candidates can UPDATE their own record
-- 5. Candidates can INSERT their own record during registration
-- ============================================================================

-- Drop ALL existing candidate policies to start clean
DROP POLICY IF EXISTS candidate_access ON candidates;
DROP POLICY IF EXISTS candidate_self_update ON candidates;
DROP POLICY IF EXISTS candidate_self_insert ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_select ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_update ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_insert ON candidates;
DROP POLICY IF EXISTS candidate_agency_access ON candidates;

-- SELECT policy: Candidates can see their own profile + agency access + verified candidates
CREATE POLICY candidates_select ON candidates
  FOR SELECT
  USING (
    -- 1. Candidate can see their own record via linked user_id
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    -- 2. Candidate can see their own record via email (for Vincere imports not yet linked)
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- 3. Agency users can see candidates they work with
    id IN (
      SELECT candidate_id
      FROM candidate_agency_relationships
      WHERE agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    )
    OR
    -- 4. Verified/premium candidates visible to all authenticated users
    verification_tier IN ('verified', 'premium')
  );

-- UPDATE policy: Candidates can update their own profile
CREATE POLICY candidates_update ON candidates
  FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- INSERT policy: For self-registration or service role
CREATE POLICY candidates_insert ON candidates
  FOR INSERT
  WITH CHECK (
    -- Can insert with their own user_id
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    -- Can insert with their own email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Service role / initial creation (no user_id yet)
    user_id IS NULL
  );

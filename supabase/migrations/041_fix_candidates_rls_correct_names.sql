-- ============================================================================
-- FIX CANDIDATE RLS POLICIES - CORRECT POLICY NAMES
-- ============================================================================
-- Migration 039 failed to replace the policies because it tried to DROP
-- policy names that didn't exist in the database:
--   - Migration 039 tried: candidate_access, candidate_self_update, etc.
--   - Database actually had: candidates_select, candidates_update, etc.
--
-- This migration drops the ACTUAL existing policies and creates the correct
-- ones that reference both the `users` table and `auth.users` for proper
-- authentication chain support.
-- ============================================================================

-- Drop the ACTUAL existing policies (correct names from database)
DROP POLICY IF EXISTS candidates_select ON candidates;
DROP POLICY IF EXISTS candidates_select_anon ON candidates;
DROP POLICY IF EXISTS candidates_update ON candidates;
DROP POLICY IF EXISTS candidates_insert ON candidates;

-- Also drop any lingering policies from previous migrations (defensive)
DROP POLICY IF EXISTS candidate_access ON candidates;
DROP POLICY IF EXISTS candidate_self_update ON candidates;
DROP POLICY IF EXISTS candidate_self_insert ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_select ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_update ON candidates;
DROP POLICY IF EXISTS candidate_own_profile_insert ON candidates;
DROP POLICY IF EXISTS candidate_agency_access ON candidates;

-- ============================================================================
-- CREATE CORRECT POLICIES
-- ============================================================================
-- These policies support the authentication chain:
--   auth.users (Supabase Auth) → users table → candidates table
--
-- The subqueries reference the `users` table to get the internal user_id,
-- which is why the users table RLS must allow authenticated SELECT.
-- ============================================================================

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

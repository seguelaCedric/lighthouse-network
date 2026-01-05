-- ============================================================================
-- FIX CANDIDATE RLS POLICIES - USE EXPLICIT TABLE ALIASES
-- ============================================================================
-- Migration 041 had a column name collision issue. When PostgreSQL resolves
-- unqualified column names in nested subqueries, it can pick the wrong table.
--
-- The subquery `SELECT email FROM auth.users WHERE id = auth.uid()` was being
-- resolved as `SELECT users.email FROM auth.users WHERE users.id = auth.uid()`
-- due to the `users` table references in other parts of the policy.
--
-- This migration uses explicit table aliases to avoid ambiguity.
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS candidates_select ON candidates;
DROP POLICY IF EXISTS candidates_update ON candidates;
DROP POLICY IF EXISTS candidates_insert ON candidates;

-- SELECT policy with explicit aliases
CREATE POLICY candidates_select ON candidates
  FOR SELECT
  USING (
    -- 1. Candidate can see their own record via linked user_id
    user_id IN (SELECT u.id FROM users u WHERE u.auth_id = auth.uid())
    OR
    -- 2. Candidate can see their own record via email (for Vincere imports not yet linked)
    email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
    OR
    -- 3. Agency users can see candidates they work with
    id IN (
      SELECT car.candidate_id
      FROM candidate_agency_relationships car
      WHERE car.agency_id IN (SELECT u2.organization_id FROM users u2 WHERE u2.auth_id = auth.uid())
    )
    OR
    -- 4. Verified/premium candidates visible to all authenticated users
    verification_tier IN ('verified', 'premium')
  );

-- UPDATE policy with explicit aliases
CREATE POLICY candidates_update ON candidates
  FOR UPDATE
  USING (
    user_id IN (SELECT u.id FROM users u WHERE u.auth_id = auth.uid())
    OR
    email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT u.id FROM users u WHERE u.auth_id = auth.uid())
    OR
    email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
  );

-- INSERT policy with explicit aliases
CREATE POLICY candidates_insert ON candidates
  FOR INSERT
  WITH CHECK (
    -- Can insert with their own user_id
    user_id IN (SELECT u.id FROM users u WHERE u.auth_id = auth.uid())
    OR
    -- Can insert with their own email
    email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
    OR
    -- Service role / initial creation (no user_id yet)
    user_id IS NULL
  );

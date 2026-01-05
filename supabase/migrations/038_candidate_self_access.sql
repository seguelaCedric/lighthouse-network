-- ============================================================================
-- ADD CANDIDATE SELF-ACCESS POLICY
-- ============================================================================
-- Allows candidates to read and update their own profile
-- This was missing from the original schema, preventing candidates from
-- accessing their own data via the API
-- ============================================================================

-- Allow candidates to view their own profile
DROP POLICY IF EXISTS candidate_own_profile_select ON candidates;
CREATE POLICY candidate_own_profile_select ON candidates
  FOR SELECT
  USING (
    -- Candidate can see their own record via user_id
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    -- Fallback: match by email (for Vincere-imported candidates not yet linked)
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Agency access (existing logic)
    id IN (
      SELECT candidate_id FROM candidate_agency_relationships
      WHERE agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    )
    OR
    -- Verified candidates visible to all agencies (existing logic)
    verification_tier IN ('verified', 'premium')
  );

-- Allow candidates to update their own profile
DROP POLICY IF EXISTS candidate_own_profile_update ON candidates;
CREATE POLICY candidate_own_profile_update ON candidates
  FOR UPDATE
  USING (
    -- Candidate can update their own record via user_id
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    -- Fallback: match by email (for Vincere-imported candidates not yet linked)
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow candidates to insert their own profile (for self-registration)
DROP POLICY IF EXISTS candidate_own_profile_insert ON candidates;
CREATE POLICY candidate_own_profile_insert ON candidates
  FOR INSERT
  WITH CHECK (
    -- Candidate can only insert with their own user_id
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR
    -- Or with their own email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Note: We keep the original candidate_agency_access policy for backward compatibility
-- but it's now redundant with the new candidate_own_profile_select policy
DROP POLICY IF EXISTS candidate_agency_access ON candidates;

-- ============================================================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================
-- When RLS policies contain subqueries to other RLS-protected tables, the
-- subqueries are also subject to RLS. This can cause cascading permission
-- issues.
--
-- Solution: Create SECURITY DEFINER functions that bypass RLS for the
-- specific lookups needed by RLS policies. These functions run with the
-- privileges of the function owner (postgres) rather than the caller.
-- ============================================================================

-- Function to get current user's internal ID from users table
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid();
$$;

-- Function to get current user's email from auth.users
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Function to get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM users WHERE auth_id = auth.uid();
$$;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO anon;

-- ============================================================================
-- UPDATE CANDIDATES RLS TO USE HELPER FUNCTIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS candidates_select ON candidates;
DROP POLICY IF EXISTS candidates_update ON candidates;
DROP POLICY IF EXISTS candidates_insert ON candidates;

-- SELECT policy using helper functions
CREATE POLICY candidates_select ON candidates
  FOR SELECT
  USING (
    -- 1. Candidate can see their own record via linked user_id
    user_id = public.get_current_user_id()
    OR
    -- 2. Candidate can see their own record via email (for Vincere imports)
    email = public.get_current_user_email()
    OR
    -- 3. Agency users can see candidates they work with
    id IN (
      SELECT candidate_id
      FROM candidate_agency_relationships
      WHERE agency_id = public.get_current_user_organization_id()
    )
    OR
    -- 4. Verified/premium candidates visible to all authenticated users
    verification_tier IN ('verified', 'premium')
  );

-- UPDATE policy using helper functions
CREATE POLICY candidates_update ON candidates
  FOR UPDATE
  USING (
    user_id = public.get_current_user_id()
    OR
    email = public.get_current_user_email()
  )
  WITH CHECK (
    user_id = public.get_current_user_id()
    OR
    email = public.get_current_user_email()
  );

-- INSERT policy using helper functions
CREATE POLICY candidates_insert ON candidates
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id()
    OR
    email = public.get_current_user_email()
    OR
    user_id IS NULL
  );

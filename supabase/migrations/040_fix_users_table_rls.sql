-- ============================================================================
-- FIX USERS TABLE RLS POLICIES
-- ============================================================================
-- The existing `FOR ALL` policy on the users table is causing permission denied
-- errors when candidates try to access the dashboard. This happens because:
-- 1. The dashboard queries the users table to get the internal user ID
-- 2. Other RLS policies (candidates) use subqueries that reference users table
-- 3. The combined `FOR ALL` policy has edge cases that block access
--
-- Solution: Split into granular SELECT/INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Drop the existing combined policy
DROP POLICY IF EXISTS user_access ON users;

-- Allow SELECT for authenticated users (own record only)
-- This is critical for:
-- 1. Direct queries to users table (e.g., dashboard actions.ts)
-- 2. Subqueries from other RLS policies (e.g., candidates table)
CREATE POLICY users_select ON users
  FOR SELECT
  USING (auth_id = auth.uid());

-- Allow INSERT when auth_id matches the authenticated user
CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- Allow UPDATE for own record only
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Allow DELETE for own record only
CREATE POLICY users_delete ON users
  FOR DELETE
  USING (auth_id = auth.uid());

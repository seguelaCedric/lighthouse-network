-- Fix RLS policy for candidate_certifications table
-- The existing policy only checks user_id, but Vincere-imported candidates may have user_id = NULL
-- This migration updates the policy to also check email-based lookup using existing helper functions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own certifications" ON candidate_certifications;
DROP POLICY IF EXISTS "Users can manage their own certifications" ON candidate_certifications;

-- Create new SELECT policy that supports both user_id and email lookup
CREATE POLICY "Users can view their own certifications"
  ON candidate_certifications FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates
      WHERE user_id = public.get_current_user_id()
      OR email = public.get_current_user_email()
    )
  );

-- Create new ALL policy (INSERT, UPDATE, DELETE) that supports both user_id and email lookup
CREATE POLICY "Users can manage their own certifications"
  ON candidate_certifications FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM candidates
      WHERE user_id = public.get_current_user_id()
      OR email = public.get_current_user_email()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can view their own certifications" ON candidate_certifications IS
  'Allows candidates to view their certifications via user_id or email (for Vincere imports)';

COMMENT ON POLICY "Users can manage their own certifications" ON candidate_certifications IS
  'Allows candidates to manage their certifications via user_id or email (for Vincere imports)';

-- Fix missing RLS policy on candidate_agency_relationships
-- This is needed so that the candidates RLS policy subquery can access the relationships

-- Allow agencies to see their own relationships
DROP POLICY IF EXISTS car_agency_access ON candidate_agency_relationships;
CREATE POLICY car_agency_access ON candidate_agency_relationships
  FOR SELECT
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Allow agencies to manage relationships for their own candidates
DROP POLICY IF EXISTS car_agency_manage ON candidate_agency_relationships;
CREATE POLICY car_agency_manage ON candidate_agency_relationships
  FOR ALL
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

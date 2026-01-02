-- ============================================================================
-- DOCUMENTS TABLE RLS POLICIES
-- Migration: 014_documents_rls.sql
-- Description: Add missing RLS policies for documents table
-- Root Cause: RLS was enabled on documents table but no policies were defined,
--             causing all queries via Supabase client to return empty results
-- ============================================================================

-- Enable RLS if not already enabled (already enabled, but safe to re-run)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Agency staff can view documents for candidates linked to their agency
-- This covers both:
-- 1. Documents in the user's organization
-- 2. Documents belonging to candidates linked to user's agency via candidate_agency_relationships
DROP POLICY IF EXISTS documents_select_agency ON documents;
CREATE POLICY documents_select_agency ON documents
  FOR SELECT
  USING (
    -- User's organization owns the document
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
    OR
    -- Or document belongs to a candidate linked to user's agency
    (
      entity_type = 'candidate' AND
      entity_id IN (
        SELECT candidate_id FROM candidate_agency_relationships
        WHERE agency_id IN (
          SELECT organization_id FROM users WHERE auth_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Agency staff can upload documents for their organization
DROP POLICY IF EXISTS documents_insert_agency ON documents;
CREATE POLICY documents_insert_agency ON documents
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Agency staff can update documents in their organization
DROP POLICY IF EXISTS documents_update_agency ON documents;
CREATE POLICY documents_update_agency ON documents
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Agency staff can delete documents in their organization
DROP POLICY IF EXISTS documents_delete_agency ON documents;
CREATE POLICY documents_delete_agency ON documents
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ============================================================================
-- SERVICE ROLE BYPASS
-- ============================================================================
-- Note: Service role automatically bypasses RLS, so no special policy needed
-- for sync scripts that use SUPABASE_SERVICE_ROLE_KEY

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY documents_select_agency ON documents IS
  'Allows agency staff to view documents for candidates in their organization or linked via candidate_agency_relationships';
COMMENT ON POLICY documents_insert_agency ON documents IS
  'Allows agency staff to upload documents for their organization';
COMMENT ON POLICY documents_update_agency ON documents IS
  'Allows agency staff to update documents in their organization';
COMMENT ON POLICY documents_delete_agency ON documents IS
  'Allows agency staff to delete documents in their organization';

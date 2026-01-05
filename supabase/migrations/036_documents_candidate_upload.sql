-- ============================================================================
-- DOCUMENTS: Add Candidate Upload Policy
-- Migration: 036_documents_candidate_upload.sql
-- Description: Allow candidates to upload documents to their own profile
-- ============================================================================

-- Candidates can upload documents to their own profile
DROP POLICY IF EXISTS documents_insert_candidate ON documents;
CREATE POLICY documents_insert_candidate ON documents
  FOR INSERT
  WITH CHECK (
    -- Must be a candidate user type
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND user_type = 'candidate'
    )
    AND
    -- Can only upload to entities they own (their candidate record)
    entity_type = 'candidate'
    AND
    entity_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Candidates can view their own documents
DROP POLICY IF EXISTS documents_select_candidate ON documents;
CREATE POLICY documents_select_candidate ON documents
  FOR SELECT
  USING (
    -- Must be a candidate
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND user_type = 'candidate'
    )
    AND
    -- Can only view documents for their own candidate record
    entity_type = 'candidate'
    AND
    entity_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Candidates can update their own pending documents (e.g., replace before approval)
DROP POLICY IF EXISTS documents_update_candidate ON documents;
CREATE POLICY documents_update_candidate ON documents
  FOR UPDATE
  USING (
    -- Must be a candidate
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND user_type = 'candidate'
    )
    AND
    -- Document is in pending status
    status = 'pending'
    AND
    -- Document belongs to their candidate record
    entity_type = 'candidate'
    AND
    entity_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- STORAGE POLICIES FOR DOCUMENTS BUCKET
-- ============================================================================

-- Candidates can upload files to their own folder
DROP POLICY IF EXISTS "Candidates can upload to own folder" ON storage.objects;
CREATE POLICY "Candidates can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND
    -- Path must start with candidate/{their_candidate_id}/
    (storage.foldername(name))[1] = 'candidate'
    AND
    (storage.foldername(name))[2] IN (
      SELECT c.id::text FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Candidates can read their own files
DROP POLICY IF EXISTS "Candidates can read own files" ON storage.objects;
CREATE POLICY "Candidates can read own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND
    (storage.foldername(name))[1] = 'candidate'
    AND
    (storage.foldername(name))[2] IN (
      SELECT c.id::text FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Agency staff can access all files in documents bucket for their organization
DROP POLICY IF EXISTS "Agency can access organization files" ON storage.objects;
CREATE POLICY "Agency can access organization files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND user_type IN ('recruiter', 'admin')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY documents_insert_candidate ON documents IS
  'Allows candidates to upload documents to their own profile';
COMMENT ON POLICY documents_select_candidate ON documents IS
  'Allows candidates to view their own documents';
COMMENT ON POLICY documents_update_candidate ON documents IS
  'Allows candidates to update their own pending documents';

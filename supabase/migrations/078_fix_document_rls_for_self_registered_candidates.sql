-- ============================================================================
-- FIX: Document RLS Policies for Self-Registered Candidates
-- Migration: fix_document_rls_for_self_registered_candidates.sql
-- Description: Allow candidates who registered themselves (no users record)
--              to upload documents by matching auth email to candidate email
-- ============================================================================

-- Drop existing policies to recreate with proper fallback logic
DROP POLICY IF EXISTS documents_insert_candidate ON documents;
DROP POLICY IF EXISTS documents_select_candidate ON documents;
DROP POLICY IF EXISTS documents_update_candidate ON documents;

-- Candidates can upload documents to their own profile
-- Now supports both:
--   1. Candidates with users record (user_id linked)
--   2. Self-registered candidates (matched by email)
CREATE POLICY documents_insert_candidate ON documents
  FOR INSERT
  WITH CHECK (
    entity_type = 'candidate'
    AND
    entity_id IN (
      -- Option 1: Candidate linked through users table
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()

      UNION

      -- Option 2: Self-registered candidate matched by email (no users record)
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Candidates can view their own documents
CREATE POLICY documents_select_candidate ON documents
  FOR SELECT
  USING (
    entity_type = 'candidate'
    AND
    entity_id IN (
      -- Option 1: Candidate linked through users table
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()

      UNION

      -- Option 2: Self-registered candidate matched by email
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Candidates can update their own pending documents
CREATE POLICY documents_update_candidate ON documents
  FOR UPDATE
  USING (
    status = 'pending'
    AND
    entity_type = 'candidate'
    AND
    entity_id IN (
      -- Option 1: Candidate linked through users table
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()

      UNION

      -- Option 2: Self-registered candidate matched by email
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STORAGE POLICIES - Also need email fallback
-- ============================================================================

DROP POLICY IF EXISTS "Candidates can upload to own folder" ON storage.objects;
CREATE POLICY "Candidates can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND
    (storage.foldername(name))[1] = 'candidate'
    AND
    (storage.foldername(name))[2] IN (
      -- Option 1: Via users table link
      SELECT c.id::text FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()

      UNION

      -- Option 2: Self-registered (email match, no users record)
      SELECT c.id::text FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid()
      )
    )
  );

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
      -- Option 1: Via users table link
      SELECT c.id::text FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()

      UNION

      -- Option 2: Self-registered (email match, no users record)
      SELECT c.id::text FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY documents_insert_candidate ON documents IS
  'Allows candidates to upload documents - supports both users-linked and self-registered candidates';
COMMENT ON POLICY documents_select_candidate ON documents IS
  'Allows candidates to view their own documents - supports both users-linked and self-registered candidates';
COMMENT ON POLICY documents_update_candidate ON documents IS
  'Allows candidates to update pending documents - supports both users-linked and self-registered candidates';

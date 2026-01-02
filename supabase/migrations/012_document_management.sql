-- ============================================================================
-- DOCUMENT MANAGEMENT SYSTEM
-- Migration: 012_document_management.sql
-- Description: Adds versioning, approval workflow, and enhanced metadata to documents table
-- ============================================================================

-- Add missing columns to documents table (if they don't exist)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add versioning columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id),
  ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE;

-- Add approval workflow columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for performance (using 'type' column which is the existing column name)
CREATE INDEX IF NOT EXISTS idx_documents_version
  ON documents(entity_type, entity_id, type, version);

CREATE INDEX IF NOT EXISTS idx_documents_latest_version
  ON documents(is_latest_version)
  WHERE is_latest_version = TRUE;

CREATE INDEX IF NOT EXISTS idx_documents_status
  ON documents(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_parent
  ON documents(parent_document_id)
  WHERE parent_document_id IS NOT NULL;

-- Add CV-specific tracking columns to candidates table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS cv_document_id UUID REFERENCES documents(id),
  ADD COLUMN IF NOT EXISTS cv_status TEXT DEFAULT 'not_uploaded'
    CHECK (cv_status IN ('not_uploaded', 'pending', 'approved', 'rejected'));

-- Create index for CV document lookups
CREATE INDEX IF NOT EXISTS idx_candidates_cv_document
  ON candidates(cv_document_id)
  WHERE cv_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidates_cv_status
  ON candidates(cv_status)
  WHERE cv_status != 'not_uploaded';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get latest approved document for an entity
CREATE OR REPLACE FUNCTION get_latest_approved_document(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_document_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
BEGIN
  SELECT id INTO v_document_id
  FROM documents
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND type = p_document_type  -- Using 'type' column
    AND status = 'approved'
    AND is_latest_version = TRUE
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Create new version of a document
CREATE OR REPLACE FUNCTION create_document_version(
  p_parent_document_id UUID,
  p_new_file_url TEXT,
  p_new_file_path TEXT,
  p_new_file_size INTEGER,
  p_new_mime_type TEXT,
  p_uploaded_by UUID,
  p_organization_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_parent RECORD;
  v_new_doc_id UUID;
  v_new_version INTEGER;
BEGIN
  -- Get parent document details
  SELECT * INTO v_parent
  FROM documents
  WHERE id = p_parent_document_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent document not found or has been deleted';
  END IF;

  -- Calculate new version number
  v_new_version := v_parent.version + 1;

  -- Mark all previous versions of this document type as not latest
  UPDATE documents
  SET is_latest_version = FALSE
  WHERE entity_type = v_parent.entity_type
    AND entity_id = v_parent.entity_id
    AND type = v_parent.type  -- Using 'type' column
    AND is_latest_version = TRUE
    AND deleted_at IS NULL;

  -- Create new version
  INSERT INTO documents (
    entity_type,
    entity_id,
    type,  -- Using 'type' column
    name,
    description,
    file_url,
    file_path,
    file_size,
    mime_type,
    version,
    parent_document_id,
    is_latest_version,
    status,
    uploaded_by,
    organization_id,
    expiry_date,
    metadata
  ) VALUES (
    v_parent.entity_type,
    v_parent.entity_id,
    v_parent.type,  -- Using 'type' column
    v_parent.name || ' (v' || v_new_version::text || ')',
    v_parent.description,
    p_new_file_url,
    p_new_file_path,
    p_new_file_size,
    p_new_mime_type,
    v_new_version,
    p_parent_document_id,
    TRUE,
    'pending',
    p_uploaded_by,
    p_organization_id,
    v_parent.expiry_date,
    v_parent.metadata
  )
  RETURNING id INTO v_new_doc_id;

  RETURN v_new_doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve document
CREATE OR REPLACE FUNCTION approve_document(
  p_document_id UUID,
  p_approved_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_document RECORD;
  v_candidate_id UUID;
BEGIN
  -- Get document details
  SELECT * INTO v_document
  FROM documents
  WHERE id = p_document_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF v_document.status != 'pending' THEN
    RAISE EXCEPTION 'Document is not pending approval (current status: %)', v_document.status;
  END IF;

  -- Update document status to approved
  UPDATE documents
  SET
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    rejected_by = NULL,
    rejected_at = NULL,
    rejection_reason = NULL
  WHERE id = p_document_id;

  -- If this is a CV and it's the latest version, update candidate record
  IF v_document.type = 'cv' AND v_document.is_latest_version AND v_document.entity_type = 'candidate' THEN
    UPDATE candidates
    SET
      cv_url = v_document.file_url,
      cv_document_id = p_document_id,
      cv_status = 'approved'
    WHERE id = v_document.entity_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject document
CREATE OR REPLACE FUNCTION reject_document(
  p_document_id UUID,
  p_rejected_by UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_document RECORD;
BEGIN
  -- Get document details
  SELECT * INTO v_document
  FROM documents
  WHERE id = p_document_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF v_document.status != 'pending' THEN
    RAISE EXCEPTION 'Document is not pending approval (current status: %)', v_document.status;
  END IF;

  -- Update document status to rejected
  UPDATE documents
  SET
    status = 'rejected',
    rejected_by = p_rejected_by,
    rejected_at = NOW(),
    rejection_reason = p_rejection_reason,
    approved_by = NULL,
    approved_at = NULL
  WHERE id = p_document_id;

  -- If this is a CV for a candidate, update candidate CV status
  IF v_document.type = 'cv' AND v_document.entity_type = 'candidate' THEN
    UPDATE candidates
    SET cv_status = 'rejected'
    WHERE id = v_document.entity_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get document version history
CREATE OR REPLACE FUNCTION get_document_versions(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_document_type TEXT
)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  file_url TEXT,
  file_size INTEGER,
  status TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_latest_version BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.version,
    d.file_url,
    d.file_size,
    d.status,
    d.uploaded_by,
    d.created_at AS uploaded_at,
    d.approved_by,
    d.approved_at,
    d.rejected_by,
    d.rejected_at,
    d.rejection_reason,
    d.is_latest_version
  FROM documents d
  WHERE d.entity_type = p_entity_type
    AND d.entity_id = p_entity_id
    AND d.type = p_document_type  -- Using 'type' column
    AND d.deleted_at IS NULL
  ORDER BY d.version DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update candidates.cv_status when CV document is uploaded
CREATE OR REPLACE FUNCTION update_candidate_cv_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is a CV document for a candidate
  IF NEW.type = 'cv' AND NEW.entity_type = 'candidate' AND NEW.is_latest_version = TRUE THEN
    UPDATE candidates
    SET cv_status = CASE
      WHEN NEW.status = 'pending' THEN 'pending'
      WHEN NEW.status = 'approved' THEN 'approved'
      WHEN NEW.status = 'rejected' THEN 'rejected'
      ELSE cv_status
    END
    WHERE id = NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_candidate_cv_status ON documents;
CREATE TRIGGER trg_update_candidate_cv_status
  AFTER INSERT OR UPDATE OF status ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_cv_status();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN documents.version IS 'Version number, incremented for each new version of the same document type';
COMMENT ON COLUMN documents.parent_document_id IS 'Links to previous version for version history tracking';
COMMENT ON COLUMN documents.is_latest_version IS 'TRUE only for the most recent version of this document type';
COMMENT ON COLUMN documents.status IS 'Approval status: pending (awaiting review), approved (ready for use), rejected (needs replacement)';
COMMENT ON COLUMN documents.approved_by IS 'User ID of recruiter who approved the document';
COMMENT ON COLUMN documents.approved_at IS 'Timestamp when document was approved';
COMMENT ON COLUMN documents.rejected_by IS 'User ID of recruiter who rejected the document';
COMMENT ON COLUMN documents.rejected_at IS 'Timestamp when document was rejected';
COMMENT ON COLUMN documents.rejection_reason IS 'Reason provided for document rejection';

COMMENT ON COLUMN candidates.cv_document_id IS 'Foreign key to the current approved CV document in documents table';
COMMENT ON COLUMN candidates.cv_status IS 'Quick status check for CV: not_uploaded, pending, approved, or rejected';

COMMENT ON FUNCTION get_latest_approved_document IS 'Returns the ID of the latest approved document for a given entity and document type';
COMMENT ON FUNCTION create_document_version IS 'Creates a new version of an existing document, maintaining version history';
COMMENT ON FUNCTION approve_document IS 'Approves a pending document and updates related records (e.g., candidates.cv_url for CVs)';
COMMENT ON FUNCTION reject_document IS 'Rejects a pending document with a reason, allowing candidate to upload a new version';
COMMENT ON FUNCTION get_document_versions IS 'Returns version history for a specific document type of an entity';

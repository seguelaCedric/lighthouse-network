-- ============================================================================
-- FIX CV EXTRACTION TRIGGER
-- ============================================================================
-- Updates the trigger to use entity_type/entity_id pattern instead of candidate_id
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_document_cv_extraction ON documents;

-- Update the trigger function to use entity_type/entity_id
CREATE OR REPLACE FUNCTION trigger_queue_cv_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if it's a CV document with extracted text for a candidate
  IF NEW.type = 'cv'
     AND NEW.extracted_text IS NOT NULL
     AND NEW.entity_type = 'candidate'
     AND NEW.entity_id IS NOT NULL THEN
    PERFORM queue_cv_extraction(NEW.entity_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_document_cv_extraction
  AFTER INSERT OR UPDATE OF extracted_text ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_queue_cv_extraction();

-- Add comment
COMMENT ON FUNCTION trigger_queue_cv_extraction() IS 'Auto-queues candidate CV documents for AI extraction when extracted_text is populated';

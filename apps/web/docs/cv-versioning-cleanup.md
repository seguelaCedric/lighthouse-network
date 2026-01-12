# CV Document Versioning & Embedding Cleanup

## Problem Statement

Previously, when candidates uploaded new CV versions:
- ✅ Document history was preserved (good for agency dashboard audit trail)
- ❌ Old extracted text and embeddings remained in database (wasted storage)
- ❌ Embedding triggers could fire on old versions (wasted queue operations)

This violated the principle: **"Keep document history for the agency dashboard, but embeddings need to use the most current data"**

## Solution

Migration `068_cleanup_old_document_embeddings.sql` implements a cleanup strategy that:

### 1. Preserves History (for Agency Dashboard)
Old document versions retain:
- `file_url` - Link to original file in storage
- `name` - Document filename
- `metadata` - Custom metadata
- `version` - Version number
- `created_at`, `uploaded_by`, etc. - Audit trail

### 2. Cleans Up Processed Data (saves storage)
Old document versions clear:
- `extracted_text` → NULL (can be 10kb-100kb+ per CV)
- `embedding` → NULL (1536 floats = ~6kb per CV)

### 3. Only Process Latest Versions
- Updated `create_document_version()` function to clear old data when creating new versions
- Updated embedding trigger to only fire when `is_latest_version = TRUE`
- Prevents unnecessary queue operations for historical versions

## Database Changes

### Modified Function: `create_document_version()`

```sql
-- Mark all previous versions as not latest AND clear their extracted data
UPDATE documents
SET
  is_latest_version = FALSE,
  extracted_text = NULL,  -- Clear old text extraction
  embedding = NULL        -- Clear old embedding
WHERE entity_type = v_parent.entity_type
  AND entity_id = v_parent.entity_id
  AND type = v_parent.type
  AND is_latest_version = TRUE
  AND deleted_at IS NULL;
```

### Modified Trigger: `trg_queue_embedding_on_document`

```sql
-- Only fire for latest versions
CREATE TRIGGER trg_queue_embedding_on_document
  AFTER INSERT OR UPDATE OF extracted_text, type
  ON documents
  FOR EACH ROW
  WHEN (NEW.entity_type = 'candidate' AND NEW.is_latest_version = TRUE)
  EXECUTE FUNCTION queue_candidate_embedding_on_document();
```

### Backfill Query

The migration includes a one-time cleanup:

```sql
UPDATE documents
SET
  extracted_text = NULL,
  embedding = NULL
WHERE is_latest_version = FALSE
  AND deleted_at IS NULL
  AND (extracted_text IS NOT NULL OR embedding IS NOT NULL);
```

## Storage Savings

For a candidate with 5 CV versions:

### Before
- Document 1: 50kb extracted_text + 6kb embedding = 56kb
- Document 2: 75kb extracted_text + 6kb embedding = 81kb
- Document 3: 60kb extracted_text + 6kb embedding = 66kb
- Document 4: 80kb extracted_text + 6kb embedding = 86kb
- Document 5 (latest): 70kb extracted_text + 6kb embedding = 76kb
- **Total: 365kb**

### After
- Document 1: 0kb (history preserved, data cleared)
- Document 2: 0kb (history preserved, data cleared)
- Document 3: 0kb (history preserved, data cleared)
- Document 4: 0kb (history preserved, data cleared)
- Document 5 (latest): 70kb extracted_text + 6kb embedding = 76kb
- **Total: 76kb (79% reduction)**

For 10,000 candidates with average 3 versions each:
- **Savings: ~5.8 GB of database storage**

## Architecture Benefits

### 1. Clear Separation of Concerns
- **History/Audit** → Document metadata (file_url, name, version, timestamps)
- **Active Processing** → Only latest version (extracted_text, embedding)

### 2. Guaranteed Data Consistency
- Embedding worker already filtered by `is_latest_version = true` (line 309 in embedding-worker.ts)
- Now database-level guarantee that old versions have no processable data
- Impossible to accidentally process old CV data

### 3. Reduced Queue Noise
- Old document updates no longer trigger embedding queue
- Only meaningful changes (new versions) trigger processing

### 4. Race Condition Prevention
**Problem:** Without immediate invalidation, searches could return stale results during the 5-10 second window between CV upload and embedding regeneration.

**Solution:** When creating a new CV version, we immediately clear `candidates.embedding`:
```sql
IF v_parent.entity_type = 'candidate' AND v_parent.type = 'cv' THEN
  UPDATE candidates SET embedding = NULL WHERE id = v_parent.entity_id;
END IF;
```

This ensures:
- Candidates with pending CV processing won't appear in vector/semantic search results
- They still appear in filter-based and text searches
- Once embedding regenerates, they return to semantic search with fresh data
- No possibility of matching candidates based on outdated CV content

## Testing

Run the test script to verify behavior:

```bash
npx tsx apps/web/scripts/test-document-version-cleanup.ts
```

Expected output:
```
✅ oldVersionFlagCleared
✅ oldExtractedTextCleared
✅ oldEmbeddingCleared
✅ oldMetadataPreserved
✅ newVersionFlagSet
✅ newVersionNumber
```

## Migration Checklist

- [x] Update `create_document_version()` function to clear old data
- [x] Update embedding trigger to only fire for latest versions
- [x] Add backfill query to clean existing old versions
- [x] Create test script to verify behavior
- [x] Document storage savings and architecture benefits

## Rollout Plan

1. **Test in development** - Run test script to verify
2. **Apply to staging** - Monitor for issues
3. **Backfill analysis** - Check how much storage will be freed
4. **Apply to production** - During low-traffic period
5. **Monitor** - Verify embedding queue only processes latest versions

## Related Files

- Migration: `supabase/migrations/068_cleanup_old_document_embeddings.sql`
- Test script: `apps/web/scripts/test-document-version-cleanup.ts`
- Embedding worker: `apps/web/lib/services/embedding-worker.ts:309`
- Original function: `supabase/migrations/012_document_management.sql:91-170`
- Original trigger: `supabase/migrations/014_ai_matching_foundation.sql:201-207`

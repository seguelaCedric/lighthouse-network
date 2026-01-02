-- ============================================================================
-- CV SEARCH INFRASTRUCTURE
-- Migration: 019_cv_search.sql
-- Description: Enable semantic CV search using hybrid approach:
--              whole-document embeddings + CV chunk embeddings + full-text search
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- 1. CV CHUNKS TABLE
-- ============================================================================
-- Stores chunked CV text with embeddings for granular semantic search
-- Each CV is split into 3-5 chunks to improve search within long documents

CREATE TABLE IF NOT EXISTS cv_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Chunk positioning
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_start_offset INTEGER,
  chunk_end_offset INTEGER,

  -- Embedding vector (same dimensions as candidates.embedding)
  embedding vector(1536),

  -- Section metadata for weighted scoring
  section_type TEXT,  -- 'summary', 'experience', 'skills', 'education', 'other'
  section_weight FLOAT DEFAULT 1.0,  -- Boost summary=1.3, experience=1.2

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique chunks per document
  UNIQUE(document_id, chunk_index)
);

-- ============================================================================
-- 2. INDEXES FOR CV CHUNKS
-- ============================================================================

-- HNSW index for vector similarity search on chunks
CREATE INDEX IF NOT EXISTS idx_cv_chunks_embedding_hnsw
  ON cv_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 200);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_cv_chunks_candidate ON cv_chunks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cv_chunks_document ON cv_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_cv_chunks_section ON cv_chunks(section_type);

-- ============================================================================
-- 3. FULL-TEXT SEARCH ON DOCUMENTS
-- ============================================================================
-- Add tsvector column for CV full-text search

ALTER TABLE documents ADD COLUMN IF NOT EXISTS cv_search_vector tsvector;

-- Trigger to auto-update tsvector when CV text changes
CREATE OR REPLACE FUNCTION update_cv_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'cv' AND NEW.extracted_text IS NOT NULL THEN
    NEW.cv_search_vector := to_tsvector('english', NEW.extracted_text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cv_search_vector ON documents;
CREATE TRIGGER trg_cv_search_vector
  BEFORE INSERT OR UPDATE OF extracted_text, type
  ON documents FOR EACH ROW
  EXECUTE FUNCTION update_cv_search_vector();

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_documents_cv_search_vector
  ON documents USING GIN(cv_search_vector)
  WHERE type = 'cv' AND deleted_at IS NULL;

-- ============================================================================
-- 4. QUEUE CV CHUNKS FOR EMBEDDING
-- ============================================================================
-- Trigger to queue CV chunks when documents are created/updated

CREATE OR REPLACE FUNCTION queue_cv_chunks_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue CV documents with extracted text
  IF NEW.type = 'cv' AND NEW.extracted_text IS NOT NULL AND length(NEW.extracted_text) > 100 THEN
    INSERT INTO embedding_queue (entity_type, entity_id, priority, status)
    VALUES ('cv_document', NEW.id, 3, 'pending')
    ON CONFLICT (entity_type, entity_id) WHERE status = 'pending'
    DO UPDATE SET updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_cv_chunks ON documents;
CREATE TRIGGER trg_queue_cv_chunks
  AFTER INSERT OR UPDATE OF extracted_text
  ON documents FOR EACH ROW
  EXECUTE FUNCTION queue_cv_chunks_embedding();

-- ============================================================================
-- 5. HYBRID CV SEARCH FUNCTION
-- ============================================================================
-- Combines three search signals with weighted fusion:
-- - Whole-document embedding similarity (70%)
-- - CV chunk embedding similarity (20%)
-- - Full-text keyword matching (10%)

CREATE OR REPLACE FUNCTION search_cv_hybrid(
  query_embedding vector(1536),
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.35,
  match_count INT DEFAULT 100,
  p_verification_tiers TEXT[] DEFAULT ARRAY['basic','identity','verified','premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available','looking','employed']
)
RETURNS TABLE (
  candidate_id UUID,
  combined_score FLOAT,
  whole_doc_score FLOAT,
  chunk_score FLOAT,
  fulltext_score FLOAT,
  best_snippet TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Signal 1: Whole-document embedding matches (existing candidate embeddings)
  whole_doc AS (
    SELECT c.id, 1 - (c.embedding <=> query_embedding) as score
    FROM candidates c
    WHERE c.embedding IS NOT NULL
      AND c.deleted_at IS NULL
      AND c.verification_tier::TEXT = ANY(p_verification_tiers)
      AND c.availability_status::TEXT = ANY(p_availability_statuses)
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count * 2
  ),

  -- Signal 2: CV chunk embedding matches
  chunk_matches AS (
    SELECT
      cc.candidate_id,
      MAX(1 - (cc.embedding <=> query_embedding)) as max_sim,
      (
        SELECT chunk_text
        FROM cv_chunks sub
        WHERE sub.candidate_id = cc.candidate_id
          AND sub.embedding IS NOT NULL
        ORDER BY sub.embedding <=> query_embedding
        LIMIT 1
      ) as best_chunk
    FROM cv_chunks cc
    WHERE cc.embedding IS NOT NULL
    GROUP BY cc.candidate_id
    HAVING MAX(1 - (cc.embedding <=> query_embedding)) >= match_threshold * 0.8
  ),

  -- Signal 3: Full-text keyword matches
  fulltext AS (
    SELECT
      d.entity_id as candidate_id,
      ts_rank_cd(d.cv_search_vector, websearch_to_tsquery('english', query_text)) as rank,
      ts_headline('english', d.extracted_text,
        websearch_to_tsquery('english', query_text),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
      ) as snippet
    FROM documents d
    WHERE d.type = 'cv'
      AND d.deleted_at IS NULL
      AND d.entity_type = 'candidate'
      AND d.cv_search_vector @@ websearch_to_tsquery('english', query_text)
  )

  -- Combine all three signals with weighted RRF
  SELECT
    COALESCE(wd.id, cm.candidate_id, ft.candidate_id) as candidate_id,
    -- Combined score: 70% whole-doc + 20% chunks + 10% fulltext
    (
      COALESCE(wd.score, 0) * 0.7 +
      COALESCE(cm.max_sim, 0) * 0.2 +
      LEAST(COALESCE(ft.rank, 0), 1.0) * 0.1
    )::FLOAT as combined_score,
    COALESCE(wd.score, 0)::FLOAT as whole_doc_score,
    COALESCE(cm.max_sim, 0)::FLOAT as chunk_score,
    COALESCE(ft.rank, 0)::FLOAT as fulltext_score,
    COALESCE(ft.snippet, LEFT(cm.best_chunk, 300)) as best_snippet
  FROM whole_doc wd
  FULL OUTER JOIN chunk_matches cm ON wd.id = cm.candidate_id
  FULL OUTER JOIN fulltext ft ON COALESCE(wd.id, cm.candidate_id) = ft.candidate_id
  WHERE
    -- Must meet threshold in at least one signal
    COALESCE(wd.score, 0) >= match_threshold
    OR COALESCE(cm.max_sim, 0) >= match_threshold
    OR ft.rank > 0.1
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. SIMPLE CV SEARCH (VECTOR ONLY)
-- ============================================================================
-- Lighter-weight search using only chunk embeddings (for quick searches)

CREATE OR REPLACE FUNCTION search_cv_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.4,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  candidate_id UUID,
  chunk_id UUID,
  similarity FLOAT,
  chunk_text TEXT,
  section_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (cc.candidate_id)
    cc.candidate_id,
    cc.id as chunk_id,
    (1 - (cc.embedding <=> query_embedding))::FLOAT as similarity,
    cc.chunk_text,
    cc.section_type
  FROM cv_chunks cc
  WHERE cc.embedding IS NOT NULL
    AND (1 - (cc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY cc.candidate_id, cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. FULL-TEXT SEARCH ONLY
-- ============================================================================
-- For pure keyword searches without semantic matching

CREATE OR REPLACE FUNCTION search_cv_fulltext(
  query_text TEXT,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  candidate_id UUID,
  rank FLOAT,
  headline TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.entity_id as candidate_id,
    ts_rank_cd(d.cv_search_vector, websearch_to_tsquery('english', query_text))::FLOAT as rank,
    ts_headline('english', d.extracted_text,
      websearch_to_tsquery('english', query_text),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=75, MinWords=30'
    ) as headline
  FROM documents d
  WHERE d.type = 'cv'
    AND d.deleted_at IS NULL
    AND d.entity_type = 'candidate'
    AND d.cv_search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. GET CANDIDATE CV CHUNKS
-- ============================================================================
-- Fetch all chunks for a specific candidate (for display/debugging)

CREATE OR REPLACE FUNCTION get_candidate_cv_chunks(
  p_candidate_id UUID
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  section_type TEXT,
  section_weight FLOAT,
  has_embedding BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.chunk_index,
    cc.chunk_text,
    cc.section_type,
    cc.section_weight,
    cc.embedding IS NOT NULL as has_embedding
  FROM cv_chunks cc
  WHERE cc.candidate_id = p_candidate_id
  ORDER BY cc.chunk_index;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 9. CV SEARCH STATS
-- ============================================================================
-- Health check for CV search infrastructure

CREATE OR REPLACE FUNCTION check_cv_search_health()
RETURNS TABLE (
  metric TEXT,
  value BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Total CV documents
  SELECT 'total_cv_documents'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 0 THEN 'ok' ELSE 'warning' END
  FROM documents WHERE type = 'cv' AND deleted_at IS NULL

  UNION ALL

  -- CVs with extracted text
  SELECT 'cvs_with_text'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 0 THEN 'ok' ELSE 'warning' END
  FROM documents
  WHERE type = 'cv' AND deleted_at IS NULL
    AND extracted_text IS NOT NULL AND length(extracted_text) > 100

  UNION ALL

  -- CVs with search vector
  SELECT 'cvs_with_search_vector'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 0 THEN 'ok' ELSE 'warning' END
  FROM documents
  WHERE type = 'cv' AND deleted_at IS NULL AND cv_search_vector IS NOT NULL

  UNION ALL

  -- Total CV chunks
  SELECT 'total_cv_chunks'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 0 THEN 'ok' ELSE 'warning' END
  FROM cv_chunks

  UNION ALL

  -- Chunks with embeddings
  SELECT 'chunks_with_embeddings'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 0 THEN 'ok' ELSE 'warning' END
  FROM cv_chunks WHERE embedding IS NOT NULL

  UNION ALL

  -- Unique candidates with chunks
  SELECT 'candidates_with_chunks'::TEXT, COUNT(DISTINCT candidate_id)::BIGINT,
    CASE WHEN COUNT(DISTINCT candidate_id) > 0 THEN 'ok' ELSE 'warning' END
  FROM cv_chunks

  UNION ALL

  -- Average chunks per candidate
  SELECT 'avg_chunks_per_candidate'::TEXT,
    COALESCE(ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT candidate_id), 0)), 0)::BIGINT,
    'info'
  FROM cv_chunks

  UNION ALL

  -- Pending CV embedding queue items
  SELECT 'queue_cv_pending'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) < 100 THEN 'ok' WHEN COUNT(*) < 500 THEN 'warning' ELSE 'critical' END
  FROM embedding_queue WHERE entity_type = 'cv_document' AND status = 'pending';

END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 10. BACKFILL EXISTING CVS WITH SEARCH VECTOR
-- ============================================================================
-- Update existing CV documents to have tsvector (one-time backfill)

UPDATE documents
SET cv_search_vector = to_tsvector('english', extracted_text)
WHERE type = 'cv'
  AND deleted_at IS NULL
  AND extracted_text IS NOT NULL
  AND cv_search_vector IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cv_chunks IS
  'Chunked CV text with embeddings for granular semantic search. Each CV is split into 3-5 overlapping chunks.';

COMMENT ON FUNCTION search_cv_hybrid IS
  'Three-signal hybrid CV search: whole-document embeddings (70%) + CV chunks (20%) + full-text (10%). Use with Cohere reranking for best precision.';

COMMENT ON FUNCTION search_cv_chunks IS
  'Simple CV chunk-only semantic search. Faster but less comprehensive than hybrid search.';

COMMENT ON FUNCTION search_cv_fulltext IS
  'Pure keyword-based CV search using PostgreSQL full-text search.';

COMMENT ON FUNCTION check_cv_search_health IS
  'Health check for CV search infrastructure: document counts, chunk coverage, queue status.';

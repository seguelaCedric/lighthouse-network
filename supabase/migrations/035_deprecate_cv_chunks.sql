-- ============================================================================
-- DEPRECATE CV CHUNKS - One Candidate = One Embedding
-- Migration: 035_deprecate_cv_chunks.sql
-- Description: Remove CV chunking approach in favor of unified candidate embeddings.
--              The processCandidate() function creates ONE embedding per candidate
--              stored in candidates.embedding column, which is simpler and prevents
--              candidate mixing issues that can occur with chunk-based search.
-- ============================================================================

-- ============================================================================
-- 1. CREATE search_candidates_by_embedding FUNCTION
-- ============================================================================
-- This is used by semantic-only mode to search against candidates.embedding

CREATE OR REPLACE FUNCTION search_candidates_by_embedding(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.35,
  match_count INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    (1 - (c.embedding <=> query_embedding))::FLOAT as similarity
  FROM candidates c
  WHERE c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_candidates_by_embedding IS
  'Semantic search using unified candidate embeddings (one embedding per candidate). Used for semantic-only search mode.';

-- ============================================================================
-- 2. UPDATE search_cv_hybrid TO REMOVE CHUNK DEPENDENCY
-- ============================================================================
-- Remove the cv_chunks signal, keep only whole-doc embeddings + fulltext

DROP FUNCTION IF EXISTS search_cv_hybrid(
  vector(1536),
  TEXT,
  FLOAT,
  INT,
  TEXT[],
  TEXT[]
);

CREATE OR REPLACE FUNCTION search_cv_hybrid(
  query_embedding vector(1536),
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.35,
  match_count INT DEFAULT 100,
  p_verification_tiers TEXT[] DEFAULT ARRAY['unverified','basic','identity','verified','premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available','looking','employed']
)
RETURNS TABLE (
  candidate_id UUID,
  combined_score FLOAT,
  whole_doc_score FLOAT,
  chunk_score FLOAT,  -- Kept for API compatibility, always returns 0
  fulltext_score FLOAT,
  best_snippet TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Signal 1: Whole-document embedding matches (unified candidate embeddings)
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

  -- Signal 2: Full-text keyword matches (from CV documents)
  fulltext AS (
    SELECT
      d.entity_id as candidate_id,
      ts_rank_cd(d.cv_search_vector, websearch_to_tsquery('english', query_text)) as rank,
      ts_headline('english', d.extracted_text,
        websearch_to_tsquery('english', query_text),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
      ) as snippet
    FROM documents d
    JOIN candidates c ON c.id = d.entity_id
    WHERE d.type = 'cv'
      AND d.deleted_at IS NULL
      AND d.entity_type = 'candidate'
      AND d.cv_search_vector @@ websearch_to_tsquery('english', query_text)
      AND c.deleted_at IS NULL
  )

  -- Combine signals: 80% whole-doc + 20% fulltext (chunks removed)
  SELECT
    COALESCE(wd.id, ft.candidate_id) as candidate_id,
    (
      COALESCE(wd.score, 0) * 0.8 +
      LEAST(COALESCE(ft.rank, 0), 1.0) * 0.2
    )::FLOAT as combined_score,
    COALESCE(wd.score, 0)::FLOAT as whole_doc_score,
    0::FLOAT as chunk_score,  -- Always 0 - chunks deprecated
    COALESCE(ft.rank, 0)::FLOAT as fulltext_score,
    ft.snippet as best_snippet
  FROM whole_doc wd
  FULL OUTER JOIN fulltext ft ON wd.id = ft.candidate_id
  WHERE
    COALESCE(wd.score, 0) >= match_threshold
    OR ft.rank > 0.1
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_cv_hybrid IS
  'Two-signal hybrid CV search using unified candidate embeddings (80%) and fulltext (20%). CV chunks deprecated - one embedding per candidate.';

-- ============================================================================
-- 3. DROP CV CHUNKS RELATED FUNCTIONS
-- ============================================================================

-- Drop the search function
DROP FUNCTION IF EXISTS search_cv_chunks(
  vector(1536),
  FLOAT,
  INT
);

DROP FUNCTION IF EXISTS search_cv_chunks(
  vector(1536),
  FLOAT,
  INT,
  TEXT,
  INT
);

-- Drop the get chunks helper
DROP FUNCTION IF EXISTS get_candidate_cv_chunks(UUID);

-- Drop embedding queue trigger function for cv_chunks
DROP TRIGGER IF EXISTS queue_cv_chunks_embedding ON cv_chunks;
DROP FUNCTION IF EXISTS queue_cv_document_embedding();

-- ============================================================================
-- 4. DROP CV_CHUNKS TABLE
-- ============================================================================
-- This table stored CV text split into 3-5 chunks with individual embeddings.
-- We now use a single unified embedding per candidate in candidates.embedding.

DROP TABLE IF EXISTS cv_chunks CASCADE;

-- ============================================================================
-- 5. CLEANUP EMBEDDING QUEUE - Remove any pending cv_document entries
-- ============================================================================

DELETE FROM embedding_queue WHERE entity_type = 'cv_document';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Before: CV text was split into 3-5 chunks in cv_chunks table, each with
--         its own embedding. search_cv_hybrid combined whole-doc (70%) +
--         chunks (20%) + fulltext (10%).
--
-- After:  One unified embedding per candidate in candidates.embedding column.
--         search_cv_hybrid now uses whole-doc (80%) + fulltext (20%).
--         search_candidates_by_embedding for pure semantic search.
--
-- Benefits:
-- - Simpler architecture (one embedding per candidate)
-- - No risk of mixing up candidates in chunk-based search
-- - Lower storage costs (fewer embeddings)
-- - Faster search (fewer vectors to compare)
-- ============================================================================

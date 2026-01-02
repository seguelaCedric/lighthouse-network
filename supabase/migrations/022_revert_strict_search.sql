-- ============================================================================
-- REVERT STRICT SEARCH - Pure Semantic + Cohere Reranking
-- Migration: 022_revert_strict_search.sql
-- Description: Remove restrictive department/experience filters from search.
--              Trust embeddings for retrieval + Cohere reranking for precision.
-- ============================================================================
-- PHILOSOPHY:
-- Stage 1 (Embeddings): Cast a wide net - low threshold, no hard filters
-- Stage 2 (Cohere): AI understands query + candidate text, ranks intelligently
-- ============================================================================

-- ============================================================================
-- 1. DROP AND RECREATE search_cv_hybrid WITHOUT RESTRICTIVE FILTERS
-- ============================================================================

-- Drop the strict 8-parameter version
DROP FUNCTION IF EXISTS search_cv_hybrid(
  vector(1536),
  TEXT,
  FLOAT,
  INT,
  TEXT[],
  TEXT[],
  TEXT,
  INT
);

-- Also drop any 6-parameter version that might exist
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
  match_threshold FLOAT DEFAULT 0.35,  -- LOWERED back to 0.35 - let Cohere do the filtering
  match_count INT DEFAULT 100,
  p_verification_tiers TEXT[] DEFAULT ARRAY['unverified','basic','identity','verified','premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available','looking','employed']
  -- REMOVED: p_department, p_min_experience - these were too restrictive
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
      -- REMOVED: Department filter - let embeddings and Cohere handle relevance
      -- REMOVED: Experience filter - let Cohere evaluate this from profile text
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
    JOIN candidates c ON c.id = cc.candidate_id
    WHERE cc.embedding IS NOT NULL
      AND c.deleted_at IS NULL
      -- REMOVED: Department and experience filters
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
    JOIN candidates c ON c.id = d.entity_id
    WHERE d.type = 'cv'
      AND d.deleted_at IS NULL
      AND d.entity_type = 'candidate'
      AND d.cv_search_vector @@ websearch_to_tsquery('english', query_text)
      AND c.deleted_at IS NULL
      -- REMOVED: Department and experience filters
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
    -- Must meet threshold in at least one signal (PERMISSIVE - let Cohere filter)
    COALESCE(wd.score, 0) >= match_threshold
    OR COALESCE(cm.max_sim, 0) >= match_threshold
    OR ft.rank > 0.1  -- Back to 0.1 for fulltext
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. UPDATE SEARCH_CV_CHUNKS WITHOUT FILTERS
-- ============================================================================

DROP FUNCTION IF EXISTS search_cv_chunks(
  vector(1536),
  FLOAT,
  INT,
  TEXT,
  INT
);

DROP FUNCTION IF EXISTS search_cv_chunks(
  vector(1536),
  FLOAT,
  INT
);

CREATE OR REPLACE FUNCTION search_cv_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.35,  -- LOWERED from 0.5
  match_count INT DEFAULT 50
  -- REMOVED: p_department, p_min_experience
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
  JOIN candidates c ON c.id = cc.candidate_id
  WHERE cc.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND (1 - (cc.embedding <=> query_embedding)) >= match_threshold
    -- REMOVED: Department and experience filters
  ORDER BY cc.candidate_id, cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_cv_hybrid IS
  'Three-signal hybrid CV search. Uses embeddings for retrieval (threshold 0.35), relies on Cohere reranking for precision. No department/experience hard filters.';

COMMENT ON FUNCTION search_cv_chunks IS
  'CV chunk semantic search. Uses low threshold (0.35) to cast wide net, relies on Cohere reranking for relevance.';

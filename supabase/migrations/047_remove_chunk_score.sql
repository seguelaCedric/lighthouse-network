-- ============================================================================
-- REMOVE CHUNK_SCORE FROM HYBRID SEARCH
-- Migration: 047_remove_chunk_score.sql
-- Description: Remove the chunk_score column from search_cv_hybrid function.
--              chunk_score was kept for "API compatibility" in migration 035
--              but is no longer needed as all client code has been updated.
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS search_cv_hybrid(
  vector(1536),
  TEXT,
  FLOAT,
  INT,
  TEXT[],
  TEXT[]
);

-- Recreate without chunk_score
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

  -- Combine signals: 80% whole-doc + 20% fulltext
  SELECT
    COALESCE(wd.id, ft.candidate_id) as candidate_id,
    (
      COALESCE(wd.score, 0) * 0.8 +
      LEAST(COALESCE(ft.rank, 0), 1.0) * 0.2
    )::FLOAT as combined_score,
    COALESCE(wd.score, 0)::FLOAT as whole_doc_score,
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
  'Two-signal hybrid CV search using unified candidate embeddings (80%) and fulltext (20%). Returns whole_doc_score and fulltext_score.';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Removed chunk_score from the return type.
-- Before: candidate_id, combined_score, whole_doc_score, chunk_score, fulltext_score, best_snippet
-- After:  candidate_id, combined_score, whole_doc_score, fulltext_score, best_snippet
-- ============================================================================

-- ============================================================================
-- FIX CV SEARCH
-- Migration: 021_fix_cv_search.sql
-- Description: Fix broken AI search - add department filtering, experience
--              filtering, and increase similarity threshold
-- ============================================================================
-- PROBLEM: Searching "bosun with 5 years experience" returns "Bar Server"
-- CAUSE: No department filtering, too-low similarity threshold (0.35)
-- ============================================================================

-- ============================================================================
-- 1. DROP AND RECREATE search_cv_hybrid WITH PROPER FILTERS
-- ============================================================================

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
  match_threshold FLOAT DEFAULT 0.5,  -- INCREASED from 0.35 to 0.5
  match_count INT DEFAULT 100,
  p_verification_tiers TEXT[] DEFAULT ARRAY['basic','identity','verified','premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available','looking','employed'],
  p_department TEXT DEFAULT NULL,      -- NEW: Filter by department (deck, interior, engineering, galley)
  p_min_experience INT DEFAULT NULL    -- NEW: Minimum years of experience
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
      -- NEW: Experience filter
      AND (p_min_experience IS NULL OR COALESCE(c.years_experience, 0) >= p_min_experience)
      -- NEW: Department filter based on primary_position
      AND (p_department IS NULL OR
        CASE p_department
          WHEN 'deck' THEN LOWER(c.primary_position) ~*
            '(captain|bosun|mate|officer|deckhand|deck|navigator|quartermaster|sailor|ab\s|able\s)'
          WHEN 'interior' THEN LOWER(c.primary_position) ~*
            '(stew|steward|stewardess|chief stew|butler|purser|housekeeper|hostess|service|hospitality)'
          WHEN 'engineering' THEN LOWER(c.primary_position) ~*
            '(engineer|eto|electrician|mechanic|technical|av tech|it tech)'
          WHEN 'galley' THEN LOWER(c.primary_position) ~*
            '(chef|cook|sous|pastry|galley|culinary|baker)'
          ELSE TRUE
        END
      )
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
      -- NEW: Experience filter on chunks
      AND (p_min_experience IS NULL OR COALESCE(c.years_experience, 0) >= p_min_experience)
      -- NEW: Department filter on chunks
      AND (p_department IS NULL OR
        CASE p_department
          WHEN 'deck' THEN LOWER(c.primary_position) ~*
            '(captain|bosun|mate|officer|deckhand|deck|navigator|quartermaster|sailor|ab\s|able\s)'
          WHEN 'interior' THEN LOWER(c.primary_position) ~*
            '(stew|steward|stewardess|chief stew|butler|purser|housekeeper|hostess|service|hospitality)'
          WHEN 'engineering' THEN LOWER(c.primary_position) ~*
            '(engineer|eto|electrician|mechanic|technical|av tech|it tech)'
          WHEN 'galley' THEN LOWER(c.primary_position) ~*
            '(chef|cook|sous|pastry|galley|culinary|baker)'
          ELSE TRUE
        END
      )
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
      -- NEW: Experience filter on fulltext
      AND (p_min_experience IS NULL OR COALESCE(c.years_experience, 0) >= p_min_experience)
      -- NEW: Department filter on fulltext
      AND (p_department IS NULL OR
        CASE p_department
          WHEN 'deck' THEN LOWER(c.primary_position) ~*
            '(captain|bosun|mate|officer|deckhand|deck|navigator|quartermaster|sailor|ab\s|able\s)'
          WHEN 'interior' THEN LOWER(c.primary_position) ~*
            '(stew|steward|stewardess|chief stew|butler|purser|housekeeper|hostess|service|hospitality)'
          WHEN 'engineering' THEN LOWER(c.primary_position) ~*
            '(engineer|eto|electrician|mechanic|technical|av tech|it tech)'
          WHEN 'galley' THEN LOWER(c.primary_position) ~*
            '(chef|cook|sous|pastry|galley|culinary|baker)'
          ELSE TRUE
        END
      )
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
    -- Must meet threshold in at least one signal (STRICTER)
    COALESCE(wd.score, 0) >= match_threshold
    OR COALESCE(cm.max_sim, 0) >= match_threshold
    OR ft.rank > 0.2  -- INCREASED from 0.1
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. UPDATE SEARCH_CV_CHUNKS WITH FILTERS
-- ============================================================================

DROP FUNCTION IF EXISTS search_cv_chunks(
  vector(1536),
  FLOAT,
  INT
);

CREATE OR REPLACE FUNCTION search_cv_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,  -- INCREASED from 0.4
  match_count INT DEFAULT 50,
  p_department TEXT DEFAULT NULL,
  p_min_experience INT DEFAULT NULL
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
    -- NEW: Filters
    AND (p_min_experience IS NULL OR COALESCE(c.years_experience, 0) >= p_min_experience)
    AND (p_department IS NULL OR
      CASE p_department
        WHEN 'deck' THEN LOWER(c.primary_position) ~*
          '(captain|bosun|mate|officer|deckhand|deck|navigator|quartermaster|sailor|ab\s|able\s)'
        WHEN 'interior' THEN LOWER(c.primary_position) ~*
          '(stew|steward|stewardess|chief stew|butler|purser|housekeeper|hostess|service|hospitality)'
        WHEN 'engineering' THEN LOWER(c.primary_position) ~*
          '(engineer|eto|electrician|mechanic|technical|av tech|it tech)'
        WHEN 'galley' THEN LOWER(c.primary_position) ~*
          '(chef|cook|sous|pastry|galley|culinary|baker)'
        ELSE TRUE
      END
    )
  ORDER BY cc.candidate_id, cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_cv_hybrid IS
  'Three-signal hybrid CV search with department and experience filtering. Default threshold 0.5. Departments: deck, interior, engineering, galley.';

COMMENT ON FUNCTION search_cv_chunks IS
  'CV chunk semantic search with department and experience filtering. Default threshold 0.5.';

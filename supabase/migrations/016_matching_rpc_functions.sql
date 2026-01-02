-- ============================================================================
-- MATCHING RPC FUNCTIONS
-- Migration: 016_matching_rpc_functions.sql
-- Description: Hybrid search functions combining vector + full-text for matching
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Drop existing functions for clean recreation
DROP FUNCTION IF EXISTS match_candidates_hybrid(vector, TEXT, INT, FLOAT, TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS match_candidates_broad(vector, FLOAT, INT, TEXT);
DROP FUNCTION IF EXISTS match_jobs_for_candidate(UUID, INT, FLOAT);

-- ============================================================================
-- HYBRID SEARCH: CANDIDATES FOR JOB
-- ============================================================================
-- Combines vector similarity with full-text search using RRF (Reciprocal Rank Fusion)
-- This gives better results than pure vector search for structured queries
-- ============================================================================

CREATE OR REPLACE FUNCTION match_candidates_hybrid(
  -- Input parameters
  p_query_embedding vector(1536),     -- Job embedding
  p_search_text TEXT DEFAULT NULL,    -- Optional text query for keyword boost
  p_limit INT DEFAULT 50,             -- How many results to return
  p_similarity_threshold FLOAT DEFAULT 0.3,  -- Minimum vector similarity

  -- Hard filters (applied BEFORE scoring)
  p_position_categories TEXT[] DEFAULT NULL,  -- Position filter
  p_availability_statuses TEXT[] DEFAULT ARRAY['available', 'looking'],
  p_verification_tiers TEXT[] DEFAULT NULL,   -- Minimum verification tier
  p_exclude_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Soft filters (for scoring boost)
  p_has_stcw BOOLEAN DEFAULT NULL,
  p_has_eng1 BOOLEAN DEFAULT NULL,
  p_has_schengen BOOLEAN DEFAULT NULL,
  p_has_b1b2 BOOLEAN DEFAULT NULL,
  p_min_experience INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  primary_position TEXT,
  secondary_positions TEXT[],
  years_experience INTEGER,
  nationality TEXT,
  second_nationality TEXT,
  current_location TEXT,

  -- Certifications
  has_stcw BOOLEAN,
  stcw_expiry DATE,
  has_eng1 BOOLEAN,
  eng1_expiry DATE,
  highest_license TEXT,

  -- Visas
  has_schengen BOOLEAN,
  has_b1b2 BOOLEAN,
  has_c1d BOOLEAN,

  -- Availability
  availability_status availability_status,
  available_from DATE,

  -- Preferences
  preferred_yacht_types TEXT[],
  preferred_yacht_size_min INTEGER,
  preferred_yacht_size_max INTEGER,
  preferred_regions TEXT[],
  preferred_contract_types contract_type[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,

  -- Personal
  is_smoker BOOLEAN,
  has_visible_tattoos BOOLEAN,
  is_couple BOOLEAN,
  partner_position TEXT,

  -- Verification
  verification_tier verification_tier,

  -- AI fields
  profile_summary TEXT,
  embedding_text TEXT,

  -- Scores
  vector_similarity FLOAT,
  text_rank FLOAT,
  combined_score FLOAT
) AS $$
DECLARE
  k_rrf FLOAT := 60.0;  -- RRF constant (standard value)
BEGIN
  -- Set HNSW search parameter for this query
  PERFORM set_hnsw_ef_search(100);

  RETURN QUERY
  WITH
  -- Vector search results
  vector_results AS (
    SELECT
      c.id,
      1 - (c.embedding <=> p_query_embedding) as similarity,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> p_query_embedding) as vector_rank
    FROM candidates c
    WHERE
      c.embedding IS NOT NULL
      AND c.deleted_at IS NULL
      AND c.availability_status::TEXT = ANY(p_availability_statuses)
      AND (p_position_categories IS NULL OR c.position_category::TEXT = ANY(p_position_categories))
      AND (p_verification_tiers IS NULL OR c.verification_tier::TEXT = ANY(p_verification_tiers))
      AND (ARRAY_LENGTH(p_exclude_ids, 1) IS NULL OR c.id != ALL(p_exclude_ids))
      AND 1 - (c.embedding <=> p_query_embedding) >= p_similarity_threshold
      -- Soft filter application
      AND (p_has_stcw IS NULL OR c.has_stcw = p_has_stcw)
      AND (p_has_eng1 IS NULL OR c.has_eng1 = p_has_eng1)
      AND (p_has_schengen IS NULL OR c.has_schengen = p_has_schengen)
      AND (p_has_b1b2 IS NULL OR c.has_b1b2 = p_has_b1b2)
      AND (p_min_experience IS NULL OR COALESCE(c.years_experience, 0) >= p_min_experience)
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT p_limit * 2  -- Get more for RRF fusion
  ),

  -- Full-text search results (if search text provided)
  text_results AS (
    SELECT
      c.id,
      ts_rank_cd(c.search_vector, websearch_to_tsquery('english', p_search_text)) as rank,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(c.search_vector, websearch_to_tsquery('english', p_search_text)) DESC
      ) as text_rank
    FROM candidates c
    WHERE
      p_search_text IS NOT NULL
      AND p_search_text != ''
      AND c.search_vector @@ websearch_to_tsquery('english', p_search_text)
      AND c.deleted_at IS NULL
      AND c.availability_status::TEXT = ANY(p_availability_statuses)
    ORDER BY rank DESC
    LIMIT p_limit * 2
  ),

  -- Combine with RRF
  combined AS (
    SELECT
      COALESCE(v.id, t.id) as candidate_id,
      v.similarity as vector_sim,
      t.rank as text_r,
      -- RRF formula: 1/(k + rank) - higher is better
      COALESCE(1.0 / (k_rrf + v.vector_rank), 0) as vector_rrf,
      COALESCE(1.0 / (k_rrf + t.text_rank), 0) as text_rrf
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
  ),

  scored AS (
    SELECT
      candidate_id,
      vector_sim,
      text_r,
      -- Combined RRF score (weighted: 70% vector, 30% text)
      (0.7 * vector_rrf + 0.3 * text_rrf) as rrf_score
    FROM combined
    ORDER BY rrf_score DESC
    LIMIT p_limit
  )

  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.primary_position,
    c.secondary_positions,
    c.years_experience,
    c.nationality,
    c.second_nationality,
    c.current_location,
    c.has_stcw,
    c.stcw_expiry,
    c.has_eng1,
    c.eng1_expiry,
    c.highest_license,
    c.has_schengen,
    c.has_b1b2,
    c.has_c1d,
    c.availability_status,
    c.available_from,
    c.preferred_yacht_types,
    c.preferred_yacht_size_min,
    c.preferred_yacht_size_max,
    c.preferred_regions,
    c.preferred_contract_types,
    c.desired_salary_min,
    c.desired_salary_max,
    c.is_smoker,
    c.has_visible_tattoos,
    c.is_couple,
    c.partner_position,
    c.verification_tier,
    c.profile_summary,
    c.embedding_text,
    s.vector_sim as vector_similarity,
    s.text_r as text_rank,
    s.rrf_score as combined_score
  FROM scored s
  JOIN candidates c ON c.id = s.candidate_id
  ORDER BY s.rrf_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SIMPLE VECTOR SEARCH (no hybrid, for quick matching)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_candidates_broad(
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.3,
  p_match_count INT DEFAULT 100,
  p_position_category TEXT DEFAULT NULL
)
RETURNS SETOF candidates AS $$
BEGIN
  -- Set HNSW search parameter
  PERFORM set_hnsw_ef_search(100);

  RETURN QUERY
  SELECT c.*
  FROM candidates c
  WHERE
    c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.availability_status IN ('available', 'looking')
    AND (p_position_category IS NULL OR c.position_category::TEXT = p_position_category)
    AND 1 - (c.embedding <=> p_query_embedding) >= p_match_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MATCH JOBS FOR CANDIDATE (reverse matching)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_jobs_for_candidate(
  p_candidate_id UUID,
  p_limit INT DEFAULT 20,
  p_match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  client_name TEXT,
  vessel_name TEXT,
  vessel_type TEXT,
  vessel_size_meters INTEGER,
  primary_region TEXT,
  contract_type contract_type,
  salary_min INTEGER,
  salary_max INTEGER,
  start_date DATE,
  status job_status,
  vector_similarity FLOAT
) AS $$
DECLARE
  v_candidate_embedding vector(1536);
BEGIN
  -- Get candidate embedding
  SELECT c.embedding INTO v_candidate_embedding
  FROM candidates c
  WHERE c.id = p_candidate_id;

  IF v_candidate_embedding IS NULL THEN
    RAISE EXCEPTION 'Candidate % has no embedding', p_candidate_id;
  END IF;

  -- Set HNSW search parameter
  PERFORM set_hnsw_ef_search(50);

  RETURN QUERY
  SELECT
    j.id as job_id,
    j.title,
    o.name as client_name,
    j.vessel_name,
    j.vessel_type,
    j.vessel_size_meters,
    j.primary_region,
    j.contract_type,
    j.salary_min,
    j.salary_max,
    j.start_date,
    j.status,
    1 - (j.embedding <=> v_candidate_embedding) as vector_similarity
  FROM jobs j
  LEFT JOIN organizations o ON j.client_id = o.id
  WHERE
    j.embedding IS NOT NULL
    AND j.deleted_at IS NULL
    AND j.status IN ('open', 'shortlisting')
    AND (j.visibility = 'public' OR j.visibility = 'network')
    AND 1 - (j.embedding <=> v_candidate_embedding) >= p_match_threshold
  ORDER BY j.embedding <=> v_candidate_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FIND SIMILAR CANDIDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION find_similar_candidates(
  p_candidate_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  primary_position TEXT,
  years_experience INTEGER,
  verification_tier verification_tier,
  vector_similarity FLOAT
) AS $$
DECLARE
  v_candidate_embedding vector(1536);
BEGIN
  -- Get candidate embedding
  SELECT c.embedding INTO v_candidate_embedding
  FROM candidates c
  WHERE c.id = p_candidate_id;

  IF v_candidate_embedding IS NULL THEN
    RAISE EXCEPTION 'Candidate % has no embedding', p_candidate_id;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.primary_position,
    c.years_experience,
    c.verification_tier,
    1 - (c.embedding <=> v_candidate_embedding) as vector_similarity
  FROM candidates c
  WHERE
    c.id != p_candidate_id
    AND c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
  ORDER BY c.embedding <=> v_candidate_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- EMBEDDING STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
  total_candidates BIGINT,
  candidates_with_embedding BIGINT,
  candidates_pending_embedding BIGINT,
  embedding_coverage_pct NUMERIC,
  total_jobs BIGINT,
  jobs_with_embedding BIGINT,
  queue_pending BIGINT,
  queue_processing BIGINT,
  queue_failed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL) as total_candidates,
    (SELECT COUNT(*) FROM candidates WHERE embedding IS NOT NULL AND deleted_at IS NULL) as candidates_with_embedding,
    (SELECT COUNT(*) FROM candidates WHERE embedding IS NULL AND deleted_at IS NULL) as candidates_pending_embedding,
    ROUND(
      100.0 * (SELECT COUNT(*) FROM candidates WHERE embedding IS NOT NULL AND deleted_at IS NULL) /
      NULLIF((SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL), 0),
      2
    ) as embedding_coverage_pct,
    (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL) as total_jobs,
    (SELECT COUNT(*) FROM jobs WHERE embedding IS NOT NULL AND deleted_at IS NULL) as jobs_with_embedding,
    (SELECT COUNT(*) FROM embedding_queue WHERE status = 'pending') as queue_pending,
    (SELECT COUNT(*) FROM embedding_queue WHERE status = 'processing') as queue_processing,
    (SELECT COUNT(*) FROM embedding_queue WHERE status = 'failed') as queue_failed;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION match_candidates_hybrid IS
  'Hybrid search combining vector similarity with full-text search using RRF. Best for production matching.';

COMMENT ON FUNCTION match_candidates_broad IS
  'Simple vector search with position filtering. Used for initial candidate retrieval.';

COMMENT ON FUNCTION match_jobs_for_candidate IS
  'Find matching jobs for a given candidate using vector similarity.';

COMMENT ON FUNCTION find_similar_candidates IS
  'Find candidates similar to a given candidate (for "more like this" feature).';

COMMENT ON FUNCTION get_embedding_stats IS
  'Get statistics about embedding coverage and queue status. Use for monitoring.';

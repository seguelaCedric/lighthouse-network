-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Improved Candidate Vector Search
-- ============================================================================
-- Enhanced vector search for candidate matching with:
-- - Fixed availability_status enum values (only 'available' and 'not_looking' exist)
-- - Better performance with position_category pre-filter
-- - Returns all fields needed for AI matching pipeline
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Drop existing functions for clean recreation
DROP FUNCTION IF EXISTS match_candidates_for_job_v2(UUID, INT, FLOAT, TEXT);
DROP FUNCTION IF EXISTS search_candidates_vector(vector, INT, FLOAT, TEXT);

-- ============================================================================
-- SEARCH CANDIDATES BY VECTOR (Primary Semantic Search)
-- ============================================================================
-- Stage 1 of the matching pipeline: Semantic retrieval
-- Returns top N candidates by embedding similarity, optionally filtered by position
-- ============================================================================

CREATE OR REPLACE FUNCTION search_candidates_vector(
  p_query_embedding vector(1536),
  p_limit INT DEFAULT 200,
  p_threshold FLOAT DEFAULT 0.25,  -- Lower threshold = broader search
  p_position_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  primary_position TEXT,
  position_category position_category,
  secondary_positions TEXT[],
  years_experience INTEGER,
  nationality TEXT,
  second_nationality TEXT,
  verification_tier verification_tier,
  availability_status availability_status,
  available_from DATE,
  -- Certifications
  has_stcw BOOLEAN,
  stcw_expiry DATE,
  has_eng1 BOOLEAN,
  eng1_expiry DATE,
  highest_license TEXT,
  certifications JSONB,
  -- Visas
  has_schengen BOOLEAN,
  has_b1b2 BOOLEAN,
  has_c1d BOOLEAN,
  other_visas TEXT[],
  -- Personal
  is_smoker BOOLEAN,
  has_visible_tattoos BOOLEAN,
  is_couple BOOLEAN,
  partner_position TEXT,
  -- Preferences
  preferred_yacht_types TEXT[],
  preferred_yacht_size_min INTEGER,
  preferred_yacht_size_max INTEGER,
  preferred_contract_types contract_type[],
  preferred_regions TEXT[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  -- AI/Content
  profile_summary TEXT,
  bio TEXT,
  -- Work history for AI evaluation
  work_history JSONB,
  references_count INTEGER,
  average_reference_rating NUMERIC,
  -- Similarity score
  similarity FLOAT
) AS $$
BEGIN
  -- Use HNSW for better performance on large datasets
  PERFORM set_config('hnsw.ef_search', '100', true);

  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.primary_position,
    c.position_category,
    c.secondary_positions,
    c.years_experience,
    c.nationality,
    c.second_nationality,
    c.verification_tier,
    c.availability_status,
    c.available_from,
    c.has_stcw,
    c.stcw_expiry,
    c.has_eng1,
    c.eng1_expiry,
    c.highest_license,
    c.certifications,
    c.has_schengen,
    c.has_b1b2,
    c.has_c1d,
    c.other_visas,
    c.is_smoker,
    c.has_visible_tattoos,
    c.is_couple,
    c.partner_position,
    c.preferred_yacht_types,
    c.preferred_yacht_size_min,
    c.preferred_yacht_size_max,
    c.preferred_contract_types,
    c.preferred_regions,
    c.desired_salary_min,
    c.desired_salary_max,
    c.profile_summary,
    c.bio,
    c.work_history,
    (SELECT COUNT(*)::INTEGER FROM candidate_references cr WHERE cr.candidate_id = c.id),
    (SELECT AVG(cr.rating) FROM candidate_references cr WHERE cr.candidate_id = c.id),
    1 - (c.embedding <=> p_query_embedding) as similarity
  FROM candidates c
  WHERE
    c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    -- Only search candidates who are available (not 'not_looking')
    AND c.availability_status = 'available'
    -- Optional position category filter
    AND (p_position_category IS NULL OR c.position_category::TEXT = p_position_category)
    -- Similarity threshold
    AND 1 - (c.embedding <=> p_query_embedding) >= p_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MATCH CANDIDATES FOR JOB V2 (Full Pipeline Support)
-- ============================================================================
-- Uses job's embedding if available, otherwise generates one from job details
-- Returns comprehensive candidate data for AI matching pipeline
-- ============================================================================

CREATE OR REPLACE FUNCTION match_candidates_for_job_v2(
  p_job_id UUID,
  p_limit INT DEFAULT 200,
  p_threshold FLOAT DEFAULT 0.25,
  p_position_category TEXT DEFAULT NULL  -- Override job's position_category
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  primary_position TEXT,
  position_category position_category,
  secondary_positions TEXT[],
  years_experience INTEGER,
  nationality TEXT,
  second_nationality TEXT,
  verification_tier verification_tier,
  availability_status availability_status,
  available_from DATE,
  has_stcw BOOLEAN,
  stcw_expiry DATE,
  has_eng1 BOOLEAN,
  eng1_expiry DATE,
  highest_license TEXT,
  certifications JSONB,
  has_schengen BOOLEAN,
  has_b1b2 BOOLEAN,
  has_c1d BOOLEAN,
  other_visas TEXT[],
  is_smoker BOOLEAN,
  has_visible_tattoos BOOLEAN,
  is_couple BOOLEAN,
  partner_position TEXT,
  preferred_yacht_types TEXT[],
  preferred_yacht_size_min INTEGER,
  preferred_yacht_size_max INTEGER,
  preferred_contract_types contract_type[],
  preferred_regions TEXT[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  profile_summary TEXT,
  bio TEXT,
  work_history JSONB,
  references_count INTEGER,
  average_reference_rating NUMERIC,
  similarity FLOAT
) AS $$
DECLARE
  v_job_embedding vector(1536);
  v_job_position_category TEXT;
BEGIN
  -- Get job embedding and position category
  SELECT j.embedding, j.position_category::TEXT
  INTO v_job_embedding, v_job_position_category
  FROM jobs j
  WHERE j.id = p_job_id AND j.deleted_at IS NULL;

  IF v_job_embedding IS NULL THEN
    RAISE EXCEPTION 'Job % has no embedding. Generate embedding first.', p_job_id;
  END IF;

  -- Use override position category if provided, otherwise job's category
  IF p_position_category IS NOT NULL THEN
    v_job_position_category := p_position_category;
  END IF;

  -- Delegate to vector search function
  RETURN QUERY
  SELECT * FROM search_candidates_vector(
    v_job_embedding,
    p_limit,
    p_threshold,
    v_job_position_category
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Fix legacy function that used wrong enum values
-- ============================================================================

CREATE OR REPLACE FUNCTION match_candidates_to_job(
  p_job_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  candidate_id UUID,
  first_name TEXT,
  last_name TEXT,
  primary_position TEXT,
  verification_tier verification_tier,
  availability_status availability_status,
  similarity FLOAT
) AS $$
DECLARE
  job_embedding vector(1536);
BEGIN
  -- Get job embedding
  SELECT j.embedding INTO job_embedding
  FROM jobs j
  WHERE j.id = p_job_id;

  IF job_embedding IS NULL THEN
    RAISE EXCEPTION 'Job % has no embedding', p_job_id;
  END IF;

  RETURN QUERY
  SELECT
    c.id as candidate_id,
    c.first_name,
    c.last_name,
    c.primary_position,
    c.verification_tier,
    c.availability_status,
    1 - (c.embedding <=> job_embedding) as similarity
  FROM candidates c
  WHERE
    c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    -- Fixed: Only 'available' exists, not 'looking'
    AND c.availability_status = 'available'
    AND 1 - (c.embedding <=> job_embedding) >= match_threshold
  ORDER BY c.embedding <=> job_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix match_candidates_by_embedding to use correct enum values
-- ============================================================================

CREATE OR REPLACE FUNCTION match_candidates_by_embedding(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 50,
  p_verification_tiers TEXT[] DEFAULT ARRAY['verified', 'premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available'],  -- Fixed: removed 'looking'
  p_exclude_ids UUID[] DEFAULT ARRAY[]::UUID[]
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
  verification_tier verification_tier,
  availability_status availability_status,
  available_from DATE,
  has_stcw BOOLEAN,
  stcw_expiry DATE,
  has_eng1 BOOLEAN,
  eng1_expiry DATE,
  highest_license TEXT,
  has_schengen BOOLEAN,
  has_b1b2 BOOLEAN,
  has_c1d BOOLEAN,
  is_smoker BOOLEAN,
  has_visible_tattoos BOOLEAN,
  is_couple BOOLEAN,
  partner_position TEXT,
  preferred_yacht_types TEXT[],
  preferred_yacht_size_min INTEGER,
  preferred_yacht_size_max INTEGER,
  preferred_contract_types contract_type[],
  preferred_regions TEXT[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  profile_summary TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
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
    c.verification_tier,
    c.availability_status,
    c.available_from,
    c.has_stcw,
    c.stcw_expiry,
    c.has_eng1,
    c.eng1_expiry,
    c.highest_license,
    c.has_schengen,
    c.has_b1b2,
    c.has_c1d,
    c.is_smoker,
    c.has_visible_tattoos,
    c.is_couple,
    c.partner_position,
    c.preferred_yacht_types,
    c.preferred_yacht_size_min,
    c.preferred_yacht_size_max,
    c.preferred_contract_types,
    c.preferred_regions,
    c.desired_salary_min,
    c.desired_salary_max,
    c.profile_summary,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM candidates c
  WHERE
    c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.verification_tier::TEXT = ANY(p_verification_tiers)
    AND c.availability_status::TEXT = ANY(p_availability_statuses)
    AND (ARRAY_LENGTH(p_exclude_ids, 1) IS NULL OR c.id != ALL(p_exclude_ids))
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_candidates_vector IS
  'Primary vector search for candidates. Returns top N semantically similar candidates '
  'with comprehensive profile data for AI matching pipeline.';

COMMENT ON FUNCTION match_candidates_for_job_v2 IS
  'Match candidates to a job using semantic search. Uses job embedding to find similar '
  'candidates. Returns all data needed for hard filters, scoring, and AI reranking.';

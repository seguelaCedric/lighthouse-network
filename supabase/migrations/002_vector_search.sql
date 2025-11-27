-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Vector Search Functions
-- ============================================================================
-- Functions for semantic candidate matching using pgvector
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Drop existing functions to allow parameter name changes
DROP FUNCTION IF EXISTS match_candidates_to_job(UUID, FLOAT, INT);
DROP FUNCTION IF EXISTS match_candidates_by_embedding(vector, FLOAT, INT, TEXT[], TEXT[], UUID[]);
DROP FUNCTION IF EXISTS find_similar_candidates(UUID, INT);
DROP FUNCTION IF EXISTS find_jobs_for_candidate(UUID, FLOAT, INT);
DROP FUNCTION IF EXISTS search_candidates_semantic(TEXT, INT);

-- Function: Match candidates by embedding with filters
CREATE OR REPLACE FUNCTION match_candidates_by_embedding(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 50,
  p_verification_tiers TEXT[] DEFAULT ARRAY['verified', 'premium'],
  p_availability_statuses TEXT[] DEFAULT ARRAY['available', 'looking'],
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

-- Function: Match candidates to a specific job (using job's embedding)
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
    AND c.availability_status IN ('available', 'looking')
    AND 1 - (c.embedding <=> job_embedding) >= match_threshold
  ORDER BY c.embedding <=> job_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Find similar candidates (for "more like this")
CREATE OR REPLACE FUNCTION find_similar_candidates(
  p_candidate_id UUID,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  primary_position TEXT,
  verification_tier verification_tier,
  similarity FLOAT
) AS $$
DECLARE
  candidate_embedding vector(1536);
BEGIN
  -- Get candidate embedding
  SELECT c.embedding INTO candidate_embedding
  FROM candidates c
  WHERE c.id = p_candidate_id;

  IF candidate_embedding IS NULL THEN
    RAISE EXCEPTION 'Candidate % has no embedding', p_candidate_id;
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.primary_position,
    c.verification_tier,
    1 - (c.embedding <=> candidate_embedding) as similarity
  FROM candidates c
  WHERE 
    c.id != p_candidate_id
    AND c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
  ORDER BY c.embedding <=> candidate_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Find matching jobs for a candidate
CREATE OR REPLACE FUNCTION find_jobs_for_candidate(
  p_candidate_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  client_name TEXT,
  vessel_name TEXT,
  vessel_size_meters INTEGER,
  primary_region TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  status job_status,
  similarity FLOAT
) AS $$
DECLARE
  candidate_embedding vector(1536);
BEGIN
  -- Get candidate embedding
  SELECT c.embedding INTO candidate_embedding
  FROM candidates c
  WHERE c.id = p_candidate_id;

  IF candidate_embedding IS NULL THEN
    RAISE EXCEPTION 'Candidate % has no embedding', p_candidate_id;
  END IF;

  RETURN QUERY
  SELECT 
    j.id as job_id,
    j.title,
    o.name as client_name,
    j.vessel_name,
    j.vessel_size_meters,
    j.primary_region,
    j.salary_min,
    j.salary_max,
    j.status,
    1 - (j.embedding <=> candidate_embedding) as similarity
  FROM jobs j
  LEFT JOIN organizations o ON j.client_id = o.id
  WHERE 
    j.embedding IS NOT NULL
    AND j.deleted_at IS NULL
    AND j.status IN ('open', 'shortlisting')
    AND (j.visibility = 'public' OR j.visibility = 'network')
    AND 1 - (j.embedding <=> candidate_embedding) >= match_threshold
  ORDER BY j.embedding <=> candidate_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Semantic search across candidates by text query
CREATE OR REPLACE FUNCTION search_candidates_semantic(
  query_text TEXT,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  primary_position TEXT,
  verification_tier verification_tier,
  availability_status availability_status,
  relevance FLOAT
) AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Note: This requires the embedding to be generated by the calling code
  -- and passed in. For a text query, we'd need to call OpenAI first.
  -- This is a placeholder showing the pattern.
  
  -- In practice, call this from application code after generating embedding:
  -- const embedding = await generateEmbedding(queryText);
  -- const results = await supabase.rpc('match_candidates_by_embedding', { query_embedding: embedding });
  
  RAISE EXCEPTION 'Use match_candidates_by_embedding with pre-generated embedding';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES for vector search performance
-- ============================================================================

-- Ensure we have the right index type for vector search
-- Using IVFFlat for approximate nearest neighbor search
-- Lists parameter: sqrt(n) where n is expected number of rows
-- For 10K candidates: 100 lists. For 100K: 316 lists.

-- Drop existing if different config needed (allows re-running migration)
DROP INDEX IF EXISTS idx_candidates_embedding;
DROP INDEX IF EXISTS idx_jobs_embedding;

-- Create optimized indexes (recreated fresh after drop)
CREATE INDEX idx_candidates_embedding ON candidates
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_jobs_embedding ON jobs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION match_candidates_by_embedding IS 
  'Primary vector search function. Returns candidates similar to query embedding with filtering.';

COMMENT ON FUNCTION match_candidates_to_job IS 
  'Match candidates to a specific job using the job''s stored embedding.';

COMMENT ON FUNCTION find_similar_candidates IS 
  'Find candidates similar to a given candidate (for "more like this" feature).';

COMMENT ON FUNCTION find_jobs_for_candidate IS 
  'Find jobs that match a candidate''s profile (for candidate job feed).';

-- ============================================================================
-- HNSW VECTOR INDEXES FOR 200K SCALE
-- Migration: 015_hnsw_vector_indexes.sql
-- Description: Optimized HNSW indexes for fast vector search at scale
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================
-- HNSW parameters optimized for:
-- - 200,000 candidates
-- - text-embedding-3-small (1536 dimensions)
-- - 95%+ recall at 50ms p99 latency target
-- ============================================================================

-- Drop existing IVFFlat indexes (we're upgrading to HNSW)
DROP INDEX IF EXISTS idx_candidates_embedding;
DROP INDEX IF EXISTS idx_jobs_embedding;

-- ============================================================================
-- HNSW INDEX FOR CANDIDATES
-- ============================================================================
-- Parameters:
-- m = 32: Number of bi-directional links per node
--         Higher = better recall but more memory/slower build
--         32 is good for 200K vectors
--
-- ef_construction = 200: Size of dynamic candidate list during construction
--                        Higher = better recall but slower build
--                        200 gives ~98% recall
--
-- Using cosine similarity (vector_cosine_ops) because:
-- - OpenAI embeddings are normalized
-- - Cosine similarity is standard for semantic search
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_candidates_embedding_hnsw
  ON candidates
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 200);

-- ============================================================================
-- HNSW INDEX FOR JOBS
-- ============================================================================
-- Lower parameters since job count is much smaller (~1K-10K)

CREATE INDEX IF NOT EXISTS idx_jobs_embedding_hnsw
  ON jobs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 100);

-- ============================================================================
-- HNSW INDEX FOR DOCUMENTS (for document-level search if needed)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw
  ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 24, ef_construction = 150);

-- ============================================================================
-- SET HNSW SEARCH PARAMETERS
-- ============================================================================
-- ef_search controls the size of the dynamic candidate list during search
-- Higher = better recall but slower queries
-- 100 is a good balance for 200K vectors

-- Set default ef_search for the session (this affects all HNSW queries)
-- Note: This needs to be set per-connection or in application code
-- We create a function to make it easy

CREATE OR REPLACE FUNCTION set_hnsw_ef_search(ef INT DEFAULT 100)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('SET hnsw.ef_search = %s', ef);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Index for available candidates only (most common query)
CREATE INDEX IF NOT EXISTS idx_candidates_embedding_available
  ON candidates
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 200)
  WHERE availability_status IN ('available', 'looking')
    AND embedding IS NOT NULL
    AND deleted_at IS NULL;

-- Index for verified+ candidates (premium matching)
CREATE INDEX IF NOT EXISTS idx_candidates_embedding_verified
  ON candidates
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 24, ef_construction = 150)
  WHERE verification_tier IN ('verified', 'premium')
    AND embedding IS NOT NULL
    AND deleted_at IS NULL;

-- Index for open jobs only
CREATE INDEX IF NOT EXISTS idx_jobs_embedding_open
  ON jobs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 100)
  WHERE status IN ('open', 'shortlisting')
    AND embedding IS NOT NULL
    AND deleted_at IS NULL;

-- ============================================================================
-- SUPPORT INDEXES FOR FILTERING
-- ============================================================================

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_candidates_filter_combo
  ON candidates (position_category, availability_status, verification_tier)
  WHERE deleted_at IS NULL;

-- Index for certification filtering
CREATE INDEX IF NOT EXISTS idx_candidates_certs
  ON candidates (has_stcw, has_eng1, highest_license)
  WHERE deleted_at IS NULL;

-- Index for visa filtering
CREATE INDEX IF NOT EXISTS idx_candidates_visas
  ON candidates (has_schengen, has_b1b2, has_c1d)
  WHERE deleted_at IS NULL;

-- Index for embedding queue processing
CREATE INDEX IF NOT EXISTS idx_candidates_needs_embedding
  ON candidates (updated_at)
  WHERE embedding IS NULL
    AND deleted_at IS NULL;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Force statistics refresh for query planner

ANALYZE candidates;
ANALYZE jobs;
ANALYZE documents;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_candidates_embedding_hnsw IS
  'Primary HNSW index for candidate vector search. m=32, ef_construction=200 optimized for 200K scale.';

COMMENT ON INDEX idx_candidates_embedding_available IS
  'Partial HNSW index for available candidates only - faster for most queries.';

COMMENT ON INDEX idx_candidates_embedding_verified IS
  'Partial HNSW index for verified/premium candidates - for premium matching feature.';

COMMENT ON FUNCTION set_hnsw_ef_search IS
  'Set HNSW ef_search parameter for the current session. Higher = better recall, slower queries. Default 100.';

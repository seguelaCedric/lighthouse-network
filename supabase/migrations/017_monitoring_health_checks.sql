-- ============================================================================
-- MONITORING & HEALTH CHECKS
-- Migration: 017_monitoring_health_checks.sql
-- Description: Functions for monitoring embedding coverage, queue health,
--              and matching system performance
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- EMBEDDING HEALTH CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION check_embedding_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB
) AS $$
DECLARE
  v_total_candidates BIGINT;
  v_candidates_with_embedding BIGINT;
  v_candidates_stale BIGINT;
  v_queue_pending BIGINT;
  v_queue_stuck BIGINT;
  v_queue_failed BIGINT;
BEGIN
  -- Get candidate counts
  SELECT COUNT(*) INTO v_total_candidates
  FROM candidates WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_candidates_with_embedding
  FROM candidates WHERE embedding IS NOT NULL AND deleted_at IS NULL;

  -- Stale embeddings (not updated in 30 days but candidate was updated)
  SELECT COUNT(*) INTO v_candidates_stale
  FROM candidates
  WHERE embedding IS NOT NULL
    AND deleted_at IS NULL
    AND updated_at > embedding_updated_at + INTERVAL '30 days';

  -- Queue health
  SELECT COUNT(*) INTO v_queue_pending
  FROM embedding_queue WHERE status = 'pending';

  -- Stuck items (processing for more than 10 minutes)
  SELECT COUNT(*) INTO v_queue_stuck
  FROM embedding_queue
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '10 minutes';

  SELECT COUNT(*) INTO v_queue_failed
  FROM embedding_queue WHERE status = 'failed';

  -- Return health checks
  RETURN QUERY

  -- Check 1: Embedding coverage
  SELECT
    'embedding_coverage'::TEXT,
    CASE
      WHEN v_total_candidates = 0 THEN 'warning'
      WHEN (v_candidates_with_embedding::FLOAT / v_total_candidates) >= 0.95 THEN 'healthy'
      WHEN (v_candidates_with_embedding::FLOAT / v_total_candidates) >= 0.80 THEN 'warning'
      ELSE 'critical'
    END,
    jsonb_build_object(
      'total_candidates', v_total_candidates,
      'with_embedding', v_candidates_with_embedding,
      'coverage_pct', ROUND(100.0 * v_candidates_with_embedding / NULLIF(v_total_candidates, 0), 2),
      'missing', v_total_candidates - v_candidates_with_embedding
    );

  -- Check 2: Stale embeddings
  RETURN QUERY
  SELECT
    'stale_embeddings'::TEXT,
    CASE
      WHEN v_candidates_stale = 0 THEN 'healthy'
      WHEN v_candidates_stale <= 100 THEN 'warning'
      ELSE 'critical'
    END,
    jsonb_build_object(
      'stale_count', v_candidates_stale,
      'threshold_days', 30
    );

  -- Check 3: Queue backlog
  RETURN QUERY
  SELECT
    'queue_backlog'::TEXT,
    CASE
      WHEN v_queue_pending <= 100 THEN 'healthy'
      WHEN v_queue_pending <= 1000 THEN 'warning'
      ELSE 'critical'
    END,
    jsonb_build_object(
      'pending', v_queue_pending,
      'stuck', v_queue_stuck,
      'failed', v_queue_failed
    );

  -- Check 4: Stuck processing
  RETURN QUERY
  SELECT
    'queue_stuck'::TEXT,
    CASE
      WHEN v_queue_stuck = 0 THEN 'healthy'
      ELSE 'critical'
    END,
    jsonb_build_object(
      'stuck_count', v_queue_stuck,
      'threshold_minutes', 10
    );

END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VECTOR INDEX HEALTH
-- ============================================================================

CREATE OR REPLACE FUNCTION check_vector_index_health()
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  row_count BIGINT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.indexrelid::regclass::TEXT as index_name,
    i.indrelid::regclass::TEXT as table_name,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    c.reltuples::BIGINT as row_count,
    i.indisvalid as is_valid
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indrelid
  WHERE i.indexrelid::regclass::TEXT LIKE '%embedding%'
    OR i.indexrelid::regclass::TEXT LIKE '%hnsw%'
  ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MATCHING PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS matching_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  user_id UUID REFERENCES users(id),

  -- Timing
  total_duration_ms INTEGER NOT NULL,
  vector_search_ms INTEGER,
  filtering_ms INTEGER,
  reranking_ms INTEGER,
  ai_assessment_ms INTEGER,

  -- Counts
  candidates_searched INTEGER,
  candidates_after_filter INTEGER,
  candidates_reranked INTEGER,
  candidates_returned INTEGER,

  -- Settings
  used_cohere BOOLEAN DEFAULT FALSE,
  used_hybrid_search BOOLEAN DEFAULT FALSE,
  filter_settings JSONB,

  -- Results quality (filled in later if available)
  top_candidate_score FLOAT,
  avg_returned_score FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matching_metrics_job ON matching_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_matching_metrics_created ON matching_metrics(created_at DESC);

-- Function to log matching metrics
CREATE OR REPLACE FUNCTION log_matching_metrics(
  p_job_id UUID,
  p_user_id UUID,
  p_total_duration_ms INTEGER,
  p_vector_search_ms INTEGER DEFAULT NULL,
  p_filtering_ms INTEGER DEFAULT NULL,
  p_reranking_ms INTEGER DEFAULT NULL,
  p_ai_assessment_ms INTEGER DEFAULT NULL,
  p_candidates_searched INTEGER DEFAULT NULL,
  p_candidates_after_filter INTEGER DEFAULT NULL,
  p_candidates_reranked INTEGER DEFAULT NULL,
  p_candidates_returned INTEGER DEFAULT NULL,
  p_used_cohere BOOLEAN DEFAULT FALSE,
  p_used_hybrid_search BOOLEAN DEFAULT FALSE,
  p_filter_settings JSONB DEFAULT NULL,
  p_top_candidate_score FLOAT DEFAULT NULL,
  p_avg_returned_score FLOAT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO matching_metrics (
    job_id, user_id, total_duration_ms,
    vector_search_ms, filtering_ms, reranking_ms, ai_assessment_ms,
    candidates_searched, candidates_after_filter, candidates_reranked, candidates_returned,
    used_cohere, used_hybrid_search, filter_settings,
    top_candidate_score, avg_returned_score
  ) VALUES (
    p_job_id, p_user_id, p_total_duration_ms,
    p_vector_search_ms, p_filtering_ms, p_reranking_ms, p_ai_assessment_ms,
    p_candidates_searched, p_candidates_after_filter, p_candidates_reranked, p_candidates_returned,
    p_used_cohere, p_used_hybrid_search, p_filter_settings,
    p_top_candidate_score, p_avg_returned_score
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get matching performance stats
CREATE OR REPLACE FUNCTION get_matching_performance_stats(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  metric_name TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY

  -- Total matches
  SELECT 'total_matches'::TEXT, COUNT(*)::NUMERIC
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL

  UNION ALL

  -- Average duration
  SELECT 'avg_duration_ms'::TEXT, ROUND(AVG(total_duration_ms)::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL

  UNION ALL

  -- P95 duration
  SELECT 'p95_duration_ms'::TEXT, ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_duration_ms)::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL

  UNION ALL

  -- Average candidates searched
  SELECT 'avg_candidates_searched'::TEXT, ROUND(AVG(candidates_searched)::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    AND candidates_searched IS NOT NULL

  UNION ALL

  -- Filter pass rate
  SELECT 'avg_filter_pass_rate'::TEXT,
    ROUND(100.0 * AVG(candidates_after_filter::FLOAT / NULLIF(candidates_searched, 0))::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    AND candidates_searched IS NOT NULL
    AND candidates_after_filter IS NOT NULL

  UNION ALL

  -- Cohere usage rate
  SELECT 'cohere_usage_rate_pct'::TEXT,
    ROUND(100.0 * COUNT(*) FILTER (WHERE used_cohere) / NULLIF(COUNT(*), 0)::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL

  UNION ALL

  -- Average top score
  SELECT 'avg_top_candidate_score'::TEXT, ROUND(AVG(top_candidate_score)::NUMERIC, 2)
  FROM matching_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    AND top_candidate_score IS NOT NULL;

END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CLEANUP OLD QUEUE ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_embedding_queue(
  p_days_to_keep INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM embedding_queue
  WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Also reset stuck items
  UPDATE embedding_queue
  SET status = 'pending', updated_at = NOW()
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '30 minutes';

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DASHBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW embedding_dashboard AS
SELECT
  -- Candidates
  (SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL) as total_candidates,
  (SELECT COUNT(*) FROM candidates WHERE embedding IS NOT NULL AND deleted_at IS NULL) as candidates_with_embedding,
  (SELECT COUNT(*) FROM candidates WHERE embedding IS NULL AND deleted_at IS NULL) as candidates_pending,

  -- Jobs
  (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL) as total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE embedding IS NOT NULL AND deleted_at IS NULL) as jobs_with_embedding,

  -- Queue
  (SELECT COUNT(*) FROM embedding_queue WHERE status = 'pending') as queue_pending,
  (SELECT COUNT(*) FROM embedding_queue WHERE status = 'processing') as queue_processing,
  (SELECT COUNT(*) FROM embedding_queue WHERE status = 'failed') as queue_failed,
  (SELECT COUNT(*) FROM embedding_queue WHERE status = 'completed' AND updated_at > NOW() - INTERVAL '24 hours') as completed_today,

  -- Performance (last 24h)
  (SELECT ROUND(AVG(total_duration_ms)) FROM matching_metrics WHERE created_at > NOW() - INTERVAL '24 hours') as avg_match_duration_ms,
  (SELECT COUNT(*) FROM matching_metrics WHERE created_at > NOW() - INTERVAL '24 hours') as matches_today;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_embedding_health IS
  'Returns health status of embedding system: coverage, staleness, queue health.';

COMMENT ON FUNCTION check_vector_index_health IS
  'Returns information about vector indexes: size, validity, row counts.';

COMMENT ON TABLE matching_metrics IS
  'Logs performance metrics for each matching operation for monitoring and optimization.';

COMMENT ON FUNCTION log_matching_metrics IS
  'Insert a matching performance record. Called after each match operation.';

COMMENT ON FUNCTION get_matching_performance_stats IS
  'Aggregate matching performance statistics over a time period.';

COMMENT ON FUNCTION cleanup_embedding_queue IS
  'Remove old completed/failed queue items and reset stuck processing items.';

COMMENT ON VIEW embedding_dashboard IS
  'Overview of embedding system health for monitoring dashboards.';

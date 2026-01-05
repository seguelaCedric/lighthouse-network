-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Enhanced Candidate Job Matching
-- ============================================================================
-- Adds improved RPC function for AI-powered job matching:
-- - Supports both yacht AND household/land-based positions
-- - Returns comprehensive job data for scoring
-- - Filters by industry type (yacht vs household)
-- - Includes all relevant fields for matching algorithm
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Drop existing function for clean recreation
DROP FUNCTION IF EXISTS match_jobs_for_candidate_v2(UUID, INT, FLOAT, TEXT);
DROP FUNCTION IF EXISTS match_jobs_for_candidate_v2(UUID, INT, FLOAT, TEXT, BOOLEAN);

-- ============================================================================
-- MATCH JOBS FOR CANDIDATE V2 (Enhanced AI Matching)
-- ============================================================================
-- Returns jobs matched to a candidate with all data needed for AI scoring.
-- Supports industry filtering for yacht vs household/land-based positions.
-- ============================================================================

CREATE OR REPLACE FUNCTION match_jobs_for_candidate_v2(
  p_candidate_id UUID,
  p_limit INT DEFAULT 50,
  p_match_threshold FLOAT DEFAULT 0.25,
  p_industry TEXT DEFAULT 'both',  -- 'yacht', 'household', 'both'
  p_include_no_embedding BOOLEAN DEFAULT true  -- Include jobs without embeddings
)
RETURNS TABLE (
  -- Job identification
  job_id UUID,
  job_source TEXT,  -- 'jobs' or 'public_jobs'

  -- Basic job info
  title TEXT,
  description TEXT,
  position_category TEXT,

  -- Vessel info (yacht jobs)
  vessel_type TEXT,
  vessel_size_meters INTEGER,

  -- Location/Region
  primary_region TEXT,

  -- Contract details
  contract_type TEXT,
  rotation_schedule TEXT,
  start_date DATE,
  end_date DATE,

  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  salary_period TEXT,
  holiday_days INTEGER,
  benefits TEXT[],

  -- Requirements
  requirements TEXT[],
  requirements_text TEXT,

  -- Job status
  status TEXT,
  is_urgent BOOLEAN,
  apply_deadline DATE,

  -- Agency info
  agency_id UUID,
  agency_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Vector similarity (null if no embedding)
  vector_similarity FLOAT
) AS $$
DECLARE
  v_candidate_embedding vector(1536);
  v_yacht_positions TEXT[] := ARRAY[
    'captain', 'officer', 'mate', 'bosun', 'deckhand', 'deck',
    'engineer', 'eto', 'electrician',
    'steward', 'stew', 'chief_stew', 'interior', 'purser',
    'chef', 'cook', 'galley',
    'first_officer', 'second_officer', 'third_officer',
    'first_engineer', 'second_engineer', 'third_engineer',
    'sole_stew', 'second_stew', 'third_stew',
    'head_chef', 'sous_chef', 'sole_chef'
  ];
  v_household_positions TEXT[] := ARRAY[
    'butler', 'housekeeper', 'house_manager', 'estate_manager',
    'nanny', 'governess', 'tutor',
    'chef', 'private_chef', 'cook',
    'chauffeur', 'driver',
    'personal_assistant', 'pa',
    'security', 'bodyguard', 'close_protection',
    'gardener', 'groundskeeper',
    'laundress', 'houseman'
  ];
BEGIN
  -- Get candidate embedding
  SELECT c.embedding INTO v_candidate_embedding
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Set HNSW search parameter if using embeddings
  IF v_candidate_embedding IS NOT NULL THEN
    PERFORM set_hnsw_ef_search(100);
  END IF;

  RETURN QUERY
  WITH
  -- Get matching jobs from jobs table (internal jobs)
  internal_jobs AS (
    SELECT
      j.id,
      'jobs'::TEXT as source,
      COALESCE(j.public_title, j.title) as job_title,
      COALESCE(j.public_description, j.requirements_text) as job_description,
      j.position_category::TEXT,
      j.vessel_type,
      j.vessel_size_meters,
      j.primary_region,
      j.contract_type::TEXT,
      j.rotation_schedule,
      j.start_date,
      j.end_date,
      j.salary_min,
      j.salary_max,
      j.salary_currency,
      j.salary_period,
      j.holiday_days,
      j.benefits,
      j.requirements,
      j.requirements_text,
      j.status::TEXT,
      j.is_urgent,
      j.apply_deadline,
      j.created_by_agency_id,
      o.name as org_name,
      j.created_at,
      j.published_at,
      j.embedding,
      -- Calculate similarity if both embeddings exist
      CASE
        WHEN v_candidate_embedding IS NOT NULL AND j.embedding IS NOT NULL
        THEN 1 - (j.embedding <=> v_candidate_embedding)
        ELSE NULL
      END as similarity
    FROM jobs j
    LEFT JOIN organizations o ON j.created_by_agency_id = o.id
    WHERE
      j.deleted_at IS NULL
      AND j.status IN ('open', 'shortlisting', 'active')
      AND (j.visibility = 'public' OR j.visibility = 'network' OR j.is_public = true)
      -- Industry filter
      AND (
        p_industry = 'both'
        OR (
          p_industry = 'yacht'
          AND (
            j.vessel_type IS NOT NULL
            OR j.vessel_size_meters IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM unnest(v_yacht_positions) pos
              WHERE LOWER(COALESCE(j.position_category::TEXT, j.title)) LIKE '%' || pos || '%'
            )
          )
        )
        OR (
          p_industry = 'household'
          AND j.vessel_type IS NULL
          AND j.vessel_size_meters IS NULL
          AND EXISTS (
            SELECT 1 FROM unnest(v_household_positions) pos
            WHERE LOWER(COALESCE(j.position_category::TEXT, j.title)) LIKE '%' || pos || '%'
          )
        )
      )
      -- Embedding threshold filter (if applicable)
      AND (
        p_include_no_embedding
        OR (
          v_candidate_embedding IS NOT NULL
          AND j.embedding IS NOT NULL
          AND 1 - (j.embedding <=> v_candidate_embedding) >= p_match_threshold
        )
      )
    ORDER BY
      CASE
        WHEN v_candidate_embedding IS NOT NULL AND j.embedding IS NOT NULL
        THEN j.embedding <=> v_candidate_embedding
        ELSE 0
      END
    LIMIT p_limit
  ),

  -- Combine results (internal jobs are primary source)
  combined AS (
    SELECT * FROM internal_jobs
  )

  SELECT
    c.id as job_id,
    c.source as job_source,
    c.job_title as title,
    c.job_description as description,
    c.position_category,
    c.vessel_type,
    c.vessel_size_meters,
    c.primary_region,
    c.contract_type,
    c.rotation_schedule,
    c.start_date,
    c.end_date,
    c.salary_min,
    c.salary_max,
    c.salary_currency,
    c.salary_period,
    c.holiday_days,
    c.benefits,
    c.requirements,
    c.requirements_text,
    c.status,
    c.is_urgent,
    c.apply_deadline,
    c.created_by_agency_id as agency_id,
    c.org_name as agency_name,
    c.created_at,
    c.published_at,
    c.similarity as vector_similarity
  FROM combined c
  ORDER BY
    -- Jobs with vector similarity first, ordered by similarity
    CASE WHEN c.similarity IS NOT NULL THEN 0 ELSE 1 END,
    c.similarity DESC NULLS LAST,
    -- Then by urgency
    c.is_urgent DESC,
    -- Then by recency
    c.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CHECK CANDIDATE APPLICATIONS
-- ============================================================================
-- Helper function to check which jobs a candidate has already applied to

CREATE OR REPLACE FUNCTION get_candidate_applications(
  p_candidate_id UUID
)
RETURNS TABLE (
  job_id UUID,
  application_id UUID,
  stage TEXT,
  applied_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.job_id,
    a.id as application_id,
    a.stage::TEXT,
    a.applied_at
  FROM applications a
  WHERE a.candidate_id = p_candidate_id
    AND a.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GET CANDIDATE PROFILE COMPLETENESS
-- ============================================================================
-- Returns profile completeness status for quick-apply validation

CREATE OR REPLACE FUNCTION get_candidate_profile_completeness(
  p_candidate_id UUID
)
RETURNS TABLE (
  completeness_pct INTEGER,
  can_quick_apply BOOLEAN,
  missing_fields TEXT[]
) AS $$
DECLARE
  v_candidate RECORD;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_total_fields INTEGER := 10;
  v_filled_fields INTEGER := 0;
BEGIN
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, false, ARRAY['profile']::TEXT[];
    RETURN;
  END IF;

  -- Check required fields
  IF v_candidate.first_name IS NOT NULL AND v_candidate.first_name != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'first_name');
  END IF;

  IF v_candidate.last_name IS NOT NULL AND v_candidate.last_name != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'last_name');
  END IF;

  IF v_candidate.email IS NOT NULL AND v_candidate.email != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'email');
  END IF;

  IF v_candidate.phone IS NOT NULL AND v_candidate.phone != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'phone');
  END IF;

  IF v_candidate.nationality IS NOT NULL AND v_candidate.nationality != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'nationality');
  END IF;

  -- Position check (yacht or household)
  IF COALESCE(v_candidate.primary_position, v_candidate.yacht_primary_position, v_candidate.household_primary_position) IS NOT NULL THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'primary_position');
  END IF;

  IF v_candidate.years_experience IS NOT NULL THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'years_experience');
  END IF;

  IF v_candidate.availability_status IS NOT NULL THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'availability_status');
  END IF;

  -- Bio or CV counts as valuable profile content
  IF v_candidate.bio IS NOT NULL AND v_candidate.bio != '' THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'bio');
  END IF;

  -- At least one preference set
  IF (
    v_candidate.preferred_regions IS NOT NULL AND array_length(v_candidate.preferred_regions, 1) > 0
  ) OR (
    v_candidate.household_locations IS NOT NULL AND array_length(v_candidate.household_locations, 1) > 0
  ) THEN
    v_filled_fields := v_filled_fields + 1;
  ELSE
    v_missing := array_append(v_missing, 'location_preferences');
  END IF;

  RETURN QUERY SELECT
    ROUND((v_filled_fields::FLOAT / v_total_fields) * 100)::INTEGER,
    (v_filled_fields::FLOAT / v_total_fields) >= 0.7,
    v_missing;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION match_jobs_for_candidate_v2 IS
  'Enhanced job matching for candidates. Supports yacht and household/land-based positions with industry filtering. Returns comprehensive job data for AI scoring.';

COMMENT ON FUNCTION get_candidate_applications IS
  'Returns all job applications for a candidate. Used to prevent duplicate applications.';

COMMENT ON FUNCTION get_candidate_profile_completeness IS
  'Calculates profile completeness percentage and determines if candidate can use quick-apply.';

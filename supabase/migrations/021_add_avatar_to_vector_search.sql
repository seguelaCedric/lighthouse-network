-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Add avatar_url to Vector Search Functions
-- ============================================================================
-- Fix: Standard search not showing candidate avatars
-- Root cause: match_candidates_by_embedding RPC function didn't return avatar_url
-- ============================================================================

-- Drop existing function to allow column changes
DROP FUNCTION IF EXISTS match_candidates_by_embedding(vector, FLOAT, INT, TEXT[], TEXT[], UUID[]);

-- Recreate function with avatar_url included
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
  avatar_url TEXT,  -- Added: avatar URL for candidate photos
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
    c.avatar_url,  -- Added: return avatar URL
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

COMMENT ON FUNCTION match_candidates_by_embedding IS
  'Primary vector search function. Returns candidates similar to query embedding with filtering. Includes avatar_url for UI display.';

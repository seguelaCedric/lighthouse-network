-- ============================================================================
-- UPDATE PROFILE COMPLETENESS FUNCTION
-- Migration: 073_update_profile_completeness_function.sql
-- Description: Updates get_candidate_profile_completeness to match new field-based scoring
-- ============================================================================

-- Update the function to match the new profile completion logic
-- Uses weighted scoring instead of simple field count
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
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, false, ARRAY['profile']::TEXT[];
    RETURN;
  END IF;

  -- Personal Info (20%): 4% per field (5 fields = 20%)
  IF v_candidate.first_name IS NOT NULL AND v_candidate.first_name != '' THEN
    v_score := v_score + 4;
  ELSE
    v_missing := array_append(v_missing, 'first_name');
  END IF;

  IF v_candidate.last_name IS NOT NULL AND v_candidate.last_name != '' THEN
    v_score := v_score + 4;
  ELSE
    v_missing := array_append(v_missing, 'last_name');
  END IF;

  IF v_candidate.email IS NOT NULL AND v_candidate.email != '' THEN
    v_score := v_score + 4;
  ELSE
    v_missing := array_append(v_missing, 'email');
  END IF;

  IF v_candidate.phone IS NOT NULL AND v_candidate.phone != '' THEN
    v_score := v_score + 4;
  ELSE
    v_missing := array_append(v_missing, 'phone');
  END IF;

  IF v_candidate.nationality IS NOT NULL AND v_candidate.nationality != '' THEN
    v_score := v_score + 4;
  ELSE
    v_missing := array_append(v_missing, 'nationality');
  END IF;

  -- Professional Info (25%): candidateType (10%), position (15%)
  -- Note: candidate_type check - if position exists, assume type is set
  IF v_candidate.candidate_type IS NOT NULL AND v_candidate.candidate_type != '' THEN
    v_score := v_score + 10;
  ELSE
    v_missing := array_append(v_missing, 'candidate_type');
  END IF;

  -- Position check (yacht or household) - 15%
  IF COALESCE(v_candidate.primary_position, v_candidate.yacht_primary_position, v_candidate.household_primary_position) IS NOT NULL THEN
    v_score := v_score + 15;
  ELSE
    v_missing := array_append(v_missing, 'primary_position');
  END IF;

  -- Availability (10%): availability_status
  IF v_candidate.availability_status IS NOT NULL AND v_candidate.availability_status != '' THEN
    v_score := v_score + 10;
  ELSE
    v_missing := array_append(v_missing, 'availability_status');
  END IF;

  -- Documents (20%): CV - check if CV document exists
  -- Note: This requires a separate check, but for SQL function we'll check if cv_url exists
  -- or if there's a document with type='cv'
  IF v_candidate.cv_url IS NOT NULL AND v_candidate.cv_url != '' THEN
    v_score := v_score + 20;
  ELSE
    -- Check documents table for CV
    IF EXISTS (
      SELECT 1 FROM documents 
      WHERE entity_type = 'candidate' 
        AND entity_id = p_candidate_id 
        AND (type = 'cv' OR document_type = 'cv')
        AND deleted_at IS NULL
    ) THEN
      v_score := v_score + 20;
    ELSE
      v_missing := array_append(v_missing, 'cv');
    END IF;
  END IF;

  -- Enhancement Fields (10%): dateOfBirth (2%), currentLocation (3%), avatarUrl (5%)
  IF v_candidate.date_of_birth IS NOT NULL THEN
    v_score := v_score + 2;
  END IF;

  IF v_candidate.current_location IS NOT NULL AND v_candidate.current_location != '' THEN
    v_score := v_score + 3;
  END IF;

  IF v_candidate.avatar_url IS NOT NULL AND v_candidate.avatar_url != '' THEN
    v_score := v_score + 5;
  END IF;

  -- Certifications (10%): STCW/ENG1 for yacht crew
  IF v_candidate.candidate_type IN ('yacht_crew', 'both') THEN
    IF v_candidate.has_stcw = true OR v_candidate.has_eng1 = true THEN
      v_score := v_score + 10;
    ELSE
      v_missing := array_append(v_missing, 'certifications');
    END IF;
  ELSE
    -- Household staff don't need yacht certifications
    v_score := v_score + 10;
  END IF;

  -- Preferences (15%): industryPreference (increased from 10% to compensate for removed years_experience)
  IF v_candidate.industry_preference IS NOT NULL AND v_candidate.industry_preference != '' THEN
    v_score := v_score + 15;
  ELSE
    v_missing := array_append(v_missing, 'industry_preference');
  END IF;

  -- Cap at 100%
  v_score := LEAST(100, v_score);

  RETURN QUERY SELECT
    v_score,
    v_score >= 70,
    v_missing;
END;
$$ LANGUAGE plpgsql STABLE;

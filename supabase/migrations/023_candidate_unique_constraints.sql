-- ============================================================================
-- CANDIDATE UNIQUE CONSTRAINTS
-- Migration: 023_candidate_unique_constraints.sql
-- Description: Prevent duplicate candidates using email and vincere_id
-- ============================================================================

-- ============================================================================
-- 1. ADD UNIQUE INDEX ON EMAIL (case-insensitive, excludes nulls/empty)
-- ============================================================================
-- Using a partial unique index to:
-- - Ignore NULL emails (allow multiple candidates without email)
-- - Ignore empty string emails
-- - Ignore soft-deleted candidates
-- - Make comparison case-insensitive

CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_unique_idx
ON candidates (LOWER(email))
WHERE email IS NOT NULL
  AND email != ''
  AND deleted_at IS NULL;

COMMENT ON INDEX candidates_email_unique_idx IS
  'Prevents duplicate candidates by email (case-insensitive). Allows NULL/empty emails and soft-deleted records.';

-- ============================================================================
-- 2. ADD UNIQUE INDEX ON VINCERE_ID (for Vincere imports)
-- ============================================================================
-- Prevents re-importing the same candidate from Vincere

CREATE UNIQUE INDEX IF NOT EXISTS candidates_vincere_id_unique_idx
ON candidates (vincere_id)
WHERE vincere_id IS NOT NULL
  AND deleted_at IS NULL;

COMMENT ON INDEX candidates_vincere_id_unique_idx IS
  'Prevents duplicate Vincere imports. Each vincere_id can only exist once.';

-- ============================================================================
-- 3. HELPER FUNCTION: Find existing candidate by email or vincere_id
-- ============================================================================
-- Use this before inserting to check for duplicates and return existing record

CREATE OR REPLACE FUNCTION find_existing_candidate(
  p_email TEXT DEFAULT NULL,
  p_vincere_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  match_type TEXT
) AS $$
BEGIN
  -- Check by vincere_id first (most reliable for imports)
  IF p_vincere_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, 'vincere_id'::TEXT as match_type
    FROM candidates c
    WHERE c.vincere_id = p_vincere_id
      AND c.deleted_at IS NULL
    LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Then check by email (case-insensitive)
  IF p_email IS NOT NULL AND p_email != '' THEN
    RETURN QUERY
    SELECT c.id, 'email'::TEXT as match_type
    FROM candidates c
    WHERE LOWER(c.email) = LOWER(p_email)
      AND c.deleted_at IS NULL
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_existing_candidate IS
  'Find existing candidate by email or vincere_id. Use before insert to implement upsert logic.';

-- ============================================================================
-- 4. UPSERT FUNCTION: Insert or update candidate
-- ============================================================================
-- Returns the candidate ID (existing or new) and whether it was an insert/update

CREATE OR REPLACE FUNCTION upsert_candidate(
  p_email TEXT,
  p_vincere_id TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  candidate_id UUID,
  operation TEXT
) AS $$
DECLARE
  v_existing_id UUID;
  v_match_type TEXT;
  v_new_id UUID;
BEGIN
  -- Check for existing candidate
  SELECT id, match_type INTO v_existing_id, v_match_type
  FROM find_existing_candidate(p_email, p_vincere_id);

  IF v_existing_id IS NOT NULL THEN
    -- Update existing candidate
    UPDATE candidates
    SET
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      email = COALESCE(NULLIF(p_email, ''), email),
      vincere_id = COALESCE(p_vincere_id, vincere_id),
      -- Merge additional data from JSONB
      primary_position = COALESCE((p_data->>'primary_position'), primary_position),
      years_experience = COALESCE((p_data->>'years_experience')::INT, years_experience),
      nationality = COALESCE((p_data->>'nationality'), nationality),
      phone = COALESCE((p_data->>'phone'), phone),
      current_location = COALESCE((p_data->>'current_location'), current_location),
      current_country = COALESCE((p_data->>'current_country'), current_country),
      updated_at = NOW(),
      last_synced_at = CASE WHEN p_vincere_id IS NOT NULL THEN NOW() ELSE last_synced_at END
    WHERE id = v_existing_id;

    RETURN QUERY SELECT v_existing_id, 'updated'::TEXT;
  ELSE
    -- Insert new candidate
    INSERT INTO candidates (
      email,
      vincere_id,
      first_name,
      last_name,
      primary_position,
      years_experience,
      nationality,
      phone,
      current_location,
      current_country,
      source,
      created_at,
      updated_at
    )
    VALUES (
      NULLIF(p_email, ''),
      p_vincere_id,
      p_first_name,
      p_last_name,
      p_data->>'primary_position',
      (p_data->>'years_experience')::INT,
      p_data->>'nationality',
      p_data->>'phone',
      p_data->>'current_location',
      p_data->>'current_country',
      CASE WHEN p_vincere_id IS NOT NULL THEN 'vincere' ELSE 'manual' END,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_new_id;

    RETURN QUERY SELECT v_new_id, 'inserted'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_candidate IS
  'Insert or update candidate. Checks email and vincere_id for duplicates. Returns candidate_id and operation type.';

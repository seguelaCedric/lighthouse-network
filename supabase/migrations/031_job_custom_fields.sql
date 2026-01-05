-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Job Custom Fields from Vincere
-- ============================================================================
-- Adds columns for Vincere custom fields:
-- - holiday_package: Text rotation/leave description (e.g., "3:1 Rotation")
-- - program: Yacht program name/type
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS holiday_package TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS program TEXT;

COMMENT ON COLUMN jobs.holiday_package IS 'Text description of leave/rotation package from Vincere (e.g., "3:1 Rotation", "6 weeks on/off")';
COMMENT ON COLUMN jobs.program IS 'Yacht program type (e.g., "Private", "Charter", "Private/Charter")';

-- Drop and recreate view to add new columns
DROP VIEW IF EXISTS public_jobs;

CREATE VIEW public_jobs AS
SELECT
  j.id,
  COALESCE(j.public_title, j.title) as title,
  COALESCE(j.public_description, j.requirements_text) as description,
  j.position_category,
  j.vessel_type,
  j.vessel_size_meters,
  j.vessel_name,
  j.contract_type,
  j.start_date,
  j.end_date,
  j.rotation_schedule,
  j.primary_region,
  j.itinerary,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.salary_period,
  j.benefits,
  j.requirements,
  j.holiday_days,
  j.holiday_package,
  j.program,
  j.is_urgent,
  j.apply_deadline,
  j.applications_count,
  j.views_count,
  j.created_at,
  j.published_at,
  o.name as agency_name
FROM jobs j
LEFT JOIN organizations o ON j.created_by_agency_id = o.id
WHERE j.is_public = true
  AND j.status = 'open'
  AND j.deleted_at IS NULL
  AND (j.apply_deadline IS NULL OR j.apply_deadline >= CURRENT_DATE);

COMMENT ON VIEW public_jobs IS 'Safe view of public jobs without confidential information.';

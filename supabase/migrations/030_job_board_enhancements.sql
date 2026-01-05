-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Job Board Enhancements
-- ============================================================================
-- Adds enhanced job board functionality:
-- - Holiday days field for job postings
-- - Updated public_jobs view with new field
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- JOBS TABLE - Add holiday_days column
-- ============================================================================

-- holiday_days: Annual holiday/leave days included in the package
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS holiday_days INTEGER;

-- Add check constraint for reasonable holiday days (0-365)
DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT check_holiday_days_range
    CHECK (holiday_days IS NULL OR (holiday_days >= 0 AND holiday_days <= 365));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN jobs.holiday_days IS 'Annual holiday/leave days included in the employment package';

-- ============================================================================
-- UPDATE VIEW: Public jobs with holiday_days field
-- ============================================================================

CREATE OR REPLACE VIEW public_jobs AS
SELECT
  j.id,
  COALESCE(j.public_title, j.title) as title,
  COALESCE(j.public_description, j.requirements_text) as description,
  j.position_category,
  j.vessel_type,
  j.vessel_size_meters,
  j.contract_type,
  j.start_date,
  j.end_date,
  j.rotation_schedule,
  j.primary_region,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.salary_period,
  j.benefits,
  j.requirements,
  j.holiday_days,  -- NEW: Holiday days field
  j.is_urgent,
  j.apply_deadline,
  j.applications_count,
  j.views_count,
  j.created_at,
  j.published_at,
  -- Don't expose: vessel_name, client_id, created_by_agency_id, fees, etc.
  o.name as agency_name
FROM jobs j
LEFT JOIN organizations o ON j.created_by_agency_id = o.id
WHERE j.is_public = true
  AND j.status = 'open'
  AND j.deleted_at IS NULL
  AND (j.apply_deadline IS NULL OR j.apply_deadline >= CURRENT_DATE);

COMMENT ON VIEW public_jobs IS 'Safe view of public jobs without confidential information. Includes holiday_days for job board display.';

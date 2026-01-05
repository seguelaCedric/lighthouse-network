-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Remove Multi-Agency Infrastructure
-- ============================================================================
-- This migration removes the multi-agency/collaboration features as we are
-- focusing on being a single agency platform rather than a network of agencies.
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- DROP EMPLOYER ENQUIRY REFERRAL SYSTEM
-- (Crew referring competitor agencies)
-- ============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS employer_enquiry_earnings CASCADE;
DROP VIEW IF EXISTS pending_employer_enquiries CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_employer_enquiry_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_submit_employer_enquiry(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_employer_enquiry_updated_at() CASCADE;

-- Drop tables (in order of dependencies)
DROP TABLE IF EXISTS employer_enquiry_rewards CASCADE;
DROP TABLE IF EXISTS employer_enquiry_jobs CASCADE;
DROP TABLE IF EXISTS employer_enquiry_settings CASCADE;
DROP TABLE IF EXISTS employer_enquiries CASCADE;

-- ============================================================================
-- DROP COLLABORATION REQUESTS TABLE
-- (Inter-agency collaboration)
-- ============================================================================

DROP TABLE IF EXISTS collaboration_requests CASCADE;

-- ============================================================================
-- DROP CANDIDATE-AGENCY RELATIONSHIPS TABLE
-- (Multi-agency candidate sharing)
-- ============================================================================

DROP TABLE IF EXISTS candidate_agency_relationships CASCADE;

-- ============================================================================
-- SIMPLIFY JOB VISIBILITY ENUM
-- Remove 'network' option (jobs shared between agencies)
-- ============================================================================

-- Jobs with 'network' visibility should become 'private'
UPDATE jobs SET visibility = 'private' WHERE visibility = 'network';

-- Note: We cannot easily alter the enum to remove a value in Postgres
-- Instead, we'll add a check constraint to prevent 'network' from being used
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_visibility_no_network;
ALTER TABLE jobs ADD CONSTRAINT jobs_visibility_no_network
  CHECK (visibility IN ('private', 'public'));

-- ============================================================================
-- SIMPLIFY PLACEMENTS TABLE
-- Remove multi-agency fee splitting columns
-- ============================================================================

-- Remove the sourcing_agency_id column (used for fee splits)
ALTER TABLE placements DROP COLUMN IF EXISTS sourcing_agency_id;
ALTER TABLE placements DROP COLUMN IF EXISTS fee_split_sourcing;
ALTER TABLE placements DROP COLUMN IF EXISTS fee_split_placing;
ALTER TABLE placements DROP COLUMN IF EXISTS fee_split_platform;
ALTER TABLE placements DROP COLUMN IF EXISTS is_collaboration;

-- ============================================================================
-- CLEAN UP ORGANIZATION TABLE
-- Remove agency-specific columns if they exist
-- ============================================================================

-- We'll keep the organizations table but it will only be used for clients
-- The 'agency' type is no longer relevant for external agencies

-- ============================================================================
-- UPDATE RLS POLICIES
-- Simplify policies that referenced multi-agency relationships
-- ============================================================================

-- No changes needed - existing policies will work fine without the
-- collaboration tables

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE jobs IS 'Job postings - private (internal only) or public (job board)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

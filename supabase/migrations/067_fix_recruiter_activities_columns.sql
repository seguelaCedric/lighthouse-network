-- Fix recruiter_activities columns to match actual Vincere activity types
-- The Vincere API returns PLACEMENT and APPLICATION types, not TASK and MEETING

-- Rename columns to match actual activity types
ALTER TABLE recruiter_activities RENAME COLUMN tasks_count TO placements_count;
ALTER TABLE recruiter_activities RENAME COLUMN meetings_count TO applications_count;

-- Update comments
COMMENT ON COLUMN recruiter_activities.placements_count IS 'Number of placements made';
COMMENT ON COLUMN recruiter_activities.applications_count IS 'Number of applications processed';

-- Recruiter Activities Tracking
-- Stores daily activity counts synced from Vincere for CEO visibility

CREATE TABLE recruiter_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  vincere_user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  activity_date DATE NOT NULL,
  tasks_count INTEGER NOT NULL DEFAULT 0,
  meetings_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, vincere_user_id, activity_date)
);

-- Index for querying by date range (used in analytics dashboard)
CREATE INDEX idx_recruiter_activities_date
  ON recruiter_activities(organization_id, activity_date);

-- Index for querying by user
CREATE INDEX idx_recruiter_activities_user
  ON recruiter_activities(vincere_user_id, activity_date);

-- Enable RLS
ALTER TABLE recruiter_activities ENABLE ROW LEVEL SECURITY;

-- Agency users can read activities for their organization
CREATE POLICY "agency_activities_read"
  ON recruiter_activities
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role can manage all activities (for cron sync)
CREATE POLICY "service_role_activities_all"
  ON recruiter_activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE recruiter_activities IS 'Daily activity counts per recruiter, synced from Vincere at 5PM Paris time';
COMMENT ON COLUMN recruiter_activities.vincere_user_id IS 'Vincere user ID for the recruiter';
COMMENT ON COLUMN recruiter_activities.user_name IS 'Recruiter name (denormalized for display)';
COMMENT ON COLUMN recruiter_activities.activity_date IS 'The date of the activities';
COMMENT ON COLUMN recruiter_activities.tasks_count IS 'Number of tasks (calls, emails, to-dos) completed';
COMMENT ON COLUMN recruiter_activities.meetings_count IS 'Number of meetings held';

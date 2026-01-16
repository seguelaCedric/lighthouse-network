-- ============================================================================
-- Pending Job Alerts Queue
-- ============================================================================
-- This migration creates a queue for debounced job alerts.
-- When a job is created/updated via Vincere webhook, instead of sending alerts
-- immediately, we schedule them for a future time. If the job is updated again
-- before that time, we push back the scheduled time. This ensures we don't
-- send alerts for incomplete jobs that are still being populated with custom fields.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create pending job alerts table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_job_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The job to send alerts for
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- When the alert should be processed (debounce window)
  scheduled_at TIMESTAMPTZ NOT NULL,

  -- Track when this was first created and last updated
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Processing status
  processed_at TIMESTAMPTZ,

  -- Only one pending alert per job at a time
  UNIQUE(job_id)
);

-- Index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_pending_job_alerts_scheduled
  ON pending_job_alerts(scheduled_at)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pending_job_alerts_job
  ON pending_job_alerts(job_id);

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE pending_job_alerts ENABLE ROW LEVEL SECURITY;

-- Service role can manage pending alerts
CREATE POLICY "service_manage_pending_alerts" ON pending_job_alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Organization members can view pending alerts
CREATE POLICY "org_members_view_pending_alerts" ON pending_job_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()
      AND u.organization_id IS NOT NULL
    )
  );

-- ----------------------------------------------------------------------------
-- Function to schedule or reschedule a job alert
-- This implements the debounce logic: if an alert is already pending,
-- we push back the scheduled time instead of creating a new one.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION schedule_job_alert(
  p_job_id UUID,
  p_delay_seconds INTEGER DEFAULT 60
) RETURNS UUID AS $$
DECLARE
  v_scheduled_at TIMESTAMPTZ;
  v_result_id UUID;
BEGIN
  -- Calculate the new scheduled time
  v_scheduled_at := now() + (p_delay_seconds || ' seconds')::INTERVAL;

  -- Upsert: insert or update the scheduled time if job already has a pending alert
  INSERT INTO pending_job_alerts (job_id, scheduled_at, updated_at)
  VALUES (p_job_id, v_scheduled_at, now())
  ON CONFLICT (job_id)
  DO UPDATE SET
    scheduled_at = v_scheduled_at,
    updated_at = now(),
    -- Reset processed_at in case this was already processed and we need to reschedule
    processed_at = NULL
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function to get and mark pending alerts as processing
-- Returns alerts that are due and marks them to prevent double-processing
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_job_alerts_for_processing(
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  job_id UUID,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH due_alerts AS (
    SELECT pja.id, pja.job_id, pja.scheduled_at, pja.created_at
    FROM pending_job_alerts pja
    WHERE pja.processed_at IS NULL
      AND pja.scheduled_at <= now()
    ORDER BY pja.scheduled_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE pending_job_alerts pja
  SET processed_at = now()
  FROM due_alerts
  WHERE pja.id = due_alerts.id
  RETURNING due_alerts.id, due_alerts.job_id, due_alerts.scheduled_at, due_alerts.created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION schedule_job_alert TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_job_alert TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_job_alerts_for_processing TO service_role;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE pending_job_alerts IS 'Queue for debounced job alerts. Jobs are scheduled for alerts after a delay to allow all Vincere custom fields to be synced.';
COMMENT ON COLUMN pending_job_alerts.scheduled_at IS 'When the alert should be sent. Gets pushed back each time the job is updated.';
COMMENT ON COLUMN pending_job_alerts.processed_at IS 'When this alert was actually processed. NULL means pending.';
COMMENT ON FUNCTION schedule_job_alert IS 'Schedule or reschedule a job alert with debounce. If already scheduled, pushes back the time.';
COMMENT ON FUNCTION get_pending_job_alerts_for_processing IS 'Get due alerts and mark them as processing atomically to prevent double-processing.';

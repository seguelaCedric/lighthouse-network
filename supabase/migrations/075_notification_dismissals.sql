-- ============================================================================
-- Notification Dismissals Table
-- ============================================================================
-- This migration creates a table to track read/dismissed state for computed
-- notifications (certificate expiry, application status updates).
--
-- These notifications are generated on-the-fly rather than stored in the
-- candidate_notifications table, so we need a separate mechanism to track
-- which ones have been read/dismissed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create notification_dismissals table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who dismissed it
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Notification identifier (e.g., 'stcw-expiry', 'cert-{id}', 'app-placed-{id}')
  notification_key TEXT NOT NULL,

  -- When it was dismissed
  dismissed_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate dismissals
  UNIQUE(candidate_id, notification_key)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_dismissals_candidate ON notification_dismissals(candidate_id);
CREATE INDEX IF NOT EXISTS idx_dismissals_key ON notification_dismissals(notification_key);

-- Comment for documentation
COMMENT ON TABLE notification_dismissals IS 'Tracks read/dismissed state for computed notifications (certificates, applications)';
COMMENT ON COLUMN notification_dismissals.notification_key IS 'Unique identifier for the notification, e.g., stcw-expiry, cert-{uuid}, app-placed-{uuid}';

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE notification_dismissals ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own dismissals
CREATE POLICY "candidates_view_own_dismissals" ON notification_dismissals
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Candidates can insert dismissals for themselves
CREATE POLICY "candidates_insert_own_dismissals" ON notification_dismissals
  FOR INSERT
  WITH CHECK (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Candidates can delete their own dismissals (to "un-dismiss" if needed)
CREATE POLICY "candidates_delete_own_dismissals" ON notification_dismissals
  FOR DELETE
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
    OR
    candidate_id IN (
      SELECT c.id FROM candidates c
      WHERE c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Service role can manage all dismissals (for batch operations)
CREATE POLICY "service_manage_dismissals" ON notification_dismissals
  FOR ALL
  USING (true)
  WITH CHECK (true);

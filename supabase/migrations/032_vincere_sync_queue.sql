-- Vincere Sync Queue
-- Tracks failed sync attempts for retry processing
-- Uses fire-and-forget pattern: local actions succeed, sync failures are queued

-- Create the sync queue table
CREATE TABLE vincere_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('create', 'update', 'document', 'application', 'availability')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for finding pending items to retry
CREATE INDEX idx_vincere_sync_queue_pending
  ON vincere_sync_queue(next_retry_at)
  WHERE status = 'pending';

-- Index for finding items by candidate
CREATE INDEX idx_vincere_sync_queue_candidate
  ON vincere_sync_queue(candidate_id);

-- Index for monitoring by status
CREATE INDEX idx_vincere_sync_queue_status
  ON vincere_sync_queue(status, created_at);

-- Auto-update updated_at timestamp
CREATE TRIGGER trg_vincere_sync_queue_updated_at
  BEFORE UPDATE ON vincere_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE vincere_sync_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access sync queue (it's internal infrastructure)
CREATE POLICY "Service role can manage sync queue"
  ON vincere_sync_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE vincere_sync_queue IS 'Queue for failed Vincere sync operations, used for retry mechanism';
COMMENT ON COLUMN vincere_sync_queue.sync_type IS 'Type of sync operation: create, update, document, application, availability';
COMMENT ON COLUMN vincere_sync_queue.payload IS 'Data needed to retry the sync operation';
COMMENT ON COLUMN vincere_sync_queue.status IS 'Current status: pending (waiting for retry), processing, completed, failed (permanent), abandoned (max retries exceeded)';
COMMENT ON COLUMN vincere_sync_queue.attempts IS 'Number of retry attempts made';
COMMENT ON COLUMN vincere_sync_queue.next_retry_at IS 'When to next attempt this sync (uses exponential backoff)';

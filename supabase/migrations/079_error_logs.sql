-- ============================================================================
-- ERROR LOGS TABLE
-- ============================================================================
-- Centralized error logging for backend API routes
-- Stores all errors with context for debugging and monitoring
-- ============================================================================

-- Create error severity enum
DO $$ BEGIN
  CREATE TYPE error_severity AS ENUM (
    'debug',
    'info',
    'warning',
    'error',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create the error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Error details
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_code TEXT,
  severity error_severity DEFAULT 'error',

  -- Request context
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_id TEXT,

  -- User context (if available)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  auth_id UUID,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Additional context
  metadata JSONB DEFAULT '{}',
  request_body JSONB,
  request_headers JSONB,
  query_params JSONB,

  -- Environment info
  environment TEXT DEFAULT 'production',
  version TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- For deduplication and grouping
  fingerprint TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_path ON error_logs(path);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_organization_id ON error_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_status_code ON error_logs(status_code);

-- Composite index for filtering
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created ON error_logs(severity, created_at DESC);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view error logs (no organization scoping for error logs)
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Policy: Allow service role to insert error logs (for API routes)
-- Note: Service role bypasses RLS, so this is mainly for documentation
CREATE POLICY "Service role can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- Function to clean up old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Comment on the table
COMMENT ON TABLE error_logs IS 'Centralized error logging for backend API routes. Stores errors with full context for debugging.';
COMMENT ON COLUMN error_logs.fingerprint IS 'Hash of error message and path for deduplication and grouping similar errors';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context-specific data about the error';

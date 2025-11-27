-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Clients Table
-- ============================================================================
-- Agency-specific client management for tracking yacht clients,
-- management companies, and relationships.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLIENTS TABLE
-- Agency's CRM for their yacht clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agency ownership
  agency_id UUID NOT NULL REFERENCES organizations(id),

  -- Basic info
  name TEXT NOT NULL,  -- "M/Y Excellence" or "Blue Marine Management"
  type TEXT DEFAULT 'yacht' CHECK (type IN ('yacht', 'management_co', 'private_owner', 'charter_co')),

  -- Contact
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_role TEXT,  -- Captain, Owner, Fleet Manager

  -- Vessel info (if type = yacht)
  vessel_name TEXT,
  vessel_type TEXT CHECK (vessel_type IS NULL OR vessel_type IN ('motor', 'sailing', 'catamaran', 'explorer', 'expedition', 'classic')),
  vessel_size INTEGER,  -- meters
  vessel_flag TEXT,
  vessel_build_year INTEGER,

  -- Relationship
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  source TEXT CHECK (source IS NULL OR source IN ('referral', 'website', 'event', 'cold_outreach', 'social_media', 'other')),
  notes TEXT,

  -- Stats (denormalized for performance)
  total_jobs INTEGER DEFAULT 0,
  total_placements INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  last_placement_at TIMESTAMPTZ,
  last_job_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Add client_id to jobs table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;
END $$;

-- Index on jobs.client_id
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Agency members can manage their own clients
DROP POLICY IF EXISTS clients_agency_access ON clients;
CREATE POLICY clients_agency_access ON clients
  FOR ALL
  USING (
    agency_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to update client stats when a placement is made
CREATE OR REPLACE FUNCTION update_client_stats_on_placement()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_fee DECIMAL;
BEGIN
  -- Get client_id from job
  SELECT j.client_id INTO v_client_id
  FROM jobs j
  WHERE j.id = NEW.job_id;

  IF v_client_id IS NOT NULL THEN
    -- Get fee from placement
    v_fee := COALESCE(NEW.total_fee, 0);

    UPDATE clients
    SET
      total_placements = total_placements + 1,
      total_revenue = total_revenue + v_fee,
      last_placement_at = NOW(),
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_client_on_placement ON placements;
CREATE TRIGGER trg_update_client_on_placement
  AFTER INSERT ON placements
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stats_on_placement();

-- Function to update client stats when a job is created
CREATE OR REPLACE FUNCTION update_client_stats_on_job()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET
      total_jobs = total_jobs + 1,
      last_job_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_client_on_job ON jobs;
CREATE TRIGGER trg_update_client_on_job
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stats_on_job();

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE clients IS 'Agency-specific CRM for yacht clients and management companies';
COMMENT ON COLUMN clients.agency_id IS 'The agency that owns this client relationship';
COMMENT ON COLUMN clients.type IS 'Client type: yacht, management_co, private_owner, charter_co';
COMMENT ON COLUMN clients.status IS 'Relationship status: active, inactive, prospect';
COMMENT ON COLUMN clients.total_revenue IS 'Total placement fees earned from this client';

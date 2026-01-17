-- Migration: YotSpot Search Results Cache
-- Purpose: Cache YotSpot candidate search results for preview-only display
-- Candidates are NOT created until recruiter explicitly imports them

-- =============================================================================
-- YotSpot Search Results Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS yotspot_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to job being searched for
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- YotSpot candidate identifier
  yotspot_profile_url TEXT NOT NULL,
  yotspot_candidate_id TEXT,  -- If available from search results

  -- ==========================================================================
  -- Preview Data (scraped from search results, NOT full profile)
  -- ==========================================================================
  preview_data JSONB NOT NULL DEFAULT '{}',
  /*
  {
    "name": "John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "position": "Chief Stewardess",
    "yearsExperience": 8,
    "availability": "Available immediately",
    "photoUrl": "https://...",
    "nationality": "British",
    "currentLocation": "Antibes, France",
    "hasSTCW": true,
    "hasENG1": true,
    "hasSchengen": true,
    "hasB1B2": false,
    "languages": ["English", "French"],
    "yachtSizeMin": 40,
    "yachtSizeMax": 80,
    "bio": "Short excerpt from profile..."
  }
  */

  -- ==========================================================================
  -- Match Scoring
  -- ==========================================================================
  match_score NUMERIC(5,2),  -- 0.00 to 100.00
  match_reasoning TEXT,       -- AI-generated explanation

  -- Score breakdown for UI
  match_breakdown JSONB DEFAULT '{}',
  /*
  {
    "position": 25,
    "experience": 20,
    "certifications": 15,
    "availability": 15,
    "preferences": 15,
    "overall": 90
  }
  */

  -- ==========================================================================
  -- Import Tracking
  -- ==========================================================================

  -- NULL until recruiter imports this candidate
  imported_candidate_id UUID REFERENCES candidates(id),
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES users(id),

  -- Link to application if added to shortlist
  application_id UUID REFERENCES applications(id),

  -- ==========================================================================
  -- Search Metadata
  -- ==========================================================================

  -- When this result was found
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Who triggered the search
  searched_by UUID REFERENCES users(id),

  -- Search query parameters used (for caching/debugging)
  search_params JSONB DEFAULT '{}',
  /*
  {
    "position": "Chief Stewardess",
    "minExperience": 5,
    "requireSTCW": true,
    "requireENG1": true,
    "availability": "available"
  }
  */

  -- Page/position in search results
  search_page INTEGER,
  search_position INTEGER,

  -- ==========================================================================
  -- Cache Management
  -- ==========================================================================

  -- Cache expires after 24 hours
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one result per candidate per job
  UNIQUE(job_id, yotspot_profile_url)
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Find search results for a job, ordered by score
CREATE INDEX idx_yotspot_search_job_score
  ON yotspot_search_results(job_id, match_score DESC NULLS LAST)
  WHERE imported_candidate_id IS NULL;  -- Only non-imported

-- Find by profile URL (for deduplication)
CREATE INDEX idx_yotspot_search_profile_url
  ON yotspot_search_results(yotspot_profile_url);

-- Find expired cache entries for cleanup
CREATE INDEX idx_yotspot_search_expires
  ON yotspot_search_results(expires_at)
  WHERE imported_candidate_id IS NULL;

-- =============================================================================
-- Auto-update timestamp
-- =============================================================================

CREATE TRIGGER trg_yotspot_search_results_updated_at
  BEFORE UPDATE ON yotspot_search_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE yotspot_search_results ENABLE ROW LEVEL SECURITY;

-- Agency members can see search results for their jobs
CREATE POLICY yotspot_search_agency_access ON yotspot_search_results
  FOR ALL
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      WHERE j.created_by_agency_id IN (
        SELECT organization_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get cached search results for a job (excludes expired)
CREATE OR REPLACE FUNCTION get_yotspot_search_results(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_include_imported BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  yotspot_profile_url TEXT,
  preview_data JSONB,
  match_score NUMERIC,
  match_reasoning TEXT,
  match_breakdown JSONB,
  imported_candidate_id UUID,
  searched_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.yotspot_profile_url,
    r.preview_data,
    r.match_score,
    r.match_reasoning,
    r.match_breakdown,
    r.imported_candidate_id,
    r.searched_at
  FROM yotspot_search_results r
  WHERE r.job_id = p_job_id
    AND r.expires_at > NOW()
    AND (p_include_imported OR r.imported_candidate_id IS NULL)
  ORDER BY r.match_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired cache entries (run via cron)
CREATE OR REPLACE FUNCTION cleanup_yotspot_search_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM yotspot_search_results
  WHERE expires_at < NOW()
    AND imported_candidate_id IS NULL;  -- Keep imported records

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE yotspot_search_results IS
  'Cache for YotSpot candidate search results. Preview data only - full candidates '
  'are NOT created until explicitly imported. Entries expire after 24 hours.';

COMMENT ON COLUMN yotspot_search_results.preview_data IS
  'Candidate preview scraped from YotSpot search results (name, position, basic info).';

COMMENT ON COLUMN yotspot_search_results.imported_candidate_id IS
  'Links to imported candidate record. NULL until recruiter imports.';

COMMENT ON COLUMN yotspot_search_results.expires_at IS
  'Cache expiry time. Non-imported entries are deleted after this time.';

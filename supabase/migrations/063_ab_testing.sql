-- A/B Testing Framework
-- Supports experiments for landing page optimization

-- Experiments table
CREATE TABLE ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- What we're testing
  test_element TEXT NOT NULL CHECK (test_element IN (
    'cta_text',               -- Call-to-action button text/style
    'form_placement',         -- Where the enquiry form appears
    'match_preview_visibility', -- Show/hide/modify match preview
    'hero_layout'             -- Hero section layout variations
  )),

  -- Targeting
  target_page_type TEXT DEFAULT 'hire_landing' CHECK (target_page_type IN (
    'hire_landing',           -- /hire-a-[position]-[country]/...
    'job_listing',            -- /jobs/[id]
    'all'                     -- All applicable pages
  )),
  target_positions TEXT[],    -- Specific positions to target (null = all)
  target_locations TEXT[],    -- Specific locations to target (null = all)

  -- Traffic allocation
  traffic_percentage INTEGER DEFAULT 100 CHECK (traffic_percentage BETWEEN 1 AND 100),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',                  -- Being configured
    'running',                -- Active experiment
    'paused',                 -- Temporarily stopped
    'completed',              -- Finished, results available
    'archived'                -- No longer relevant
  )),

  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Minimum sample size for statistical significance
  minimum_sample_size INTEGER DEFAULT 100,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Variants table
CREATE TABLE ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,

  -- Variant identification
  name TEXT NOT NULL,         -- e.g., "Control", "Variant A"
  variant_key TEXT NOT NULL,  -- e.g., "control", "variant_a" (for code)
  is_control BOOLEAN DEFAULT false,

  -- Variant configuration (JSON based on test_element)
  -- For cta_text: { "cta_text": "Get Matched Now", "cta_color": "primary", "cta_size": "lg" }
  -- For form_placement: { "placement": "hero" | "after_benefits" | "sidebar" | "sticky" }
  -- For match_preview_visibility: { "show": true, "preview_count": 3, "position": "hero" | "benefits" }
  -- For hero_layout: { "layout": "centered" | "split" | "full_width" }
  config JSONB NOT NULL DEFAULT '{}',

  -- Traffic weight (relative to other variants)
  weight INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Visitor assignments table (cookie-based)
CREATE TABLE ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Visitor identification
  visitor_id TEXT NOT NULL,   -- From cookie (UUID stored as text)

  -- Assignment
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

  -- Context
  page_url TEXT,              -- First page where assignment occurred
  user_agent TEXT,

  -- Timestamps
  assigned_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate assignments
  UNIQUE(visitor_id, experiment_id)
);

-- Conversions table
CREATE TABLE ab_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to assignment
  assignment_id UUID NOT NULL REFERENCES ab_assignments(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

  -- Conversion details
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (
    'form_submit',            -- Enquiry form submitted
    'form_start',             -- User started filling form
    'cta_click',              -- CTA button clicked
    'match_preview_click',    -- Clicked on match preview
    'time_on_page_30s',       -- Spent 30+ seconds on page
    'time_on_page_60s',       -- Spent 60+ seconds on page
    'scroll_50',              -- Scrolled 50% of page
    'scroll_100'              -- Scrolled to bottom
  )),

  -- Additional data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  converted_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate conversions of same type
  UNIQUE(assignment_id, conversion_type)
);

-- Indexes for performance
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_test_element ON ab_experiments(test_element);
CREATE INDEX idx_ab_experiments_page_type ON ab_experiments(target_page_type);

CREATE INDEX idx_ab_variants_experiment ON ab_variants(experiment_id);
CREATE INDEX idx_ab_variants_control ON ab_variants(experiment_id) WHERE is_control = true;

CREATE INDEX idx_ab_assignments_visitor ON ab_assignments(visitor_id);
CREATE INDEX idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_variant ON ab_assignments(variant_id);
CREATE INDEX idx_ab_assignments_lookup ON ab_assignments(visitor_id, experiment_id);

CREATE INDEX idx_ab_conversions_assignment ON ab_conversions(assignment_id);
CREATE INDEX idx_ab_conversions_experiment ON ab_conversions(experiment_id);
CREATE INDEX idx_ab_conversions_variant ON ab_conversions(variant_id);
CREATE INDEX idx_ab_conversions_type ON ab_conversions(conversion_type);

-- Function to get active experiments for a page
CREATE OR REPLACE FUNCTION get_active_experiments(
  p_page_type TEXT DEFAULT 'hire_landing',
  p_position TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  experiment_id UUID,
  experiment_name TEXT,
  test_element TEXT,
  traffic_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.test_element,
    e.traffic_percentage
  FROM ab_experiments e
  WHERE e.status = 'running'
    AND (e.target_page_type = p_page_type OR e.target_page_type = 'all')
    AND (e.target_positions IS NULL OR p_position = ANY(e.target_positions))
    AND (e.target_locations IS NULL OR p_location = ANY(e.target_locations));
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for deterministic variant assignment
CREATE OR REPLACE FUNCTION assign_variant(
  p_visitor_id TEXT,
  p_experiment_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_existing_variant_id UUID;
  v_hash_value INTEGER;
  v_total_weight INTEGER;
  v_running_weight INTEGER := 0;
  v_variant RECORD;
  v_traffic_pct INTEGER;
BEGIN
  -- Check for existing assignment
  SELECT variant_id INTO v_existing_variant_id
  FROM ab_assignments
  WHERE visitor_id = p_visitor_id AND experiment_id = p_experiment_id;

  IF v_existing_variant_id IS NOT NULL THEN
    RETURN v_existing_variant_id;
  END IF;

  -- Get traffic percentage
  SELECT traffic_percentage INTO v_traffic_pct
  FROM ab_experiments
  WHERE id = p_experiment_id AND status = 'running';

  IF v_traffic_pct IS NULL THEN
    RETURN NULL; -- Experiment not running
  END IF;

  -- Generate deterministic hash (0-99)
  v_hash_value := abs(hashtext(p_visitor_id || p_experiment_id::text)) % 100;

  -- Check if visitor is in traffic allocation
  IF v_hash_value >= v_traffic_pct THEN
    RETURN NULL; -- Not in experiment
  END IF;

  -- Get total weight
  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
  FROM ab_variants
  WHERE experiment_id = p_experiment_id;

  IF v_total_weight = 0 THEN
    RETURN NULL;
  END IF;

  -- Deterministic variant selection based on hash
  v_hash_value := abs(hashtext(p_visitor_id || p_experiment_id::text || 'variant')) % v_total_weight;

  FOR v_variant IN
    SELECT id, weight
    FROM ab_variants
    WHERE experiment_id = p_experiment_id
    ORDER BY created_at
  LOOP
    v_running_weight := v_running_weight + v_variant.weight;
    IF v_hash_value < v_running_weight THEN
      RETURN v_variant.id;
    END IF;
  END LOOP;

  -- Fallback to first variant
  SELECT id INTO v_existing_variant_id
  FROM ab_variants
  WHERE experiment_id = p_experiment_id
  ORDER BY created_at
  LIMIT 1;

  RETURN v_existing_variant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Materialized view for experiment results
CREATE MATERIALIZED VIEW ab_experiment_results AS
SELECT
  e.id AS experiment_id,
  e.name AS experiment_name,
  e.test_element,
  e.status,
  v.id AS variant_id,
  v.name AS variant_name,
  v.is_control,
  COUNT(DISTINCT a.id) AS total_visitors,
  COUNT(DISTINCT c.id) FILTER (WHERE c.conversion_type = 'form_submit') AS form_submits,
  COUNT(DISTINCT c.id) FILTER (WHERE c.conversion_type = 'cta_click') AS cta_clicks,
  COUNT(DISTINCT c.id) FILTER (WHERE c.conversion_type = 'form_start') AS form_starts,
  CASE
    WHEN COUNT(DISTINCT a.id) > 0
    THEN ROUND(COUNT(DISTINCT c.id) FILTER (WHERE c.conversion_type = 'form_submit')::NUMERIC / COUNT(DISTINCT a.id) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  MIN(a.assigned_at) AS first_assignment,
  MAX(a.assigned_at) AS last_assignment
FROM ab_experiments e
LEFT JOIN ab_variants v ON v.experiment_id = e.id
LEFT JOIN ab_assignments a ON a.variant_id = v.id
LEFT JOIN ab_conversions c ON c.assignment_id = a.id
GROUP BY e.id, e.name, e.test_element, e.status, v.id, v.name, v.is_control;

-- Create unique index for refresh concurrently
CREATE UNIQUE INDEX idx_ab_results_pk ON ab_experiment_results(experiment_id, variant_id);

-- Function to refresh results
CREATE OR REPLACE FUNCTION refresh_ab_results()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ab_experiment_results;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_conversions ENABLE ROW LEVEL SECURITY;

-- Public can read running experiments (needed for variant assignment)
CREATE POLICY "Public can read running experiments"
  ON ab_experiments FOR SELECT
  USING (status = 'running');

CREATE POLICY "Public can read variants of running experiments"
  ON ab_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ab_experiments e
      WHERE e.id = experiment_id AND e.status = 'running'
    )
  );

-- Public can create assignments and conversions
CREATE POLICY "Public can create assignments"
  ON ab_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read own assignments"
  ON ab_assignments FOR SELECT
  USING (true);

CREATE POLICY "Public can create conversions"
  ON ab_conversions FOR INSERT
  WITH CHECK (true);

-- Authenticated users can manage experiments
CREATE POLICY "Agency users can manage experiments"
  ON ab_experiments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Agency users can manage variants"
  ON ab_variants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Agency users can read all assignments"
  ON ab_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agency users can read all conversions"
  ON ab_conversions FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "Service role can manage experiments"
  ON ab_experiments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage variants"
  ON ab_variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage assignments"
  ON ab_assignments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage conversions"
  ON ab_conversions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_ab_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ab_experiments_updated_at
  BEFORE UPDATE ON ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_ab_experiments_updated_at();

-- Comments
COMMENT ON TABLE ab_experiments IS 'A/B test experiments for landing page optimization';
COMMENT ON TABLE ab_variants IS 'Variants for A/B experiments with configuration';
COMMENT ON TABLE ab_assignments IS 'Visitor to variant assignments (cookie-based)';
COMMENT ON TABLE ab_conversions IS 'Conversion events for A/B experiments';
COMMENT ON MATERIALIZED VIEW ab_experiment_results IS 'Aggregated results for experiments';
COMMENT ON FUNCTION get_active_experiments IS 'Get active experiments for a specific page type and targeting';
COMMENT ON FUNCTION assign_variant IS 'Deterministically assign a visitor to a variant';

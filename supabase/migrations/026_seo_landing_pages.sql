-- SEO Landing Pages for WordPress Migration
-- Stores hundreds of thousands of position/location combination pages

CREATE TABLE seo_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL components (extracted from WordPress URL pattern)
  position TEXT NOT NULL,           -- "butler", "chef", "captain"
  position_slug TEXT NOT NULL,      -- "butler" (URL-safe)
  country TEXT NOT NULL,            -- "Australia"
  country_slug TEXT NOT NULL,       -- "australia"
  state TEXT,                       -- "New South Wales"
  state_slug TEXT,                  -- "new-south-wale"
  city TEXT,                        -- "Sydney"
  city_slug TEXT,                   -- "sydney-2"

  -- Original WordPress URL path (for exact matching)
  original_url_path TEXT NOT NULL UNIQUE,  -- "hire-a-butler-australia/new-south-wale/sydney-2"

  -- SEO metadata
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  canonical_url TEXT,

  -- Page content
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  intro_content TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,

  -- Lead generation
  form_heading TEXT DEFAULT 'Ready to hire your next rare talent?',
  cta_text TEXT DEFAULT 'Receive candidates today',

  -- Status and timestamps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Optimized indexes for fast URL lookups (critical for hundreds of thousands of pages)
CREATE INDEX idx_seo_pages_url_path ON seo_landing_pages(original_url_path);
CREATE INDEX idx_seo_pages_position ON seo_landing_pages(position_slug);
CREATE INDEX idx_seo_pages_country ON seo_landing_pages(country_slug);
CREATE INDEX idx_seo_pages_location ON seo_landing_pages(country_slug, state_slug, city_slug);
CREATE INDEX idx_seo_pages_active ON seo_landing_pages(is_active) WHERE is_active = true;

-- Full-text search index for content
CREATE INDEX idx_seo_pages_search ON seo_landing_pages USING gin(
  to_tsvector('english', coalesce(position, '') || ' ' || coalesce(city, '') || ' ' || coalesce(country, ''))
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_seo_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_pages_updated_at
  BEFORE UPDATE ON seo_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_pages_updated_at();

-- RLS policies (public read, authenticated write)
ALTER TABLE seo_landing_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active pages (public SEO content)
CREATE POLICY "Public can read active SEO pages"
  ON seo_landing_pages
  FOR SELECT
  USING (is_active = true);

-- Only service role can insert/update/delete (migration scripts, admin)
CREATE POLICY "Service role can manage SEO pages"
  ON seo_landing_pages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inquiry submissions table
CREATE TABLE seo_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Inquiry details
  position_needed TEXT,
  location TEXT,
  message TEXT,

  -- Source tracking
  landing_page_id UUID REFERENCES seo_landing_pages(id),
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inquiries_status ON seo_inquiries(status);
CREATE INDEX idx_inquiries_created ON seo_inquiries(created_at DESC);
CREATE INDEX idx_inquiries_email ON seo_inquiries(email);

-- RLS for inquiries
ALTER TABLE seo_inquiries ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read inquiries
CREATE POLICY "Authenticated users can read inquiries"
  ON seo_inquiries
  FOR SELECT
  TO authenticated
  USING (true);

-- Public can insert inquiries (form submissions)
CREATE POLICY "Public can submit inquiries"
  ON seo_inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role can manage inquiries"
  ON seo_inquiries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for inquiries updated_at
CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON seo_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_pages_updated_at();

COMMENT ON TABLE seo_landing_pages IS 'WordPress migrated SEO landing pages - hundreds of thousands of position/location combinations';
COMMENT ON TABLE seo_inquiries IS 'Lead form submissions from SEO landing pages';

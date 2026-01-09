-- URL Redirects table for SEO migration from WordPress
-- Stores redirect mappings from old WordPress URLs to new Next.js URLs

CREATE TABLE url_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Old URL path (from WordPress, without domain)
  old_url_path TEXT NOT NULL UNIQUE,

  -- New URL path destination
  new_url_path TEXT NOT NULL,

  -- Redirect type (301 = permanent, 302 = temporary)
  redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302, 307, 308)),

  -- Content type for categorization
  content_type TEXT CHECK (content_type IN ('landing_page', 'blog_post', 'static_page', 'external', 'other')),

  -- Source tracking (where this redirect came from)
  source TEXT DEFAULT 'wordpress_migration',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Analytics
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups (most important)
CREATE INDEX idx_redirects_old_url ON url_redirects(old_url_path) WHERE is_active = true;

-- Additional indexes for admin queries
CREATE INDEX idx_redirects_content_type ON url_redirects(content_type);
CREATE INDEX idx_redirects_source ON url_redirects(source);
CREATE INDEX idx_redirects_hit_count ON url_redirects(hit_count DESC);

-- Updated at trigger (using existing function)
CREATE TRIGGER update_url_redirects_updated_at
  BEFORE UPDATE ON url_redirects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE url_redirects ENABLE ROW LEVEL SECURITY;

-- Public can read active redirects (needed for middleware)
CREATE POLICY "Public can read active redirects"
  ON url_redirects FOR SELECT
  USING (is_active = true);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role manages redirects"
  ON url_redirects FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Function to increment hit count (called from middleware)
CREATE OR REPLACE FUNCTION increment_redirect_hit(path TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE url_redirects
  SET
    hit_count = hit_count + 1,
    last_hit_at = now()
  WHERE old_url_path = path AND is_active = true;
END;
$$;

-- Grant execute to anon for middleware calls
GRANT EXECUTE ON FUNCTION increment_redirect_hit(TEXT) TO anon;

-- Comment on table
COMMENT ON TABLE url_redirects IS 'Stores URL redirect mappings for SEO migration from WordPress to Next.js';

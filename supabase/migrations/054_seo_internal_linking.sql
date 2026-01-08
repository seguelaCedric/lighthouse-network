-- SEO Internal Linking Tables
-- Supports related pages, content hub links, and topic clusters

-- Related pages table for internal linking between landing pages
CREATE TABLE seo_page_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES seo_landing_pages(id) ON DELETE CASCADE,
  related_page_id UUID NOT NULL REFERENCES seo_landing_pages(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'same_position',      -- Same position, different location
    'same_location',      -- Same location, different position
    'related_position',   -- Related positions (e.g., chef and sous chef)
    'related_location'    -- Related locations (e.g., nearby cities)
  )),
  priority INTEGER DEFAULT 0, -- Higher priority shown first
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate relationships
  UNIQUE(page_id, related_page_id, relationship_type)
);

-- Indexes for performance
CREATE INDEX idx_seo_page_relationships_page ON seo_page_relationships(page_id);
CREATE INDEX idx_seo_page_relationships_related ON seo_page_relationships(related_page_id);
CREATE INDEX idx_seo_page_relationships_type ON seo_page_relationships(relationship_type);
CREATE INDEX idx_seo_page_relationships_priority ON seo_page_relationships(page_id, priority DESC);

-- Content hub links (blog posts, guides, etc.)
-- Links blog posts to existing landing pages using original_url_path
CREATE TABLE seo_content_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES seo_landing_pages(id) ON DELETE CASCADE,
  landing_page_url TEXT, -- original_url_path from seo_landing_pages (e.g., "hire-a-butler-australia/new-south-wale/sydney-2")
  blog_post_id UUID, -- Will reference blog_posts(id) once that table exists
  content_type TEXT NOT NULL CHECK (content_type IN (
    'blog_post',
    'salary_guide',
    'hiring_guide',
    'case_study',
    'faq'
  )),
  title TEXT NOT NULL,
  url TEXT NOT NULL, -- Full URL or relative path
  description TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure we have either landing_page_url or blog_post_id
  CONSTRAINT seo_content_links_target_check CHECK (
    (landing_page_url IS NOT NULL) OR (blog_post_id IS NOT NULL)
  )
);

-- Indexes for content links
CREATE INDEX idx_seo_content_links_page ON seo_content_links(page_id);
CREATE INDEX idx_seo_content_links_url ON seo_content_links(landing_page_url);
CREATE INDEX idx_seo_content_links_blog_post ON seo_content_links(blog_post_id) WHERE blog_post_id IS NOT NULL;
CREATE INDEX idx_seo_content_links_type ON seo_content_links(content_type);
CREATE INDEX idx_seo_content_links_priority ON seo_content_links(page_id, priority DESC);

-- RLS Policies
ALTER TABLE seo_page_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content_links ENABLE ROW LEVEL SECURITY;

-- Public can read relationships and content links
CREATE POLICY "Public can read page relationships"
  ON seo_page_relationships FOR SELECT
  USING (true);

CREATE POLICY "Public can read content links"
  ON seo_content_links FOR SELECT
  USING (true);

-- Authenticated users can manage relationships and content links
CREATE POLICY "Agency users can manage page relationships"
  ON seo_page_relationships FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Agency users can manage content links"
  ON seo_content_links FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role can manage page relationships"
  ON seo_page_relationships FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage content links"
  ON seo_content_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE seo_page_relationships IS 'Internal linking relationships between SEO landing pages';
COMMENT ON TABLE seo_content_links IS 'Links to blog posts and guides from landing pages';


-- Create seo_content_links table for blog-to-blog content cluster linking
-- This table powers the "Continue Reading" and "Learn More" sections on blog posts
-- Core principle: Blog posts link to OTHER blog posts (not landing pages)

CREATE TABLE IF NOT EXISTS public.seo_content_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Source blog post (the post displaying the link)
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,

  -- Link details
  title TEXT NOT NULL, -- Display title (e.g., "Complete Guide to Hiring a Personal Assistant")
  url TEXT NOT NULL, -- Destination URL (e.g., "/blog/complete-guide-hiring-personal-assistant")
  description TEXT, -- Optional short description/excerpt

  -- Content classification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'interview_questions',
    'hiring_guide',
    'salary_guide',
    'what_to_look_for',
    'onboarding_guide',
    'position_overview',
    'career_path',
    'skills_required',
    'case_study',
    'location_insights',
    'faq'
  )),

  -- Optional relationship to target blog post (if linking to another blog post in the system)
  target_blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,

  -- Optional relationship to landing page (if the link goes to a landing page)
  landing_page_id UUID REFERENCES public.seo_landing_pages(id) ON DELETE CASCADE,

  -- Priority for ordering (higher = shown first)
  priority INTEGER NOT NULL DEFAULT 0,

  -- Enable/disable link
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_seo_content_links_blog_post_id ON public.seo_content_links(blog_post_id);
CREATE INDEX idx_seo_content_links_target_blog_post_id ON public.seo_content_links(target_blog_post_id);
CREATE INDEX idx_seo_content_links_landing_page_id ON public.seo_content_links(landing_page_id);
CREATE INDEX idx_seo_content_links_content_type ON public.seo_content_links(content_type);
CREATE INDEX idx_seo_content_links_priority ON public.seo_content_links(priority DESC);

-- Enable Row Level Security
ALTER TABLE public.seo_content_links ENABLE ROW LEVEL SECURITY;

-- Public read access (anonymous users can see content links)
CREATE POLICY "Public read access for seo_content_links"
  ON public.seo_content_links
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Admin write access
CREATE POLICY "Admin write access for seo_content_links"
  ON public.seo_content_links
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_seo_content_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_content_links_updated_at_trigger
  BEFORE UPDATE ON public.seo_content_links
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_content_links_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.seo_content_links IS 'Blog-to-blog content cluster linking for "Continue Reading" sections. Powers the user-centric content flow: Discovery → Education (2-3 articles) → Conversion';
COMMENT ON COLUMN public.seo_content_links.blog_post_id IS 'Source blog post displaying the link';
COMMENT ON COLUMN public.seo_content_links.title IS 'Link display title shown to users';
COMMENT ON COLUMN public.seo_content_links.url IS 'Destination URL (usually /blog/slug)';
COMMENT ON COLUMN public.seo_content_links.content_type IS 'Type of content for filtering and grouping';
COMMENT ON COLUMN public.seo_content_links.priority IS 'Display order (higher first)';
COMMENT ON COLUMN public.seo_content_links.target_blog_post_id IS 'Optional: ID of target blog post (for bidirectional linking)';
COMMENT ON COLUMN public.seo_content_links.landing_page_id IS 'Optional: ID of landing page (minimal usage - blog posts should link to blog posts)';

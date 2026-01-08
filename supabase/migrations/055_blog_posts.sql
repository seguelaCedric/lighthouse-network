-- Blog posts table for AI-generated content
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL, -- Markdown or HTML
  meta_title TEXT,
  meta_description TEXT,
  
  -- SEO & Targeting
  target_position TEXT, -- e.g., "butler", "chef"
  target_location TEXT, -- e.g., "sydney", "new-york"
  target_keywords TEXT[], -- Array of keywords
  primary_keyword TEXT, -- Main keyword for SEO
  
  -- Content Type & Template
  content_type TEXT CHECK (content_type IN (
    -- Employer-focused content
    'hiring_guide', -- "Complete Guide to Hiring a [Position]"
    'salary_guide', -- "Salary Guide: [Position] in [Location]"
    'interview_questions', -- "Top Interview Questions for [Position]"
    'what_to_look_for', -- "What to Look for in a [Position]"
    'onboarding_guide', -- "Onboarding Your New [Position]"
    'retention_strategy', -- "Retaining Top [Position] Talent"
    'legal_requirements', -- "Legal Requirements for Hiring [Position] in [Location]"
    -- Candidate-focused content
    'position_overview', -- "What Does a [Position] Do? Job Description"
    'career_path', -- "Career Path for [Position]"
    'skills_required', -- "Skills Required to Become a [Position]"
    'certifications', -- "Certifications for [Position]"
    -- General content
    'location_insights', -- "Hiring [Position] in [Location]: Market Insights"
    'case_study', -- "Success Story: Finding a [Position] in [Location]"
    'faq_expansion' -- Extended FAQ content
  )),
  target_audience TEXT CHECK (target_audience IN ('employer', 'candidate', 'both')) DEFAULT 'both',
  template_type TEXT, -- Template used for generation
  
  -- AI Generation Metadata
  ai_model TEXT, -- e.g., "gpt-4", "claude-3"
  ai_prompt TEXT, -- Prompt used for generation
  generation_params JSONB, -- Temperature, max_tokens, etc.
  generated_at TIMESTAMPTZ,
  generated_by UUID REFERENCES users(id),
  
  -- Editorial Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'ai_generated',
    'needs_review',
    'in_editing',
    'approved',
    'published',
    'archived'
  )),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Internal Linking (using original_url_path for existing pages)
  related_landing_page_urls TEXT[], -- Array of original_url_path values (e.g., "hire-a-butler-australia/new-south-wale/sydney-2")
  related_blog_posts UUID[], -- Array of other blog_post IDs
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  engagement_score NUMERIC, -- Calculated from views, time on page, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_position ON blog_posts(target_position);
CREATE INDEX idx_blog_posts_location ON blog_posts(target_location);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_audience ON blog_posts(target_audience);
CREATE INDEX idx_blog_posts_content_type ON blog_posts(content_type);

-- Full-text search index
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(excerpt, ''))
);

-- Index for related landing pages lookup
CREATE INDEX idx_blog_posts_landing_pages ON blog_posts USING gin(related_landing_page_urls);

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can manage posts
CREATE POLICY "Agency users can manage blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role can manage blog posts"
  ON blog_posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

COMMENT ON TABLE blog_posts IS 'AI-generated blog posts for SEO and content marketing';
COMMENT ON COLUMN blog_posts.related_landing_page_urls IS 'Array of original_url_path values from seo_landing_pages table for internal linking';
COMMENT ON COLUMN blog_posts.target_audience IS 'Target audience: employer, candidate, or both';


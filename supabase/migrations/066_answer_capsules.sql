-- Answer Capsules for AI/LLM Search Optimization
-- Based on SE Ranking research: 90%+ of ChatGPT-cited pages have answer capsules
-- These are link-free, quotable answer blocks that LLMs can easily extract

-- Add answer capsule fields to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS answer_capsule TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS answer_capsule_question TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS key_facts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS last_updated_display TIMESTAMPTZ;

-- Add answer capsule fields to seo_landing_pages
ALTER TABLE seo_landing_pages ADD COLUMN IF NOT EXISTS answer_capsule TEXT;
ALTER TABLE seo_landing_pages ADD COLUMN IF NOT EXISTS answer_capsule_question TEXT;
ALTER TABLE seo_landing_pages ADD COLUMN IF NOT EXISTS key_facts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE seo_landing_pages ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN blog_posts.answer_capsule IS 'Link-free, quotable answer block (2-3 sentences, <100 words) for AI/LLM search optimization';
COMMENT ON COLUMN blog_posts.answer_capsule_question IS 'The question being answered, used in structured data and H2 headings';
COMMENT ON COLUMN blog_posts.key_facts IS 'Array of 3-5 key facts as bullet points for quick scanning';
COMMENT ON COLUMN blog_posts.last_updated_display IS 'Visible "Last updated" date for freshness signals (separate from updated_at for editorial control)';

COMMENT ON COLUMN seo_landing_pages.answer_capsule IS 'Link-free, quotable answer block for AI/LLM search optimization';
COMMENT ON COLUMN seo_landing_pages.answer_capsule_question IS 'The question being answered (e.g., "How do I hire a butler in London?")';
COMMENT ON COLUMN seo_landing_pages.key_facts IS 'Array of key facts about hiring this position in this location';
COMMENT ON COLUMN seo_landing_pages.last_reviewed_at IS 'Date when content was last reviewed/verified for accuracy';

-- Index for finding pages without answer capsules (for bulk updates)
CREATE INDEX IF NOT EXISTS idx_blog_posts_no_capsule
  ON blog_posts(id)
  WHERE answer_capsule IS NULL AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_seo_pages_no_capsule
  ON seo_landing_pages(id)
  WHERE answer_capsule IS NULL AND is_active = true;

-- Index for freshness tracking (find stale content)
CREATE INDEX IF NOT EXISTS idx_blog_posts_stale
  ON blog_posts(last_updated_display)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_seo_pages_stale
  ON seo_landing_pages(last_reviewed_at)
  WHERE is_active = true;

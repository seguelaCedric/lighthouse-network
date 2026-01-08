-- Add scheduling fields to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN scheduled_generate_at TIMESTAMPTZ,
ADD COLUMN scheduled_publish_at TIMESTAMPTZ;

-- Indexes for efficient scheduled post queries
CREATE INDEX idx_blog_posts_scheduled_generate ON blog_posts(scheduled_generate_at) 
  WHERE scheduled_generate_at IS NOT NULL AND status = 'draft';

CREATE INDEX idx_blog_posts_scheduled_publish ON blog_posts(scheduled_publish_at) 
  WHERE scheduled_publish_at IS NOT NULL AND status != 'published';

COMMENT ON COLUMN blog_posts.scheduled_generate_at IS 'Scheduled date/time to generate AI content for this post';
COMMENT ON COLUMN blog_posts.scheduled_publish_at IS 'Scheduled date/time to publish this post';

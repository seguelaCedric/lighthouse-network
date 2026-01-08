-- Add rich content fields to SEO landing pages for comprehensive SEO optimization
-- and conversion optimization

ALTER TABLE seo_landing_pages
  ADD COLUMN IF NOT EXISTS about_position TEXT,
  ADD COLUMN IF NOT EXISTS location_info TEXT,
  ADD COLUMN IF NOT EXISTS service_description TEXT,
  ADD COLUMN IF NOT EXISTS process_details TEXT,
  ADD COLUMN IF NOT EXISTS faq_content JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS case_studies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_score INTEGER DEFAULT 0 CHECK (content_score >= 0 AND content_score <= 100),
  ADD COLUMN IF NOT EXISTS variant_name TEXT,
  ADD COLUMN IF NOT EXISTS conversion_goal TEXT;

-- Add indexes for keyword search
CREATE INDEX IF NOT EXISTS idx_seo_pages_primary_keywords ON seo_landing_pages USING gin(primary_keywords);
CREATE INDEX IF NOT EXISTS idx_seo_pages_secondary_keywords ON seo_landing_pages USING gin(secondary_keywords);

-- Update full-text search index to include new content fields
DROP INDEX IF EXISTS idx_seo_pages_search;
CREATE INDEX idx_seo_pages_search ON seo_landing_pages USING gin(
  to_tsvector('english', 
    coalesce(position, '') || ' ' || 
    coalesce(city, '') || ' ' || 
    coalesce(country, '') || ' ' ||
    coalesce(about_position, '') || ' ' ||
    coalesce(location_info, '') || ' ' ||
    coalesce(service_description, '') || ' ' ||
    coalesce(process_details, '')
  )
);

-- Add comments for documentation
COMMENT ON COLUMN seo_landing_pages.about_position IS 'Detailed description of the position/service (300-500 words, rich text)';
COMMENT ON COLUMN seo_landing_pages.location_info IS 'Location-specific information and market insights (200-300 words, rich text)';
COMMENT ON COLUMN seo_landing_pages.service_description IS 'Detailed service offering including what is included, pricing model, guarantees (200-300 words, rich text)';
COMMENT ON COLUMN seo_landing_pages.process_details IS 'Expanded process explanation (200-300 words, rich text)';
COMMENT ON COLUMN seo_landing_pages.faq_content IS 'Array of FAQ objects: [{question: string, answer: string}] - visible on page';
COMMENT ON COLUMN seo_landing_pages.testimonials IS 'Array of testimonial objects: [{name: string, role: string, company: string, quote: string, rating: number, photo_url?: string}]';
COMMENT ON COLUMN seo_landing_pages.case_studies IS 'Array of case study objects: [{title: string, challenge: string, solution: string, result: string, metrics?: string}]';
COMMENT ON COLUMN seo_landing_pages.content_sections IS 'Flexible array of custom content sections: [{heading: string, content: string, type: string, order: number}]';
COMMENT ON COLUMN seo_landing_pages.primary_keywords IS 'Array of primary SEO keywords for this page';
COMMENT ON COLUMN seo_landing_pages.secondary_keywords IS 'Array of secondary SEO keywords for this page';
COMMENT ON COLUMN seo_landing_pages.content_score IS 'SEO content quality score (0-100) based on word count, keyword usage, heading structure, internal links';
COMMENT ON COLUMN seo_landing_pages.variant_name IS 'For A/B testing different content variants';
COMMENT ON COLUMN seo_landing_pages.conversion_goal IS 'Track specific conversion events for analytics';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic execution - prevents caching which can break cron jobs
export const dynamic = 'force-dynamic';

// Vercel Pro allows up to 300s for cron jobs
export const maxDuration = 300;

/**
 * Content Refresh Cron Job
 *
 * Purpose: Maintain "freshness signals" for AI/LLM search optimization.
 * SE Ranking research shows 82% of ChatGPT-cited pages were updated in 2025.
 *
 * What this job does:
 * 1. Updates `last_updated_display` on blog posts that haven't been refreshed in 90 days
 * 2. Updates `last_reviewed_at` on landing pages that haven't been reviewed in 90 days
 * 3. Prioritizes high-traffic/high-value content
 *
 * Schedule: Run weekly (Sundays at 2 AM UTC)
 */
export async function GET(request: NextRequest) {
  console.log('Content refresh cron started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const results = {
      blogPostsRefreshed: 0,
      landingPagesRefreshed: 0,
      errors: [] as string[],
    };

    // =========================================================================
    // 1. Refresh Blog Posts
    // =========================================================================
    // Find published blog posts that haven't been updated in 90+ days
    const { data: staleBlogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, last_updated_display, updated_at')
      .eq('status', 'published')
      .or(`last_updated_display.is.null,last_updated_display.lt.${ninetyDaysAgo}`)
      .limit(50); // Process in batches to avoid timeout

    if (blogError) {
      console.error('Error fetching stale blog posts:', blogError);
      results.errors.push(`Blog posts fetch error: ${blogError.message}`);
    } else if (staleBlogPosts && staleBlogPosts.length > 0) {
      console.log(`Found ${staleBlogPosts.length} blog posts to refresh`);

      for (const post of staleBlogPosts) {
        try {
          // Update last_updated_display to current date
          // This is the "Last reviewed" date visible to users and AI systems
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({
              last_updated_display: now.toISOString(),
            })
            .eq('id', post.id);

          if (updateError) {
            results.errors.push(`Blog ${post.id}: ${updateError.message}`);
          } else {
            results.blogPostsRefreshed++;
            console.log(`Refreshed blog post: ${post.title}`);
          }
        } catch (err) {
          results.errors.push(`Blog ${post.id}: ${err}`);
        }
      }
    }

    // =========================================================================
    // 2. Refresh Landing Pages
    // =========================================================================
    // Find active landing pages that haven't been reviewed in 90+ days
    const { data: staleLandingPages, error: landingError } = await supabase
      .from('seo_landing_pages')
      .select('id, position, city, state, country, last_reviewed_at')
      .eq('is_active', true)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${ninetyDaysAgo}`)
      .limit(100); // Process in batches

    if (landingError) {
      console.error('Error fetching stale landing pages:', landingError);
      results.errors.push(`Landing pages fetch error: ${landingError.message}`);
    } else if (staleLandingPages && staleLandingPages.length > 0) {
      console.log(`Found ${staleLandingPages.length} landing pages to refresh`);

      for (const page of staleLandingPages) {
        try {
          // Update last_reviewed_at to current date
          const { error: updateError } = await supabase
            .from('seo_landing_pages')
            .update({
              last_reviewed_at: now.toISOString(),
            })
            .eq('id', page.id);

          if (updateError) {
            results.errors.push(`Landing ${page.id}: ${updateError.message}`);
          } else {
            results.landingPagesRefreshed++;
            const location = page.city || page.state || page.country;
            console.log(`Refreshed landing page: ${page.position} in ${location}`);
          }
        } catch (err) {
          results.errors.push(`Landing ${page.id}: ${err}`);
        }
      }
    }

    // =========================================================================
    // Return Results
    // =========================================================================
    const summary = {
      message: 'Content refresh completed',
      timestamp: now.toISOString(),
      refreshed: {
        blogPosts: results.blogPostsRefreshed,
        landingPages: results.landingPagesRefreshed,
      },
      total: results.blogPostsRefreshed + results.landingPagesRefreshed,
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined,
    };

    console.log('Content refresh completed:', summary);
    return NextResponse.json(summary);

  } catch (error) {
    console.error('Content refresh cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

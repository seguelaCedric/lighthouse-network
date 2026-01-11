import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic execution - prevents caching which can break cron jobs
export const dynamic = 'force-dynamic';

// Vercel Pro allows up to 300s for cron jobs
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Note: Vercel crons are protected by infrastructure - only Vercel can call them
  console.log('Blog post publish cron started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date().toISOString();

    // Find posts scheduled for publishing
    const { data: postsToPublish, error } = await supabase
      .from('blog_posts')
      .select('*')
      .not('status', 'eq', 'published')
      .not('scheduled_publish_at', 'is', null)
      .lte('scheduled_publish_at', now);

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      return NextResponse.json({ message: 'No posts scheduled for publishing', processed: 0 });
    }

    // Publish each post
    const processed = [];
    for (const post of postsToPublish) {
      try {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            status: 'published',
            published_at: now,
            scheduled_publish_at: null,
          })
          .eq('id', post.id);

        if (!updateError) {
          processed.push(post.id);
        } else {
          console.error(`Error publishing post ${post.id}:`, updateError);
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Published ${processed.length} of ${postsToPublish.length} scheduled posts`,
      processed: processed.length,
      postIds: processed,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

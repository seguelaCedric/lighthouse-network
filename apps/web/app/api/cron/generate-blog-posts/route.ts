import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic execution - prevents caching which can break cron jobs
export const dynamic = 'force-dynamic';

// Vercel Pro allows up to 300s for cron jobs
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Note: Vercel crons are protected by infrastructure - only Vercel can call them
  console.log('Blog post generation cron started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date().toISOString();

    // Find posts scheduled for generation that haven't been generated yet
    const { data: postsToGenerate, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'draft')
      .not('scheduled_generate_at', 'is', null)
      .lte('scheduled_generate_at', now);

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
    }

    if (!postsToGenerate || postsToGenerate.length === 0) {
      return NextResponse.json({ message: 'No posts scheduled for generation', processed: 0 });
    }

    // Process each post (in production, you'd queue these for background processing)
    const processed = [];
    for (const post of postsToGenerate) {
      try {
        // Call the generation endpoint
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';
        const generateResponse = await fetch(`${baseUrl}/api/blog-posts/${post.id}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            contentType: post.content_type || 'hiring_guide',
            targetAudience: post.target_audience || 'both',
            position: post.target_position,
            location: post.target_location,
            primaryKeyword: post.primary_keyword || post.title,
            targetWordCount: 2000,
          }),
        });

        if (generateResponse.ok) {
          // Clear the scheduled time
          await supabase
            .from('blog_posts')
            .update({ scheduled_generate_at: null })
            .eq('id', post.id);

          processed.push(post.id);
        }
      } catch (error) {
        console.error(`Error generating post ${post.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processed ${processed.length} of ${postsToGenerate.length} scheduled posts`,
      processed: processed.length,
      postIds: processed,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

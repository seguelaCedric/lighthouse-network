import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bulkCreateSchema = z.object({
  items: z.array(
    z.object({
      position: z.string().optional(),
      location: z.string().optional(),
      content_type: z.string(),
      target_audience: z.enum(['employer', 'candidate', 'both']),
      primary_keyword: z.string(),
      target_word_count: z.number().min(500).max(5000).optional(),
      custom_instructions: z.string().optional(),
    })
  ).min(1).max(100), // Limit to 100 at a time
});

// POST - Create multiple blog posts in bulk
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validated = bulkCreateSchema.parse(body);

    // Create draft posts first (don't generate yet)
    const postsToCreate = validated.items.map((item) => ({
      title: `Draft - ${item.primary_keyword}`,
      slug: item.primary_keyword.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      content: 'Pending generation...',
      content_type: item.content_type,
      target_audience: item.target_audience,
      target_position: item.position || null,
      target_location: item.location || null,
      primary_keyword: item.primary_keyword,
      status: 'draft',
      // Store generation params for later
      generation_params: {
        contentType: item.content_type,
        targetAudience: item.target_audience,
        position: item.position,
        location: item.location,
        primaryKeyword: item.primary_keyword,
        targetWordCount: item.target_word_count || 2000,
        customInstructions: item.custom_instructions,
      },
    }));

    // Insert in batches to avoid overwhelming the database
    const batchSize = 20;
    const createdPosts = [];

    for (let i = 0; i < postsToCreate.length; i += batchSize) {
      const batch = postsToCreate.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(batch)
        .select();

      if (error) {
        console.error('Bulk create error:', error);
        return NextResponse.json(
          { error: `Failed to create posts at batch ${Math.floor(i / batchSize) + 1}` },
          { status: 500 }
        );
      }

      createdPosts.push(...(data || []));
    }

    return NextResponse.json({
      success: true,
      created: createdPosts.length,
      posts: createdPosts,
      message: `${createdPosts.length} draft posts created. You can generate them individually or use the scheduled generation feature.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Bulk blog POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

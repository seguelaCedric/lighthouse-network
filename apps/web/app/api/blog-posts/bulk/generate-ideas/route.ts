import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentIdeas, type IdeaGenerationParams } from '@lighthouse/ai';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  positions: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  targetAudience: z.enum(['employer', 'candidate', 'both']).optional(),
  contentTypes: z.array(z.string()).optional(),
  maxIdeas: z.number().min(1).max(50).optional(),
  focus: z.enum(['gaps', 'trends', 'competitors', 'keywords', 'all']).optional(),
  customPrompt: z.string().optional(),
});

// POST - Generate content ideas using AI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validated = generateIdeasSchema.parse(body);

    // Fetch existing landing pages for context
    const { data: landingPages } = await supabase
      .from('seo_landing_pages')
      .select('position, country, state, city')
      .eq('is_active', true)
      .limit(1000); // Get a good sample

    // Fetch existing blog posts to identify gaps
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('target_position, target_location, content_type')
      .limit(500);

    // Build location data from landing pages
    const landingPageData = (landingPages || []).map((page) => ({
      position: page.position,
      location: [page.city, page.state, page.country].filter(Boolean).join(', '),
      country: page.country,
      state: page.state,
      city: page.city,
    }));

    // Generate ideas
    const params: IdeaGenerationParams = {
      positions: validated.positions,
      locations: validated.locations,
      targetAudience: validated.targetAudience,
      contentTypes: validated.contentTypes as any,
      maxIdeas: validated.maxIdeas || 20,
      focus: validated.focus || 'all',
      customPrompt: validated.customPrompt,
      existingLandingPages: landingPageData,
      existingBlogPosts: (blogPosts || []).map((post) => ({
        target_position: post.target_position,
        target_location: post.target_location,
        content_type: post.content_type,
      })),
    };

    const ideas = await generateContentIdeas(params);

    return NextResponse.json({
      success: true,
      ideas,
      count: ideas.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Generate ideas error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}

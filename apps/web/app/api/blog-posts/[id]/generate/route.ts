import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBlogPost, mapBlogPostToLandingPages, type BlogGenerationParams } from '@lighthouse/ai';
import { z } from 'zod';

const generateSchema = z.object({
  contentType: z.string(),
  targetAudience: z.enum(['employer', 'candidate', 'both']),
  position: z.string().optional(),
  location: z.string().optional(),
  primaryKeyword: z.string().min(1),
  targetWordCount: z.number().min(500).max(5000).optional(),
  customInstructions: z.string().optional(),
});

// POST - Generate blog post with AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const validated = generateSchema.parse(body);

    // Get current user for generated_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map to landing pages if position and location provided
    let relatedLandingPageUrls: string[] = [];
    if (validated.position && validated.location) {
      relatedLandingPageUrls = await mapBlogPostToLandingPages(
        validated.position,
        validated.location,
        supabase
      );
    }

    // Generate blog post
    const generated = await generateBlogPost({
      contentType: validated.contentType as BlogGenerationParams['contentType'],
      targetAudience: validated.targetAudience,
      position: validated.position,
      location: validated.location,
      primaryKeyword: validated.primaryKeyword,
      targetWordCount: validated.targetWordCount || 2000,
      relatedLandingPageUrls,
      customInstructions: validated.customInstructions,
    });

    // Update blog post with generated content
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: generated.content,
        meta_title: generated.metaTitle,
        meta_description: generated.metaDescription,
        target_keywords: generated.targetKeywords,
        related_landing_page_urls: generated.relatedLandingPageUrls,
        status: 'ai_generated',
        ai_model: 'claude-sonnet-4-20250514',
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Blog post generation update error:', error);
      return NextResponse.json({ error: 'Failed to update blog post with generated content' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Blog post generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const blogPostUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  target_position: z.string().optional(),
  target_location: z.string().optional(),
  target_keywords: z.array(z.string()).optional(),
  primary_keyword: z.string().optional(),
  content_type: z.string().optional(),
  target_audience: z.enum(['employer', 'candidate', 'both']).optional(),
  template_type: z.string().optional(),
  related_landing_page_urls: z.array(z.string()).optional(),
  related_blog_posts: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'ai_generated', 'needs_review', 'in_editing', 'approved', 'published', 'archived']).optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.string().optional(),
  published_at: z.string().optional(),
  scheduled_generate_at: z.string().nullable().optional(),
  scheduled_publish_at: z.string().nullable().optional(),
});

// GET - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }
      console.error('Blog post fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Blog post GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const validated = blogPostUpdateSchema.parse(body);

    // Handle published_at timestamp
    const updateData: any = { ...validated };
    if (validated.status === 'published' && !validated.published_at) {
      updateData.published_at = new Date().toISOString();
    }
    if (validated.status === 'needs_review' && validated.reviewed_by) {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Blog post update error:', error);
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Blog post PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Blog post delete error:', error);
      return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blog post DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


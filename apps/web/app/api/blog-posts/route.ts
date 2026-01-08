import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const blogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
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
});

// GET - List blog posts with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const contentType = searchParams.get('content_type');
    const targetAudience = searchParams.get('target_audience');
    const position = searchParams.get('position');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (targetAudience) {
      query = query.eq('target_audience', targetAudience);
    }

    if (position) {
      query = query.eq('target_position', position);
    }

    if (location) {
      query = query.eq('target_location', location);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Blog posts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    }

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Blog posts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const validated = blogPostSchema.parse(body);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...validated,
        status: validated.status || 'draft',
        target_audience: validated.target_audience || 'both',
      })
      .select()
      .single();

    if (error) {
      console.error('Blog post create error:', error);
      return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Blog post POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updatePageSchema = z.object({
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  canonical_url: z.string().optional(),
  hero_headline: z.string().optional(),
  hero_subheadline: z.string().optional(),
  intro_content: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  form_heading: z.string().optional(),
  cta_text: z.string().optional(),
  is_active: z.boolean().optional(),
  // Rich content fields
  about_position: z.string().optional(),
  location_info: z.string().optional(),
  service_description: z.string().optional(),
  process_details: z.string().optional(),
  faq_content: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  testimonials: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    quote: z.string(),
    rating: z.number().min(1).max(5).optional(),
    photo_url: z.string().optional(),
  })).optional(),
  case_studies: z.array(z.object({
    title: z.string(),
    challenge: z.string(),
    solution: z.string(),
    result: z.string(),
    metrics: z.string().optional(),
  })).optional(),
  content_sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    type: z.string(),
    order: z.number(),
  })).optional(),
  primary_keywords: z.array(z.string()).optional(),
  secondary_keywords: z.array(z.string()).optional(),
  content_score: z.number().min(0).max(100).optional(),
  variant_name: z.string().optional(),
  conversion_goal: z.string().optional(),
});

// GET - Get single SEO landing page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seo_landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('SEO page fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch SEO page' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get inquiry count
    const { count } = await supabase
      .from('seo_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('landing_page_id', id);

    return NextResponse.json({
      ...data,
      inquiry_count: count || 0,
    });
  } catch (error) {
    console.error('SEO page GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update SEO landing page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    console.log('PATCH /api/seo-pages - Received body keys:', Object.keys(body));

    const validated = updatePageSchema.parse(body);

    // Convert arrays and JSONB fields
    const updateData: any = { ...validated };
    if (validated.benefits) {
      updateData.benefits = validated.benefits;
    }
    if (validated.faq_content) {
      updateData.faq_content = validated.faq_content;
    }
    if (validated.testimonials) {
      updateData.testimonials = validated.testimonials;
    }
    if (validated.case_studies) {
      updateData.case_studies = validated.case_studies;
    }
    if (validated.content_sections) {
      updateData.content_sections = validated.content_sections;
    }
    if (validated.primary_keywords) {
      updateData.primary_keywords = validated.primary_keywords;
    }
    if (validated.secondary_keywords) {
      updateData.secondary_keywords = validated.secondary_keywords;
    }

    console.log('PATCH /api/seo-pages - Update data keys:', Object.keys(updateData));

    const { data, error } = await supabase
      .from('seo_landing_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('SEO page update error:', error);
      console.error('SEO page update error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({
        error: 'Failed to update SEO page',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('SEO page PATCH error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

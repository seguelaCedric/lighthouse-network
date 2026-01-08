import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateInquirySchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'closed']).optional(),
  notes: z.string().optional(),
});

// GET - Get single inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seo_inquiries')
      .select(`
        *,
        landing_page:seo_landing_pages(
          id,
          position,
          country,
          state,
          city,
          original_url_path
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Inquiry fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Inquiry GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update inquiry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const validated = updateInquirySchema.parse(body);

    const { data, error } = await supabase
      .from('seo_inquiries')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Inquiry update error:', error);
      return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Inquiry PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('seo_inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Inquiry delete error:', error);
      return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inquiry DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

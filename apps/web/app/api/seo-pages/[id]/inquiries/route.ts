import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get inquiries for a specific SEO landing page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('seo_inquiries')
      .select('*', { count: 'exact' })
      .eq('landing_page_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Inquiries fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
    }

    return NextResponse.json({
      inquiries: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Inquiries GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

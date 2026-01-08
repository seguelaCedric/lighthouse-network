import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List SEO landing pages with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const position = searchParams.get('position');
    const country = searchParams.get('country');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('seo_landing_pages')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (position) {
      query = query.eq('position_slug', position);
    }

    if (country) {
      query = query.eq('country_slug', country);
    }

    if (state) {
      query = query.eq('state_slug', state);
    }

    if (city) {
      query = query.eq('city_slug', city);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(
        `position.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%,original_url_path.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('SEO pages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch SEO pages' }, { status: 500 });
    }

    // Get inquiry counts for each page
    const pageIds = (data || []).map((page) => page.id);
    let inquiryCounts: Record<string, number> = {};

    if (pageIds.length > 0) {
      const { data: inquiries } = await supabase
        .from('seo_inquiries')
        .select('landing_page_id')
        .in('landing_page_id', pageIds);

      if (inquiries) {
        inquiries.forEach((inquiry) => {
          if (inquiry.landing_page_id) {
            inquiryCounts[inquiry.landing_page_id] =
              (inquiryCounts[inquiry.landing_page_id] || 0) + 1;
          }
        });
      }
    }

    // Add inquiry counts to pages
    const pagesWithCounts = (data || []).map((page) => ({
      ...page,
      inquiry_count: inquiryCounts[page.id] || 0,
    }));

    return NextResponse.json({
      pages: pagesWithCounts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('SEO pages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

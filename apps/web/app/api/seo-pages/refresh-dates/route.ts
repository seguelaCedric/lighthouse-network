import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST - Batch update last_reviewed_at dates for SEO pages
 *
 * This endpoint refreshes the last_reviewed_at timestamp for SEO pages
 * to signal content freshness to search engines.
 *
 * Can update:
 * - All cornerstone pages
 * - All landing pages
 * - Specific pages by ID
 * - Pages older than X days
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type = 'all', // 'cornerstone', 'landing', 'all', or 'specific'
      pageIds,      // For 'specific' type
      olderThanDays = 30, // Refresh pages not reviewed in X days
    } = body;

    const now = new Date().toISOString();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffDateStr = cutoffDate.toISOString();

    let results: {
      cornerstone_updated: number;
      landing_updated: number;
    } = {
      cornerstone_updated: 0,
      landing_updated: 0,
    };

    // Update cornerstone pages
    if (type === 'cornerstone' || type === 'all') {
      let query = supabase
        .from('seo_cornerstone_pages')
        .update({ last_reviewed_at: now })
        .eq('is_active', true);

      if (type !== 'specific') {
        query = query.or(`last_reviewed_at.is.null,last_reviewed_at.lt.${cutoffDateStr}`);
      }

      const { data, error } = await query.select('id');

      if (error) {
        console.error('Cornerstone update error:', error);
      } else {
        results.cornerstone_updated = data?.length || 0;
      }
    }

    // Update landing pages
    if (type === 'landing' || type === 'all') {
      let query = supabase
        .from('seo_landing_pages')
        .update({ last_reviewed_at: now })
        .eq('is_active', true);

      if (type !== 'specific') {
        query = query.or(`last_reviewed_at.is.null,last_reviewed_at.lt.${cutoffDateStr}`);
      }

      const { data, error } = await query.select('id');

      if (error) {
        console.error('Landing pages update error:', error);
      } else {
        results.landing_updated = data?.length || 0;
      }
    }

    // Update specific pages
    if (type === 'specific' && pageIds && pageIds.length > 0) {
      // Try cornerstone pages first
      const { data: cornerstone } = await supabase
        .from('seo_cornerstone_pages')
        .update({ last_reviewed_at: now })
        .in('id', pageIds)
        .select('id');

      results.cornerstone_updated = cornerstone?.length || 0;

      // Then landing pages
      const { data: landing } = await supabase
        .from('seo_landing_pages')
        .update({ last_reviewed_at: now })
        .in('id', pageIds)
        .select('id');

      results.landing_updated = landing?.length || 0;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.cornerstone_updated} cornerstone pages and ${results.landing_updated} landing pages`,
      results,
      refreshed_at: now,
    });
  } catch (error) {
    console.error('Refresh dates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check freshness status of SEO pages
export async function GET() {
  try {
    const supabase = await createClient();

    // Get counts of stale pages
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

    // Cornerstone pages stats
    const { count: cornerstoneTotal } = await supabase
      .from('seo_cornerstone_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: cornerstoneStale30 } = await supabase
      .from('seo_cornerstone_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgoStr}`);

    const { count: cornerstoneStale60 } = await supabase
      .from('seo_cornerstone_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${sixtyDaysAgoStr}`);

    // Landing pages stats
    const { count: landingTotal } = await supabase
      .from('seo_landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: landingStale30 } = await supabase
      .from('seo_landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgoStr}`);

    const { count: landingStale60 } = await supabase
      .from('seo_landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${sixtyDaysAgoStr}`);

    return NextResponse.json({
      cornerstone: {
        total: cornerstoneTotal || 0,
        stale_30_days: cornerstoneStale30 || 0,
        stale_60_days: cornerstoneStale60 || 0,
        fresh: (cornerstoneTotal || 0) - (cornerstoneStale30 || 0),
      },
      landing: {
        total: landingTotal || 0,
        stale_30_days: landingStale30 || 0,
        stale_60_days: landingStale60 || 0,
        fresh: (landingTotal || 0) - (landingStale30 || 0),
      },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Freshness check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

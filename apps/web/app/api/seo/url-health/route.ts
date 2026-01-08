import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Check URL health for all landing pages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch all active landing pages
    const { data: pages, error } = await supabase
      .from('seo_landing_pages')
      .select('id, original_url_path, position, city, state, country')
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('URL health check error:', error);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    // Check each URL path format
    const healthChecks = (pages || []).map((page) => {
      const urlPath = page.original_url_path;
      const issues: string[] = [];

      // Basic validation
      if (!urlPath || urlPath.trim() === '') {
        issues.push('Empty URL path');
      }

      // Check for expected format: hire-a-[position]-[country]/[state]/[city]
      if (urlPath && !urlPath.startsWith('hire-a-')) {
        issues.push('URL does not start with "hire-a-"');
      }

      // Check for special characters that might cause issues
      if (urlPath && /[^a-z0-9\/-]/.test(urlPath.toLowerCase())) {
        issues.push('URL contains invalid characters');
      }

      return {
        id: page.id,
        url_path: urlPath,
        position: page.position,
        location: [page.city, page.state, page.country].filter(Boolean).join(', '),
        is_healthy: issues.length === 0,
        issues,
      };
    });

    const healthyCount = healthChecks.filter((check) => check.is_healthy).length;
    const unhealthyCount = healthChecks.length - healthyCount;

    return NextResponse.json({
      total_checked: healthChecks.length,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
      checks: healthChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('URL health check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


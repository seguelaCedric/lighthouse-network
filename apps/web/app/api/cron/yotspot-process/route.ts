import { NextRequest, NextResponse } from 'next/server';
import { processPendingYotspotImports } from '@/lib/yotspot';

// Allow long-running for scraping operations
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/yotspot-process
 *
 * Cron job to process pending Yotspot candidate imports.
 * Scrapes candidates from Yotspot, extracts CV data, creates candidate records,
 * and runs match scoring.
 *
 * Schedule: Every 10 minutes
 * Security: Protected by CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[YotspotCron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Yotspot is configured
    if (!process.env.YOTSPOT_EMAIL || !process.env.YOTSPOT_PASSWORD) {
      console.log('[YotspotCron] Yotspot credentials not configured, skipping');
      return NextResponse.json({
        success: true,
        message: 'Yotspot not configured, nothing to process',
        processed: 0,
        succeeded: 0,
        failed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log('[YotspotCron] Starting import processing...');

    // Process pending imports (max 5 per run to avoid timeout)
    const results = await processPendingYotspotImports(5);

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[YotspotCron] Completed: ${succeeded} succeeded, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} imports`,
      processed: results.length,
      succeeded,
      failed,
      results: results.map((r) => ({
        queueId: r.queueId,
        success: r.success,
        candidateId: r.candidateId,
        candidateName: r.candidateName,
        isDuplicate: r.isDuplicate,
        matchScore: r.matchScore,
        error: r.error,
      })),
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[YotspotCron] Processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process Yotspot imports',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/yotspot-process
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'yotspot-process',
    method: 'POST',
    description:
      'Processes pending Yotspot candidate imports from the queue',
    schedule: '*/10 * * * * (every 10 minutes)',
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import {
  yotspotImportNotificationEmail,
  type YotspotImportNotificationData,
} from '@/lib/email/templates';
import { MATCH_THRESHOLDS } from '@/lib/yotspot/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/yotspot-notify
 *
 * Cron job to send notifications for completed Yotspot imports with high match scores.
 * Only sends notifications for candidates with match_score >= 70%.
 *
 * Schedule: Every 15 minutes
 * Security: Protected by CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[YotspotNotify] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lighthouse-careers.com';

    // Get completed imports ready for notification
    // - Status is 'completed'
    // - Match score >= threshold
    // - Not yet notified
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('yotspot_import_queue')
      .select(`
        id,
        candidate_id,
        candidate_name,
        candidate_email,
        candidate_phone,
        position_title,
        yotspot_job_ref,
        applicant_url,
        match_score,
        match_assessment,
        scraped_data,
        job_id,
        jobs:job_id (
          id,
          title
        )
      `)
      .eq('status', 'completed')
      .gte('match_score', MATCH_THRESHOLDS.NOTIFY)
      .is('notified_at', null)
      .order('completed_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('[YotspotNotify] Failed to fetch pending notifications:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending notifications' },
        { status: 500 }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('[YotspotNotify] No pending notifications');
      return NextResponse.json({
        success: true,
        message: 'No pending notifications',
        sent: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[YotspotNotify] Processing ${pendingNotifications.length} notifications`);

    let sent = 0;
    let failed = 0;
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Get notification recipients (team members/recruiters)
    const notificationEmail = process.env.YOTSPOT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;

    if (!notificationEmail) {
      console.error('[YotspotNotify] No notification email configured');
      return NextResponse.json(
        { error: 'Notification email not configured' },
        { status: 500 }
      );
    }

    for (const item of pendingNotifications) {
      try {
        // Build notification data
        const scrapedData = item.scraped_data as Record<string, unknown> | null;
        const jobData = item.jobs as { id: string; title: string } | { id: string; title: string }[] | null;
        const job = Array.isArray(jobData) ? jobData[0] : jobData;

        // Parse strengths and concerns from assessment
        const { strengths, concerns } = parseAssessment(item.match_assessment || '');

        const notificationData: YotspotImportNotificationData = {
          candidateName: item.candidate_name || 'Unknown Candidate',
          candidatePosition: item.position_title || (scrapedData?.primaryPosition as string) || null,
          candidateEmail: item.candidate_email,
          candidatePhone: item.candidate_phone,
          jobTitle: job?.title || item.position_title || 'Position',
          jobRef: item.yotspot_job_ref,
          matchScore: item.match_score || 0,
          matchAssessment: item.match_assessment,
          strengths,
          concerns,
          candidateProfileUrl: item.candidate_id
            ? `${baseUrl}/admin/candidates/${item.candidate_id}`
            : `${baseUrl}/admin/yotspot-imports`,
          jobUrl: job?.id
            ? `${baseUrl}/admin/jobs/${job.id}`
            : `${baseUrl}/admin/jobs`,
          yotspotUrl: item.applicant_url,
        };

        // Generate and send email
        const emailContent = yotspotImportNotificationEmail(notificationData);

        await sendEmail({
          to: notificationEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        // Mark as notified
        await supabase
          .from('yotspot_import_queue')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', item.id);

        sent++;
        results.push({ id: item.id, success: true });

        console.log(`[YotspotNotify] Sent notification for ${item.candidate_name}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id: item.id, success: false, error: errorMessage });
        console.error(`[YotspotNotify] Failed to send notification for ${item.id}:`, error);
      }
    }

    console.log(`[YotspotNotify] Completed: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} notifications`,
      sent,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[YotspotNotify] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Parse strengths and concerns from assessment text
 */
function parseAssessment(assessment: string): {
  strengths: string[];
  concerns: string[];
} {
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (!assessment) return { strengths, concerns };

  // Look for "Strengths:" section
  const strengthsMatch = assessment.match(/Strengths?:\s*([^.]+)/i);
  if (strengthsMatch) {
    const items = strengthsMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    strengths.push(...items);
  }

  // Look for "Concerns:" section
  const concernsMatch = assessment.match(/Concerns?:\s*([^.]+)/i);
  if (concernsMatch) {
    const items = concernsMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    concerns.push(...items);
  }

  return { strengths, concerns };
}

/**
 * GET /api/cron/yotspot-notify
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'yotspot-notify',
    method: 'POST',
    description: 'Sends email notifications for high-match Yotspot imports',
    schedule: '*/15 * * * * (every 15 minutes)',
    threshold: `Match score >= ${MATCH_THRESHOLDS.NOTIFY}%`,
  });
}

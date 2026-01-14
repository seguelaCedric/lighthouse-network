import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { YotspotImportRequest, YotspotImportResponse } from '@/lib/yotspot/types';
import { processYotspotImportById, MATCH_THRESHOLDS } from '@/lib/yotspot';
import { sendEmail } from '@/lib/email/client';
import {
  yotspotImportNotificationEmail,
  type YotspotImportNotificationData,
} from '@/lib/email/templates';

/**
 * POST /api/yotspot/import
 *
 * Receives import requests from n8n when a Yotspot notification email is detected.
 * Queues the candidate for scraping and processing.
 *
 * Security: Validates webhook secret from n8n
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (prevents unauthorized access)
    const webhookSecret = process.env.YOTSPOT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('x-webhook-secret');
      const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
      const urlSecret = request.nextUrl.searchParams.get('secret');

      if (
        authHeader !== webhookSecret &&
        bearerToken !== webhookSecret &&
        urlSecret !== webhookSecret
      ) {
        console.error('[YotspotImport] Invalid or missing webhook secret');
        return NextResponse.json<YotspotImportResponse>(
          { success: false, message: 'Unauthorized', error: 'Invalid webhook secret' },
          { status: 401 }
        );
      }
    }

    // Parse request body
    const body: YotspotImportRequest = await request.json();

    // Validate required fields
    if (!body.applicantUrl) {
      return NextResponse.json<YotspotImportResponse>(
        {
          success: false,
          message: 'Missing required field: applicantUrl',
          error: 'applicantUrl is required',
        },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidYotspotUrl(body.applicantUrl)) {
      return NextResponse.json<YotspotImportResponse>(
        {
          success: false,
          message: 'Invalid applicant URL',
          error: 'URL must be a valid Yotspot applicant URL',
        },
        { status: 400 }
      );
    }

    console.log(
      `[YotspotImport] Received import request for: ${body.applicantUrl}`
    );

    // Get Supabase client (service role - no auth context needed for webhooks)
    const supabase = createServiceRoleClient();

    // Check for duplicate (same URL in last 24 hours)
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: existingItem } = await supabase
      .from('yotspot_import_queue')
      .select('id, status, created_at')
      .eq('applicant_url', body.applicantUrl)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingItem) {
      console.log(
        `[YotspotImport] Duplicate detected - already queued: ${existingItem.id} (status: ${existingItem.status})`
      );
      return NextResponse.json<YotspotImportResponse>(
        {
          success: true,
          queueId: existingItem.id,
          message: `Import already queued (status: ${existingItem.status})`,
        },
        { status: 200 }
      );
    }

    // Look up job mapping if we have a Yotspot job ID
    let jobId: string | null = null;
    if (body.yotspotJobId) {
      const { data: mapping } = await supabase
        .from('yotspot_job_mapping')
        .select('job_id')
        .eq('yotspot_job_id', body.yotspotJobId)
        .eq('is_active', true)
        .single();

      if (mapping) {
        jobId = mapping.job_id;
        console.log(
          `[YotspotImport] Found job mapping: Yotspot ${body.yotspotJobId} -> Lighthouse ${jobId}`
        );
      } else {
        console.log(
          `[YotspotImport] No job mapping found for Yotspot job ID: ${body.yotspotJobId}`
        );
      }
    }

    // Insert into queue
    const { data: queueItem, error: insertError } = await supabase
      .from('yotspot_import_queue')
      .insert({
        applicant_url: body.applicantUrl,
        yotspot_job_ref: body.yotspotJobRef || null,
        yotspot_job_id: body.yotspotJobId || null,
        position_title: body.positionTitle || null,
        match_percentage: body.matchPercentage || null,
        job_id: jobId,
        status: 'pending',
        attempts: 0,
        next_retry_at: new Date().toISOString(), // Ready for immediate processing
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[YotspotImport] Failed to insert queue item:', insertError);
      return NextResponse.json<YotspotImportResponse>(
        {
          success: false,
          message: 'Failed to queue import',
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `[YotspotImport] Successfully queued import: ${queueItem.id} - processing immediately...`
    );

    // Process immediately instead of waiting for cron
    const result = await processYotspotImportById(queueItem.id);

    // If successful and high match, send notification immediately
    if (result.success && result.matchScore && result.matchScore >= MATCH_THRESHOLDS.NOTIFY) {
      await sendImmediateNotification(supabase, queueItem.id, result);
    }

    return NextResponse.json<YotspotImportResponse>(
      {
        success: result.success,
        queueId: queueItem.id,
        candidateId: result.candidateId,
        message: result.success
          ? `Import completed: ${result.candidateName}${result.matchScore ? ` (${result.matchScore}% match)` : ''}`
          : `Import failed: ${result.error}`,
        error: result.error,
      },
      { status: result.success ? 201 : 500 }
    );
  } catch (error) {
    console.error('[YotspotImport] Unexpected error:', error);
    return NextResponse.json<YotspotImportResponse>(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate that the URL is a valid Yotspot applicant URL
 */
function isValidYotspotUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS and from yotspot.com domain
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'www.yotspot.com' ||
        parsed.hostname === 'yotspot.com' ||
        parsed.hostname.endsWith('.yotspot.com'))
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/yotspot/import
 *
 * Returns queue status for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // Verify webhook secret for read access too
    const webhookSecret = process.env.YOTSPOT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('x-webhook-secret');
      const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
      const urlSecret = request.nextUrl.searchParams.get('secret');

      if (
        authHeader !== webhookSecret &&
        bearerToken !== webhookSecret &&
        urlSecret !== webhookSecret
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createServiceRoleClient();

    // Get queue stats
    const now = new Date();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toISOString();

    // Count by status
    const { data: statusCounts } = await supabase
      .from('yotspot_import_queue')
      .select('status')
      .gte('created_at', twentyFourHoursAgo);

    const stats = {
      pending: 0,
      scraping: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      duplicate: 0,
      skipped: 0,
    };

    for (const item of statusCounts || []) {
      const status = item.status as keyof typeof stats;
      if (status in stats) {
        stats[status]++;
      }
    }

    // Get recent items
    const { data: recentItems } = await supabase
      .from('yotspot_import_queue')
      .select('id, applicant_url, status, candidate_name, match_score, created_at, completed_at, last_error')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats,
      recent: recentItems || [],
    });
  } catch (error) {
    console.error('[YotspotImport] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send immediate notification for high-match candidates
 */
async function sendImmediateNotification(
  supabase: ReturnType<typeof createServiceRoleClient>,
  queueId: string,
  result: { candidateId?: string; candidateName?: string; matchScore?: number; matchAssessment?: string }
): Promise<void> {
  try {
    const notificationEmail = process.env.YOTSPOT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    if (!notificationEmail) {
      console.warn('[YotspotImport] No notification email configured');
      return;
    }

    // Get full queue item data
    const { data: item } = await supabase
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
      .eq('id', queueId)
      .single();

    if (!item) {
      console.warn('[YotspotImport] Queue item not found for notification');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lighthouse-careers.com';
    const scrapedData = item.scraped_data as Record<string, unknown> | null;
    const jobData = item.jobs as { id: string; title: string } | { id: string; title: string }[] | null;
    const job = Array.isArray(jobData) ? jobData[0] : jobData;

    // Parse strengths and concerns from assessment
    const { strengths, concerns } = parseAssessment(item.match_assessment || '');

    const notificationData: YotspotImportNotificationData = {
      candidateName: item.candidate_name || result.candidateName || 'Unknown Candidate',
      candidatePosition: item.position_title || (scrapedData?.primaryPosition as string) || null,
      candidateEmail: item.candidate_email,
      candidatePhone: item.candidate_phone,
      jobTitle: job?.title || item.position_title || 'Position',
      jobRef: item.yotspot_job_ref,
      matchScore: item.match_score || result.matchScore || 0,
      matchAssessment: item.match_assessment || result.matchAssessment || null,
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
      .eq('id', queueId);

    console.log(`[YotspotImport] Sent immediate notification for ${item.candidate_name}`);
  } catch (error) {
    console.error('[YotspotImport] Failed to send immediate notification:', error);
    // Don't throw - notification failure shouldn't fail the import
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

  const strengthsMatch = assessment.match(/Strengths?:\s*([^.]+)/i);
  if (strengthsMatch) {
    const items = strengthsMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    strengths.push(...items);
  }

  const concernsMatch = assessment.match(/Concerns?:\s*([^.]+)/i);
  if (concernsMatch) {
    const items = concernsMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    concerns.push(...items);
  }

  return { strengths, concerns };
}

/**
 * Job Alert Service
 *
 * Handles sending job alert notifications to candidates when new jobs
 * match their primary and secondary position preferences.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { jobAlertEmail, initialJobMatchEmail, type JobAlertData, type InitialJobMatchData } from "@/lib/email/templates";

// Default debounce delay in seconds (60 seconds = 1 minute)
// This gives Vincere time to send all custom field updates before we send alerts
const DEFAULT_ALERT_DELAY_SECONDS = 60;

export interface JobAlertCandidate {
  candidate_id: string;
  candidate_email: string;
  candidate_first_name: string;
  candidate_last_name: string;
  matched_position: string;
}

export interface JobForAlert {
  id: string;
  title: string;
  vessel_name: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  contract_type: string | null;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  start_date: string | null;
  benefits: string | null;
}

export interface JobAlertResult {
  candidateId: string;
  candidateEmail: string;
  success: boolean;
  notificationCreated: boolean;
  emailSent: boolean;
  error?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse.crew";

/**
 * Check if a job title matches any of the candidate's preferred positions
 */
export function jobTitleMatchesPositions(
  jobTitle: string,
  positions: {
    yachtPrimary?: string | null;
    yachtSecondary?: string[] | null;
    householdPrimary?: string | null;
    householdSecondary?: string[] | null;
    legacyPrimary?: string | null;
    legacySecondary?: string[] | null;
  }
): { matches: boolean; matchedPosition: string | null } {
  const jobTitleLower = jobTitle.toLowerCase();

  // Check yacht primary position
  if (positions.yachtPrimary && jobTitleLower.includes(positions.yachtPrimary.toLowerCase())) {
    return { matches: true, matchedPosition: positions.yachtPrimary };
  }

  // Check yacht secondary positions
  if (positions.yachtSecondary) {
    for (const pos of positions.yachtSecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  // Check household primary position
  if (positions.householdPrimary && jobTitleLower.includes(positions.householdPrimary.toLowerCase())) {
    return { matches: true, matchedPosition: positions.householdPrimary };
  }

  // Check household secondary positions
  if (positions.householdSecondary) {
    for (const pos of positions.householdSecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  // Check legacy primary position
  if (positions.legacyPrimary && jobTitleLower.includes(positions.legacyPrimary.toLowerCase())) {
    return { matches: true, matchedPosition: positions.legacyPrimary };
  }

  // Check legacy secondary positions
  if (positions.legacySecondary) {
    for (const pos of positions.legacySecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  return { matches: false, matchedPosition: null };
}

/**
 * Get all candidates eligible for job alerts for a specific job
 */
export async function getCandidatesForJobAlert(jobId: string): Promise<JobAlertCandidate[]> {
  const supabase = await createClient();

  // Use the RPC function we created in the migration
  const { data, error } = await supabase.rpc("get_candidates_for_job_alert", {
    p_job_id: jobId,
  });

  if (error) {
    console.error("Error fetching candidates for job alert:", error);
    return [];
  }

  return (data || []) as JobAlertCandidate[];
}

/**
 * Get job details for alert email
 */
export async function getJobForAlert(jobId: string): Promise<JobForAlert | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      vessel_name,
      vessel_type,
      vessel_size_meters,
      contract_type,
      primary_region,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      start_date,
      benefits
    `
    )
    .eq("id", jobId)
    .single();

  if (error) {
    console.error("Error fetching job for alert:", error);
    return null;
  }

  return data;
}

/**
 * Create a notification record in the database
 */
export async function createJobAlertNotification(
  candidateId: string,
  job: JobForAlert,
  matchedPosition: string
): Promise<string | null> {
  const supabase = await createClient();

  const notificationData = {
    candidate_id: candidateId,
    type: "job_alert",
    title: `New ${job.title} Position`,
    description: job.vessel_name
      ? `A new ${job.title} position on ${job.vessel_name} matches your ${matchedPosition} preference.`
      : `A new ${job.title} position matches your ${matchedPosition} preference.`,
    is_read: false,
    entity_type: "job",
    entity_id: job.id,
    action_url: `/crew/jobs/${job.id}`,
    action_label: "View Job",
    metadata: {
      job_title: job.title,
      vessel_name: job.vessel_name,
      matched_position: matchedPosition,
      contract_type: job.contract_type,
      primary_region: job.primary_region,
    },
  };

  const { data, error } = await supabase
    .from("candidate_notifications")
    .insert(notificationData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }

  return data?.id || null;
}

/**
 * Log the job alert to prevent duplicate sends
 */
export async function logJobAlert(
  candidateId: string,
  jobId: string,
  notificationId: string | null,
  emailSent: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("job_alert_log").insert({
    candidate_id: candidateId,
    job_id: jobId,
    notification_id: notificationId,
    email_sent: emailSent,
    email_sent_at: emailSent ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("Error logging job alert:", error);
  }
}

/**
 * Send job alert email to a candidate
 */
export async function sendJobAlertEmail(
  candidate: JobAlertCandidate,
  job: JobForAlert
): Promise<boolean> {
  const emailData: JobAlertData = {
    candidateName: candidate.candidate_first_name,
    jobTitle: job.title,
    jobId: job.id,
    vesselName: job.vessel_name || undefined,
    vesselType: job.vessel_type || undefined,
    vesselSize: job.vessel_size_meters || undefined,
    contractType: job.contract_type || undefined,
    primaryRegion: job.primary_region || undefined,
    salaryMin: job.salary_min || undefined,
    salaryMax: job.salary_max || undefined,
    salaryCurrency: job.salary_currency || undefined,
    salaryPeriod: job.salary_period || undefined,
    startDate: job.start_date || undefined,
    benefits: job.benefits || undefined,
    matchedPosition: candidate.matched_position,
    dashboardLink: `${BASE_URL}/crew/jobs/${job.id}`,
  };

  const template = jobAlertEmail(emailData);

  const result = await sendEmail({
    to: candidate.candidate_email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return result.success;
}

/**
 * Process job alerts for a newly posted job
 * This is the main entry point called when a job is published
 */
export async function processJobAlerts(jobId: string): Promise<{
  totalCandidates: number;
  successfulAlerts: number;
  failedAlerts: number;
  results: JobAlertResult[];
}> {
  // Get the job details
  const job = await getJobForAlert(jobId);
  if (!job) {
    return {
      totalCandidates: 0,
      successfulAlerts: 0,
      failedAlerts: 0,
      results: [],
    };
  }

  // Get eligible candidates using the RPC function
  const candidates = await getCandidatesForJobAlert(jobId);

  const results: JobAlertResult[] = [];
  let successfulAlerts = 0;
  let failedAlerts = 0;

  // Process each candidate
  for (const candidate of candidates) {
    try {
      // Create notification in dashboard
      const notificationId = await createJobAlertNotification(
        candidate.candidate_id,
        job,
        candidate.matched_position
      );

      // Send email
      const emailSent = await sendJobAlertEmail(candidate, job);

      // Log the alert
      await logJobAlert(
        candidate.candidate_id,
        jobId,
        notificationId,
        emailSent
      );

      results.push({
        candidateId: candidate.candidate_id,
        candidateEmail: candidate.candidate_email,
        success: true,
        notificationCreated: !!notificationId,
        emailSent,
      });

      successfulAlerts++;
    } catch (error) {
      console.error(`Error processing alert for candidate ${candidate.candidate_id}:`, error);

      results.push({
        candidateId: candidate.candidate_id,
        candidateEmail: candidate.candidate_email,
        success: false,
        notificationCreated: false,
        emailSent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      failedAlerts++;
    }
  }

  console.log(
    `Job alerts processed for job ${jobId}: ${successfulAlerts} successful, ${failedAlerts} failed out of ${candidates.length} candidates`
  );

  return {
    totalCandidates: candidates.length,
    successfulAlerts,
    failedAlerts,
    results,
  };
}

/**
 * Process initial job matches when a candidate completes their preferences.
 * This finds ALL open jobs that match the candidate's position preferences
 * and sends a summary notification + email.
 */
export async function processInitialJobMatches(candidateId: string): Promise<{
  totalMatches: number;
  notificationsCreated: number;
  emailSent: boolean;
}> {
  const supabase = await createClient();

  // 1. Get candidate with preferences
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select(`
      id,
      email,
      first_name,
      job_alerts_enabled,
      yacht_primary_position,
      yacht_secondary_positions,
      household_primary_position,
      household_secondary_positions,
      primary_position,
      secondary_positions
    `)
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    console.error("Error fetching candidate for initial job matches:", candidateError);
    return { totalMatches: 0, notificationsCreated: 0, emailSent: false };
  }

  // Check if job alerts are enabled
  if (!candidate.job_alerts_enabled) {
    console.log(`Job alerts disabled for candidate ${candidateId}, skipping initial match`);
    return { totalMatches: 0, notificationsCreated: 0, emailSent: false };
  }

  // 2. Get all open public jobs
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      vessel_name,
      vessel_type,
      vessel_size_meters,
      contract_type,
      primary_region,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      start_date,
      benefits
    `)
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null);

  if (jobsError) {
    console.error("Error fetching jobs for initial match:", jobsError);
    return { totalMatches: 0, notificationsCreated: 0, emailSent: false };
  }

  if (!jobs || jobs.length === 0) {
    console.log("No open jobs found for initial match");
    return { totalMatches: 0, notificationsCreated: 0, emailSent: false };
  }

  // 3. Get already alerted job IDs (to prevent duplicates)
  const { data: existingAlerts } = await supabase
    .from("job_alert_log")
    .select("job_id")
    .eq("candidate_id", candidateId);

  const alertedJobIds = new Set((existingAlerts || []).map((a) => a.job_id));

  // 4. Find matching jobs
  const positions = {
    yachtPrimary: candidate.yacht_primary_position,
    yachtSecondary: candidate.yacht_secondary_positions,
    householdPrimary: candidate.household_primary_position,
    householdSecondary: candidate.household_secondary_positions,
    legacyPrimary: candidate.primary_position,
    legacySecondary: candidate.secondary_positions,
  };

  const matchingJobs: Array<{
    job: (typeof jobs)[0];
    matchedPosition: string;
  }> = [];

  for (const job of jobs) {
    // Skip if already alerted
    if (alertedJobIds.has(job.id)) continue;

    const { matches, matchedPosition } = jobTitleMatchesPositions(job.title, positions);
    if (matches && matchedPosition) {
      matchingJobs.push({ job, matchedPosition });
    }
  }

  if (matchingJobs.length === 0) {
    console.log(`No matching jobs found for candidate ${candidateId}`);
    return { totalMatches: 0, notificationsCreated: 0, emailSent: false };
  }

  console.log(`Found ${matchingJobs.length} matching jobs for candidate ${candidateId}`);

  // 5. Create notifications in batch
  const notifications = matchingJobs.map(({ job, matchedPosition }) => ({
    candidate_id: candidateId,
    type: "job_alert" as const,
    title: `New ${job.title} Position`,
    description: job.vessel_name
      ? `A new ${job.title} position on ${job.vessel_name} matches your ${matchedPosition} preference.`
      : `A new ${job.title} position matches your ${matchedPosition} preference.`,
    is_read: false,
    entity_type: "job" as const,
    entity_id: job.id,
    action_url: `/crew/jobs/${job.id}`,
    action_label: "View Job",
    metadata: {
      job_title: job.title,
      vessel_name: job.vessel_name,
      matched_position: matchedPosition,
      contract_type: job.contract_type,
      primary_region: job.primary_region,
    },
  }));

  const { error: notificationError } = await supabase
    .from("candidate_notifications")
    .insert(notifications);

  if (notificationError) {
    console.error("Error creating initial match notifications:", notificationError);
    return { totalMatches: matchingJobs.length, notificationsCreated: 0, emailSent: false };
  }

  // 6. Log all alerts to prevent duplicates on future new jobs
  const alertLogs = matchingJobs.map(({ job }) => ({
    candidate_id: candidateId,
    job_id: job.id,
    email_sent: true,
    email_sent_at: new Date().toISOString(),
  }));

  const { error: logError } = await supabase.from("job_alert_log").insert(alertLogs);

  if (logError) {
    console.error("Error logging initial job alerts:", logError);
    // Continue anyway, notifications were created
  }

  // 7. Send summary email if candidate has email
  let emailSent = false;
  if (candidate.email) {
    const emailData: InitialJobMatchData = {
      candidateName: candidate.first_name || "there",
      matchedJobs: matchingJobs.map(({ job, matchedPosition }) => ({
        id: job.id,
        title: job.title,
        vesselName: job.vessel_name,
        vesselType: job.vessel_type,
        contractType: job.contract_type,
        primaryRegion: job.primary_region,
        matchedPosition,
      })),
      totalMatches: matchingJobs.length,
      dashboardLink: `${BASE_URL}/crew/jobs`,
    };

    const template = initialJobMatchEmail(emailData);

    const result = await sendEmail({
      to: candidate.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    emailSent = result.success;

    if (!emailSent) {
      console.error(`Failed to send initial match email to candidate ${candidateId}`);
    }
  }

  console.log(
    `Initial job matches processed for candidate ${candidateId}: ${matchingJobs.length} matches, ${notifications.length} notifications created, email sent: ${emailSent}`
  );

  return {
    totalMatches: matchingJobs.length,
    notificationsCreated: notifications.length,
    emailSent,
  };
}

/**
 * Schedule a job alert to be sent after a delay.
 * This implements debouncing: if the job is updated again before the delay expires,
 * the timer is reset. This prevents sending alerts for incomplete jobs when
 * Vincere sends multiple webhooks (CREATE + multiple custom field UPDATEs).
 *
 * @param jobId - The job ID to schedule alerts for
 * @param delaySeconds - How long to wait before sending (default: 60 seconds)
 * @returns The pending alert ID, or null if scheduling failed
 */
export async function scheduleJobAlert(
  jobId: string,
  delaySeconds: number = DEFAULT_ALERT_DELAY_SECONDS
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("schedule_job_alert", {
    p_job_id: jobId,
    p_delay_seconds: delaySeconds,
  });

  if (error) {
    console.error(`[JobAlerts] Error scheduling alert for job ${jobId}:`, error);
    return null;
  }

  console.log(`[JobAlerts] Scheduled alert for job ${jobId} in ${delaySeconds} seconds`);
  return data as string;
}

/**
 * Process all pending job alerts that are due.
 * This is called by a cron job to check for scheduled alerts whose delay has expired.
 *
 * @param limit - Maximum number of alerts to process in one batch
 * @returns Summary of processing results
 */
export async function processPendingJobAlerts(limit: number = 50): Promise<{
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    jobId: string;
    success: boolean;
    candidatesAlerted: number;
    error?: string;
  }>;
}> {
  const supabase = createServiceRoleClient();

  // Get pending alerts that are due (atomically marks them as processing)
  const { data: pendingAlerts, error: fetchError } = await supabase.rpc(
    "get_pending_job_alerts_for_processing",
    { p_limit: limit }
  );

  if (fetchError) {
    console.error("[JobAlerts] Error fetching pending alerts:", fetchError);
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  if (!pendingAlerts || pendingAlerts.length === 0) {
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  console.log(`[JobAlerts] Processing ${pendingAlerts.length} pending job alerts`);

  const results: Array<{
    jobId: string;
    success: boolean;
    candidatesAlerted: number;
    error?: string;
  }> = [];

  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const alert of pendingAlerts) {
    try {
      // Check if the job is still open and public before sending alerts
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, status, is_public, deleted_at")
        .eq("id", alert.job_id)
        .single();

      if (jobError || !job) {
        console.log(`[JobAlerts] Job ${alert.job_id} not found, skipping alert`);
        skipped++;
        results.push({
          jobId: alert.job_id,
          success: false,
          candidatesAlerted: 0,
          error: "Job not found",
        });
        continue;
      }

      // Skip if job is no longer open or public
      if (job.status !== "open" || !job.is_public || job.deleted_at) {
        console.log(`[JobAlerts] Job ${alert.job_id} is not open/public, skipping alert`);
        skipped++;
        results.push({
          jobId: alert.job_id,
          success: true,
          candidatesAlerted: 0,
          error: "Job not open or public",
        });
        continue;
      }

      // Process the job alerts
      const alertResult = await processJobAlerts(alert.job_id);

      results.push({
        jobId: alert.job_id,
        success: true,
        candidatesAlerted: alertResult.successfulAlerts,
      });

      successful++;
      console.log(
        `[JobAlerts] Processed alerts for job ${alert.job_id}: ${alertResult.successfulAlerts} candidates notified`
      );
    } catch (error) {
      console.error(`[JobAlerts] Error processing alert for job ${alert.job_id}:`, error);
      failed++;
      results.push({
        jobId: alert.job_id,
        success: false,
        candidatesAlerted: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(
    `[JobAlerts] Finished processing: ${successful} successful, ${failed} failed, ${skipped} skipped`
  );

  return {
    processed: pendingAlerts.length,
    successful,
    failed,
    skipped,
    results,
  };
}

/**
 * Job Alert Service
 *
 * Handles sending job alert notifications to candidates when new jobs
 * match their primary and secondary position preferences.
 */

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { jobAlertEmail, type JobAlertData } from "@/lib/email/templates";

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

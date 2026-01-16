#!/usr/bin/env npx tsx
// ============================================================================
// BACKFILL JOB ALERTS SCRIPT
// ============================================================================
// Sends job alert notifications to candidates who have completed preferences
// but haven't received initial job alerts yet.
//
// Usage:
//   npx tsx scripts/backfill-job-alerts.ts --dry-run
//   npx tsx scripts/backfill-job-alerts.ts --limit=10
//   npx tsx scripts/backfill-job-alerts.ts --candidate-id=uuid
//   npx tsx scripts/backfill-job-alerts.ts --limit=50
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY (for emails)
// ============================================================================

import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: path.join(__dirname, "../.env.local") });

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  limit: parseInt(getArg("limit") || "50", 10),
  candidateId: getArg("candidate-id"),
  dryRun: hasFlag("dry-run"),
  verbose: hasFlag("verbose"),
};

// ----------------------------------------------------------------------------
// SUPABASE CLIENT
// ----------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ----------------------------------------------------------------------------
// JOB MATCHING LOGIC (copied from job-alert-service.ts)
// ----------------------------------------------------------------------------

function jobTitleMatchesPositions(
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

  if (
    positions.yachtPrimary &&
    jobTitleLower.includes(positions.yachtPrimary.toLowerCase())
  ) {
    return { matches: true, matchedPosition: positions.yachtPrimary };
  }

  if (positions.yachtSecondary) {
    for (const pos of positions.yachtSecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  if (
    positions.householdPrimary &&
    jobTitleLower.includes(positions.householdPrimary.toLowerCase())
  ) {
    return { matches: true, matchedPosition: positions.householdPrimary };
  }

  if (positions.householdSecondary) {
    for (const pos of positions.householdSecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  if (
    positions.legacyPrimary &&
    jobTitleLower.includes(positions.legacyPrimary.toLowerCase())
  ) {
    return { matches: true, matchedPosition: positions.legacyPrimary };
  }

  if (positions.legacySecondary) {
    for (const pos of positions.legacySecondary) {
      if (pos && jobTitleLower.includes(pos.toLowerCase())) {
        return { matches: true, matchedPosition: pos };
      }
    }
  }

  return { matches: false, matchedPosition: null };
}

// ----------------------------------------------------------------------------
// MAIN BACKFILL LOGIC
// ----------------------------------------------------------------------------

interface CandidateForBackfill {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  preferences_completed_at: string | null;
  job_alerts: boolean;
  yacht_primary_position: string | null;
  yacht_secondary_positions: string[] | null;
  household_primary_position: string | null;
  household_secondary_positions: string[] | null;
  primary_position: string | null;
  secondary_positions: string[] | null;
}

interface Job {
  id: string;
  title: string;
  vessel_name: string | null;
  vessel_type: string | null;
  contract_type: string | null;
  primary_region: string | null;
}

async function getCandidatesForBackfill(): Promise<CandidateForBackfill[]> {
  let query = supabase
    .from("candidates")
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      preferences_completed_at,
      job_alerts,
      yacht_primary_position,
      yacht_secondary_positions,
      household_primary_position,
      household_secondary_positions,
      primary_position,
      secondary_positions
    `
    )
    .not("preferences_completed_at", "is", null)
    .eq("job_alerts", true);

  if (CONFIG.candidateId) {
    query = query.eq("id", CONFIG.candidateId);
  }

  const { data: candidates, error } = await query
    .order("preferences_completed_at", { ascending: false })
    .limit(CONFIG.limit * 2); // Get extra to filter

  if (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }

  // Filter to only those with at least one position preference
  const eligibleCandidates = (candidates || []).filter((c) => {
    return (
      c.yacht_primary_position ||
      c.household_primary_position ||
      c.primary_position ||
      (c.yacht_secondary_positions && c.yacht_secondary_positions.length > 0) ||
      (c.household_secondary_positions &&
        c.household_secondary_positions.length > 0) ||
      (c.secondary_positions && c.secondary_positions.length > 0)
    );
  });

  // Get candidates who haven't received any job alerts yet
  const { data: existingAlerts } = await supabase
    .from("job_alert_log")
    .select("candidate_id")
    .in(
      "candidate_id",
      eligibleCandidates.map((c) => c.id)
    );

  const candidatesWithAlerts = new Set(
    (existingAlerts || []).map((a) => a.candidate_id)
  );

  const candidatesNeedingBackfill = eligibleCandidates.filter(
    (c) => !candidatesWithAlerts.has(c.id)
  );

  return candidatesNeedingBackfill.slice(0, CONFIG.limit);
}

async function getOpenJobs(): Promise<Job[]> {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      vessel_name,
      vessel_type,
      contract_type,
      primary_region
    `
    )
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return jobs || [];
}

async function processCandidate(
  candidate: CandidateForBackfill,
  jobs: Job[]
): Promise<{
  candidateId: string;
  email: string | null;
  success: boolean;
  totalMatches: number;
  notificationsCreated: number;
  error?: string;
}> {
  const positions = {
    yachtPrimary: candidate.yacht_primary_position,
    yachtSecondary: candidate.yacht_secondary_positions,
    householdPrimary: candidate.household_primary_position,
    householdSecondary: candidate.household_secondary_positions,
    legacyPrimary: candidate.primary_position,
    legacySecondary: candidate.secondary_positions,
  };

  // Find matching jobs
  const matchingJobs: Array<{
    job: Job;
    matchedPosition: string;
  }> = [];

  for (const job of jobs) {
    const { matches, matchedPosition } = jobTitleMatchesPositions(
      job.title,
      positions
    );
    if (matches && matchedPosition) {
      matchingJobs.push({ job, matchedPosition });
    }
  }

  if (matchingJobs.length === 0) {
    return {
      candidateId: candidate.id,
      email: candidate.email,
      success: true,
      totalMatches: 0,
      notificationsCreated: 0,
    };
  }

  if (CONFIG.dryRun) {
    return {
      candidateId: candidate.id,
      email: candidate.email,
      success: true,
      totalMatches: matchingJobs.length,
      notificationsCreated: 0,
    };
  }

  // Create notifications
  const notifications = matchingJobs.map(({ job, matchedPosition }) => ({
    candidate_id: candidate.id,
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
    console.error("Notification insert error:", notificationError);
    return {
      candidateId: candidate.id,
      email: candidate.email,
      success: false,
      totalMatches: matchingJobs.length,
      notificationsCreated: 0,
      error: notificationError.message || JSON.stringify(notificationError),
    };
  }

  // Log alerts to prevent duplicates
  const alertLogs = matchingJobs.map(({ job }) => ({
    candidate_id: candidate.id,
    job_id: job.id,
    email_sent: false, // Not sending emails in backfill
    email_sent_at: null,
  }));

  const { error: logError } = await supabase
    .from("job_alert_log")
    .insert(alertLogs);

  if (logError) {
    console.warn(
      `Warning: Could not log alerts for candidate ${candidate.id}: ${logError.message}`
    );
  }

  return {
    candidateId: candidate.id,
    email: candidate.email,
    success: true,
    totalMatches: matchingJobs.length,
    notificationsCreated: notifications.length,
  };
}

async function main() {
  console.log("============================================================");
  console.log("BACKFILL JOB ALERTS");
  console.log("============================================================");
  console.log(`Mode: ${CONFIG.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Limit: ${CONFIG.limit}`);
  if (CONFIG.candidateId) {
    console.log(`Candidate ID: ${CONFIG.candidateId}`);
  }
  console.log("");

  // Get candidates needing backfill
  console.log("Fetching candidates needing backfill...");
  const candidates = await getCandidatesForBackfill();
  console.log(`Found ${candidates.length} candidates needing backfill\n`);

  if (candidates.length === 0) {
    console.log("No candidates need backfill. Exiting.");
    return;
  }

  // Get open jobs
  console.log("Fetching open jobs...");
  const jobs = await getOpenJobs();
  console.log(`Found ${jobs.length} open public jobs\n`);

  if (jobs.length === 0) {
    console.log("No open jobs found. Exiting.");
    return;
  }

  // Process each candidate
  console.log("Processing candidates...\n");
  const results: Array<{
    candidateId: string;
    email: string | null;
    name: string;
    success: boolean;
    totalMatches: number;
    notificationsCreated: number;
    error?: string;
  }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const name =
      `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
      "Unknown";

    console.log(
      `[${i + 1}/${candidates.length}] Processing ${name} (${candidate.email || "no email"})...`
    );

    const result = await processCandidate(candidate, jobs);
    results.push({ ...result, name });

    if (result.success) {
      console.log(
        `   ✓ ${result.totalMatches} matches, ${result.notificationsCreated} notifications created`
      );
    } else {
      console.log(`   ✗ Error: ${result.error}`);
    }
  }

  // Summary
  console.log("\n============================================================");
  console.log("SUMMARY");
  console.log("============================================================");

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);
  const totalNotifications = results.reduce(
    (sum, r) => sum + r.notificationsCreated,
    0
  );

  console.log(`Candidates processed: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total job matches found: ${totalMatches}`);
  console.log(`Total notifications created: ${totalNotifications}`);

  if (CONFIG.dryRun) {
    console.log(
      "\n⚠️  DRY RUN - No notifications were actually created."
    );
    console.log("   Run without --dry-run to create notifications.");
  }

  // Show details for candidates with matches
  const candidatesWithMatches = results.filter((r) => r.totalMatches > 0);
  if (candidatesWithMatches.length > 0 && CONFIG.verbose) {
    console.log("\nCandidates with matches:");
    for (const r of candidatesWithMatches) {
      console.log(`  - ${r.name} (${r.email}): ${r.totalMatches} matches`);
    }
  }

  // Show errors
  const errors = results.filter((r) => !r.success);
  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const e of errors) {
      console.log(`  - ${e.name}: ${e.error}`);
    }
  }
}

main().catch(console.error);

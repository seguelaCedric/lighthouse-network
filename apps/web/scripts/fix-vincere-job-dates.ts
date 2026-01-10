#!/usr/bin/env npx tsx
/**
 * Fix Vincere Job Dates and Statuses
 *
 * Updates jobs with proper dates and statuses from Vincere raw data.
 * The raw JSON has registration_date (created), open_date, close_date, and status_id.
 *
 * Usage:
 *   npx tsx apps/web/scripts/fix-vincere-job-dates.ts [options]
 *
 * Options:
 *   --dry-run     Preview what would be updated without making changes
 *   --verbose     Show detailed progress
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

interface RawJobData {
  job: {
    id: number;
    job_title?: string;
    registration_date?: string;
    open_date?: string;
    close_date?: string;
    status_id?: number;
    closed_job?: boolean;
  };
}

// Vincere status_id mapping to our job status
// Based on data analysis:
// 0 = Draft/New (80 jobs) -> open
// 1 = Open (374 jobs) -> open
// 2 = Closed/Filled (3779 jobs) -> filled
// 3 = On Hold (2 jobs) -> on_hold
// 4 = Cancelled (985 jobs) -> cancelled
function mapVincereStatus(statusId: number | undefined, closedJob: boolean | undefined): string {
  if (closedJob === true) {
    // If explicitly marked as closed, treat as filled
    if (statusId === 4) return 'cancelled';
    return 'filled';
  }

  switch (statusId) {
    case 0:
    case 1:
      return 'open';
    case 2:
      return 'filled';
    case 3:
      return 'on_hold';
    case 4:
      return 'cancelled';
    default:
      return 'open';
  }
}

/**
 * Create Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

/**
 * Main update function
 */
async function fixJobDates() {
  console.log('='.repeat(60));
  console.log('FIX VINCERE JOB DATES AND STATUSES');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Load raw jobs
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-jobs-raw.json');

  if (!fs.existsSync(rawPath)) {
    console.error(`Raw jobs file not found: ${rawPath}`);
    process.exit(1);
  }

  const rawJobs: RawJobData[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Loaded ${rawJobs.length} jobs from raw JSON`);

  // Create mapping of vincere job id to date/status info
  const jobInfo = new Map<string, { created_at: string; status: string; open_date?: string; close_date?: string }>();

  for (const job of rawJobs) {
    const vincereId = String(job.job.id);
    const status = mapVincereStatus(job.job.status_id, job.job.closed_job);

    jobInfo.set(vincereId, {
      created_at: job.job.registration_date || job.job.open_date || new Date().toISOString(),
      status,
      open_date: job.job.open_date,
      close_date: job.job.closed_job ? job.job.close_date : undefined,
    });
  }

  // Count status distribution
  const statusCounts = new Map<string, number>();
  for (const info of jobInfo.values()) {
    statusCounts.set(info.status, (statusCounts.get(info.status) || 0) + 1);
  }

  console.log('\nStatus distribution from Vincere:');
  for (const [status, count] of statusCounts) {
    console.log(`  ${status}: ${count}`);
  }
  console.log();

  // Initialize Supabase
  const supabase = getSupabaseClient();

  // Get all Vincere jobs from database
  let allJobs: Array<{ id: string; external_id: string; status: string; created_at: string }> = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, external_id, status, created_at')
      .eq('external_source', 'vincere')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Failed to fetch jobs:', error.message);
      return;
    }

    if (!jobs || jobs.length === 0) break;

    allJobs = allJobs.concat(jobs);
    page++;

    if (jobs.length < pageSize) break;
  }

  console.log(`Found ${allJobs.length} Vincere jobs in database`);

  // Update each job
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
    const info = jobInfo.get(job.external_id);

    if (!info) {
      skipped++;
      continue;
    }

    // Check if update is needed
    const needsUpdate = job.status !== info.status ||
                       new Date(job.created_at).toISOString() !== new Date(info.created_at).toISOString();

    if (!needsUpdate) {
      skipped++;
      continue;
    }

    if (isVerbose || (i + 1) % 500 === 0) {
      console.log(`[${i + 1}/${allJobs.length}] Updating job ${job.external_id}: ${job.status} -> ${info.status}`);
    }

    if (isDryRun) {
      updated++;
      continue;
    }

    // Update job
    const { error } = await supabase
      .from('jobs')
      .update({
        status: info.status,
        created_at: info.created_at,
      })
      .eq('id', job.id);

    if (error) {
      console.error(`Error updating job ${job.id}:`, error.message);
      errors++;
    } else {
      updated++;
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Jobs ${isDryRun ? 'would be' : ''} updated: ${updated}`);
  console.log(`Jobs skipped (no change needed): ${skipped}`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
}

// Run the fix
fixJobDates().catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Backfill Job Owners from Vincere
 *
 * Updates jobs with vincere_creator_id and job_owner_name from the raw jobs data.
 * Uses a hardcoded mapping of Vincere user IDs to names.
 *
 * Usage:
 *   npx tsx apps/web/scripts/backfill-job-owners.ts [options]
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

/**
 * Vincere user ID to name mapping
 */
const VINCERE_USER_NAMES: Record<number, string> = {
  28955: 'Milica Seguela',
  28957: 'Catherine Coulibaly',
  28959: 'Admin',
  28960: 'Kiera Cavanagh',
  28961: 'Francesca Zanfagna',
  28963: 'Kate Burns',
  28964: 'Debbie Blazy',
  28965: 'Ivana Novakovic',
  28966: 'Tracy Gueli',
  28967: 'Sonia Szostok',
  28968: 'Laura Cubie',
  28969: 'Kaoutar Zahouane',
  28970: 'Charles Cartledge',
  28971: 'Pamela Moyes',
  28973: 'Marc Stevens',
  28974: 'Shelley Viljoen',
  28975: 'Ornela Grmusa',
  28976: 'Phil Richards',
  28977: 'India Thomson-Virtue',
  28978: 'Joaneen Botha',
  29011: 'Laura Hayes',
  29044: 'Britt McBride',
  29077: 'Tiffany Hutton',
  29110: 'Waldi Coetzee',
  29143: 'Svetlana Blake',
  [-1]: 'Company Admin',
  [-10]: 'System Admin',
};

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
 * Load creator IDs from raw jobs JSON
 */
function loadCreatorIds(): Map<string, number> {
  const rawPath = path.join(__dirname, '../../../scripts/output/vincere-jobs-raw.json');

  if (!fs.existsSync(rawPath)) {
    throw new Error(`Raw jobs file not found: ${rawPath}`);
  }

  const jobs = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  const creatorMap = new Map<string, number>();

  for (const jobData of jobs) {
    const job = jobData.job;
    if (job?.id && job?.creator_id && job.creator_id > 0) {
      creatorMap.set(String(job.id), job.creator_id);
    }
  }

  console.log(`Loaded ${creatorMap.size} creator IDs from raw jobs file`);
  return creatorMap;
}

/**
 * Main backfill function
 */
async function backfillJobOwners() {
  console.log('='.repeat(60));
  console.log('BACKFILL JOB OWNERS FROM VINCERE');
  console.log('='.repeat(60));
  console.log();

  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made');
    console.log();
  }

  // Initialize Supabase
  const supabase = getSupabaseClient();

  // Load creator IDs from raw jobs
  const creatorIds = loadCreatorIds();

  // Get unique creator IDs
  const uniqueCreatorIds = new Set(creatorIds.values());
  console.log(`Unique creator IDs: ${uniqueCreatorIds.size}`);

  // Check which creator IDs don't have names
  const missingNames: number[] = [];
  for (const creatorId of uniqueCreatorIds) {
    if (!VINCERE_USER_NAMES[creatorId]) {
      missingNames.push(creatorId);
    }
  }

  if (missingNames.length > 0) {
    console.log(`\nWARNING: Missing names for creator IDs: ${missingNames.join(', ')}`);
    console.log('Update VINCERE_USER_NAMES in this script with the actual names.\n');
  }

  // Get all Vincere jobs from database
  console.log('Fetching jobs from database...');

  let allJobs: { id: string; external_id: string }[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, external_id')
      .eq('external_source', 'vincere')
      .not('external_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    if (!jobs || jobs.length === 0) break;

    allJobs = allJobs.concat(jobs);
    page++;

    if (jobs.length < pageSize) break;
  }

  console.log(`Found ${allJobs.length} Vincere jobs in database`);

  // Update jobs in batches
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const batchSize = 100;
  const batches = Math.ceil(allJobs.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = allJobs.slice(i * batchSize, (i + 1) * batchSize);

    for (const job of batch) {
      const creatorId = creatorIds.get(job.external_id);

      if (!creatorId) {
        skipped++;
        continue;
      }

      const ownerName = VINCERE_USER_NAMES[creatorId] || `Unknown (${creatorId})`;

      if (isVerbose) {
        console.log(`  Job ${job.external_id}: ${ownerName}`);
      }

      if (isDryRun) {
        updated++;
        continue;
      }

      // Update the job
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          vincere_creator_id: creatorId,
          job_owner_name: ownerName,
        })
        .eq('id', job.id);

      if (updateError) {
        errors++;
        if (isVerbose) {
          console.error(`  Error updating job ${job.id}:`, updateError.message);
        }
      } else {
        updated++;
      }
    }

    if ((i + 1) % 10 === 0 || i === batches - 1) {
      console.log(`  Progress: ${Math.min((i + 1) * batchSize, allJobs.length)}/${allJobs.length}`);
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Jobs ${isDryRun ? 'would be' : ''} updated: ${updated}`);
  console.log(`Skipped (no creator info): ${skipped}`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }

  // Print owner breakdown
  console.log('\nJob owners breakdown:');
  const ownerCounts = new Map<string, number>();

  for (const job of allJobs) {
    const creatorId = creatorIds.get(job.external_id);
    if (creatorId) {
      const name = VINCERE_USER_NAMES[creatorId] || `Unknown (${creatorId})`;
      ownerCounts.set(name, (ownerCounts.get(name) || 0) + 1);
    }
  }

  const sortedOwners = Array.from(ownerCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [name, count] of sortedOwners) {
    console.log(`  ${name}: ${count} jobs`);
  }
}

// Run the backfill
backfillJobOwners().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});

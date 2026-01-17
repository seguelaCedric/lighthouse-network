#!/usr/bin/env npx tsx
/**
 * Backfill Job Owners V2 - Primary and Secondary Owners from Vincere
 *
 * Fetches owners from Vincere API for all existing jobs and updates the database.
 *
 * Primary owner: BD/sales who brought the enquiry
 * Secondary owner: Recruiter assigned to fill the job (gets application emails)
 *
 * Usage:
 *   npx tsx apps/web/scripts/backfill-job-owners-v2.ts [options]
 *
 * Options:
 *   --dry-run     Preview without making changes
 *   --limit=N     Process only N jobs (default: all)
 *   --verbose     Show detailed progress
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VincereClient } from "../lib/vincere/client";
import { getJobOwners, extractOwnerDataForDb } from "../lib/vincere/owners";

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Load env files
const envPaths = [
  join(process.cwd(), "apps/web/.env.local"),
  join(process.cwd(), ".env.local"),
  join(process.cwd(), "apps/web/.env"),
];
for (const envPath of envPaths) {
  loadEnvFile(envPath);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, key);
}

async function backfillJobOwners() {
  console.log("=".repeat(60));
  console.log("Job Owners Backfill Script (V2)");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Initialize clients
  const vincere = new VincereClient();
  await vincere.authenticate();
  console.log("✅ Vincere client authenticated\n");

  const supabase = getSupabaseClient();
  console.log("✅ Supabase client initialized\n");

  // Fetch all Vincere jobs that don't have owners synced yet
  let query = supabase
    .from("jobs")
    .select("id, external_id, title")
    .eq("external_source", "vincere")
    .not("external_id", "is", null)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: jobs, error: jobsError } = await query;

  if (jobsError) {
    console.error("Failed to fetch jobs:", jobsError.message);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    console.log("No Vincere jobs found to process.");
    return;
  }

  console.log(`Found ${jobs.length} Vincere jobs to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let noOwners = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const vincereId = parseInt(job.external_id, 10);
    const progress = `[${i + 1}/${jobs.length}]`;

    if (isNaN(vincereId)) {
      console.log(`${progress} Job ${job.id}: Invalid Vincere ID "${job.external_id}" - skipping`);
      skipped++;
      continue;
    }

    try {
      // Fetch owners from Vincere API
      const owners = await getJobOwners(vincereId, vincere);

      if (!owners.primary && !owners.secondary) {
        if (isVerbose) {
          console.log(`${progress} Job ${vincereId} (${job.title}): No owners found`);
        }
        noOwners++;
        continue;
      }

      const ownerData = extractOwnerDataForDb(owners);

      if (isVerbose || isDryRun) {
        console.log(`${progress} Job ${vincereId} (${job.title}):`);
        if (owners.primary) {
          console.log(`  → Primary: ${owners.primary.full_name} (${owners.primary.email})`);
        }
        if (owners.secondary) {
          console.log(`  → Assigned: ${owners.secondary.full_name} (${owners.secondary.email})`);
        }
      }

      if (isDryRun) {
        updated++;
        continue;
      }

      // Update job in database
      const { error } = await supabase
        .from("jobs")
        .update(ownerData)
        .eq("id", job.id);

      if (error) {
        console.error(`${progress} Job ${vincereId}: Update failed - ${error.message}`);
        errors++;
      } else {
        if (!isVerbose) {
          // Compact output for non-verbose mode
          const primaryName = owners.primary?.full_name || "N/A";
          const secondaryName = owners.secondary?.full_name || "N/A";
          console.log(`${progress} Job ${vincereId}: ✓ Primary: ${primaryName}, Recruiter: ${secondaryName}`);
        } else {
          console.log(`  ✓ Updated`);
        }
        updated++;
      }

      // Rate limiting - 100ms between API calls to avoid hitting Vincere limits
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`${progress} Job ${vincereId}: Error - ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));
  console.log(`  Total processed: ${jobs.length}`);
  console.log(`  Updated:         ${updated}`);
  console.log(`  No owners:       ${noOwners}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Errors:          ${errors}`);

  if (isDryRun) {
    console.log("\n🔍 This was a dry run. Run without --dry-run to apply changes.");
  }
}

// Run the script
backfillJobOwners()
  .then(() => {
    console.log("\n✅ Backfill complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Backfill failed:", err);
    process.exit(1);
  });

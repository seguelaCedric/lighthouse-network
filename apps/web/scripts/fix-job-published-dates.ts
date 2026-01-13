/**
 * Fix job published_at dates to use Vincere created_date
 * 
 * This script updates existing jobs in the database to use the correct
 * created_date from Vincere instead of open_date for the published_at field.
 * 
 * Run: cd apps/web && npx tsx scripts/fix-job-published-dates.ts
 * 
 * Environment variables (from .env.local):
 * - VINCERE_CLIENT_ID
 * - VINCERE_API_KEY
 * - VINCERE_REFRESH_TOKEN
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getVincereClient, getJobById } from "../lib/vincere";

// Manually load .env.local since tsx doesn't do it automatically
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🔧 Fixing job published_at dates to use Vincere created_date\n");

  try {
    // Get all jobs from Vincere
    const { data: jobs, error: fetchError } = await db
      .from("jobs")
      .select("id, external_id, title, published_at")
      .eq("external_source", "vincere")
      .not("external_id", "is", null);

    if (fetchError) {
      console.error("❌ Error fetching jobs:", fetchError);
      process.exit(1);
    }

    if (!jobs || jobs.length === 0) {
      console.log("ℹ️  No jobs from Vincere found in database");
      return;
    }

    console.log(`📋 Found ${jobs.length} jobs from Vincere to update\n`);

    const vincere = getVincereClient();
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process jobs in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            const vincereId = parseInt(job.external_id as string, 10);
            if (isNaN(vincereId)) {
              console.log(`  ⚠️  Skipping job ${job.id}: invalid external_id "${job.external_id}"`);
              skipped++;
              return;
            }

            // Fetch job from Vincere to get created_date
            const vincereJob = await getJobById(vincereId, vincere);
            
            if (!vincereJob) {
              console.log(`  ⚠️  Skipping job ${job.id} (${job.title}): not found in Vincere`);
              skipped++;
              return;
            }

            if (!vincereJob.created_date) {
              console.log(`  ⚠️  Skipping job ${job.id} (${job.title}): no created_date in Vincere`);
              skipped++;
              return;
            }

            // Check if published_at needs updating
            const currentPublishedAt = job.published_at ? new Date(job.published_at).toISOString() : null;
            const vincereCreatedDate = new Date(vincereJob.created_date).toISOString();

            // Only update if different (or if currently null)
            if (currentPublishedAt !== vincereCreatedDate) {
              const { error: updateError } = await db
                .from("jobs")
                .update({ published_at: vincereCreatedDate })
                .eq("id", job.id);

              if (updateError) {
                console.log(`  ❌ Failed to update job ${job.id} (${job.title}): ${updateError.message}`);
                errors++;
              } else {
                console.log(`  ✅ Updated job ${job.id} (${job.title})`);
                console.log(`     Old: ${currentPublishedAt || "null"} → New: ${vincereCreatedDate}`);
                updated++;
              }
            } else {
              console.log(`  ✓ Job ${job.id} (${job.title}) already has correct published_at`);
              skipped++;
            }
          } catch (error) {
            console.log(`  ❌ Error processing job ${job.id} (${job.title}):`, error instanceof Error ? error.message : error);
            errors++;
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${jobs.length}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

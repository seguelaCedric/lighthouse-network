/**
 * Fix multiple jobs by re-syncing them from Vincere
 * 
 * Run: cd apps/web && npx tsx scripts/fix-jobs-batch.ts <job_id1> <job_id2> ...
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getVincereClient, getJobWithCustomFields, mapVincereToJob } from "../lib/vincere";

// Manually load .env.local
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

const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function main() {
  const jobIds = process.argv.slice(2);
  
  if (jobIds.length === 0) {
    console.error("Usage: npx tsx scripts/fix-jobs-batch.ts <job_id1> <job_id2> ...");
    process.exit(1);
  }

  console.log(`\n🔄 Updating ${jobIds.length} jobs from Vincere...\n`);

  const vincere = getVincereClient();
  const db = getSupabaseClient();

  let successCount = 0;
  let errorCount = 0;

  for (const jobIdStr of jobIds) {
    const vincereId = parseInt(jobIdStr, 10);
    if (isNaN(vincereId)) {
      console.error(`⚠️  Skipping invalid job ID: ${jobIdStr}`);
      errorCount++;
      continue;
    }

    try {
      const result = await getJobWithCustomFields(vincereId, vincere);
      
      if (!result) {
        console.error(`❌ Job ${vincereId} not found in Vincere`);
        errorCount++;
        continue;
      }

      const { job, customFields } = result;
      const jobData = mapVincereToJob(job, customFields);

      // Find existing job
      const { data: existing } = await db
        .from("jobs")
        .select("id")
        .eq("external_id", jobData.external_id)
        .eq("external_source", "vincere")
        .single();

      if (!existing) {
        console.error(`❌ Job ${vincereId} not found in database`);
        errorCount++;
        continue;
      }

      // Update job
      const { error } = await db
        .from("jobs")
        .update({
          ...jobData,
        })
        .eq("id", existing.id);

      if (error) {
        console.error(`❌ Failed to update job ${vincereId}: ${error.message}`);
        errorCount++;
        continue;
      }

      console.log(`✅ Updated job ${vincereId}: ${jobData.title}`);
      console.log(`   Contract: ${jobData.contract_type || "N/A"} | Rotation: ${jobData.rotation_schedule || "N/A"} | Vessel Type: ${jobData.vessel_type || "N/A"}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`❌ Error processing job ${vincereId}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${jobIds.length}`);
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

/**
 * Update a single job from Vincere to test mapping fixes
 * 
 * Run: cd apps/web && npx tsx scripts/update-single-job.ts <vincere_job_id>
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
  const jobId = process.argv[2];
  
  if (!jobId) {
    console.error("Usage: npx tsx scripts/update-single-job.ts <vincere_job_id>");
    process.exit(1);
  }

  const vincereId = parseInt(jobId, 10);
  if (isNaN(vincereId)) {
    console.error("Error: Job ID must be a number");
    process.exit(1);
  }

  console.log(`\n🔄 Updating job ${vincereId} from Vincere...\n`);

  try {
    const vincere = getVincereClient();
    const db = getSupabaseClient();

    const result = await getJobWithCustomFields(vincereId, vincere);
    
    if (!result) {
      console.error(`❌ Job ${vincereId} not found in Vincere`);
      process.exit(1);
    }

    const { job, customFields } = result;
    const jobData = mapVincereToJob(job, customFields);

    console.log("📋 Mapped Job Data:");
    console.log(`  Title: ${jobData.title}`);
    console.log(`  Vessel Name: ${jobData.vessel_name || "N/A"}`);
    console.log(`  Vessel Type: ${jobData.vessel_type || "N/A"}`);
    console.log(`  Vessel Size: ${jobData.vessel_size_meters || "N/A"}m`);
    console.log(`  Holiday Days: ${jobData.holiday_days || "N/A"}`);
    console.log(`  Contract Type: ${jobData.contract_type || "N/A"}`);
    console.log(`  Primary Region: ${jobData.primary_region || "N/A"}`);
    console.log(`  Salary: ${jobData.salary_currency} ${jobData.salary_min || "?"}-${jobData.salary_max || "?"}`);

    // Find existing job
    const { data: existing } = await db
      .from("jobs")
      .select("id")
      .eq("external_id", jobData.external_id)
      .eq("external_source", "vincere")
      .single();

    if (!existing) {
      console.error(`❌ Job ${vincereId} not found in database`);
      process.exit(1);
    }

    // Update job
    const { error } = await db
      .from("jobs")
      .update({
        ...jobData,
      })
      .eq("id", existing.id);

    if (error) {
      console.error(`❌ Update failed: ${error.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Successfully updated job ${vincereId} in database`);
    console.log(`   Database ID: ${existing.id}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

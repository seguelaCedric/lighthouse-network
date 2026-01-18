/**
 * Check if an application was synced to Vincere
 *
 * Vincere jobs have candidates shortlisted via the job_application endpoint.
 * This script checks if a candidate appears on a job's shortlist.
 *
 * Run: cd apps/web && npx tsx scripts/check-vincere-application.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

// Load env
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(__dirname, "../.env.local"),
];
for (const p of possiblePaths) {
  loadEnvFile(p);
}

const CANDIDATE_VINCERE_ID = 260172;
const JOB_VINCERE_ID = 58239;

async function main() {
  console.log("=".repeat(60));
  console.log("VINCERE APPLICATION CHECK");
  console.log("=".repeat(60));

  const vincereClientId = process.env.VINCERE_CLIENT_ID;
  const vincereApiKey = process.env.VINCERE_API_KEY;
  const vincereRefreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!vincereClientId || !vincereApiKey || !vincereRefreshToken) {
    console.error("\n❌ Missing Vincere credentials");
    process.exit(1);
  }

  const { VincereClient } = await import("../lib/vincere");

  const client = new VincereClient({
    clientId: vincereClientId,
    apiKey: vincereApiKey,
    refreshToken: vincereRefreshToken,
  });

  await client.authenticate();
  console.log("\n✅ Authenticated with Vincere");

  // Check job applications/shortlist
  console.log(`\n📋 Checking job ${JOB_VINCERE_ID} for candidate ${CANDIDATE_VINCERE_ID}...`);

  try {
    // Get candidate's job applications directly
    const applications = await client.get<Array<{
      id: number;
      candidate_id: number;
      job_id: number;
      stage_id: number;
      stage: string;
      status: string;
    }>>(`/candidate/${CANDIDATE_VINCERE_ID}/applications`);

    console.log(`\n📄 Found ${applications?.length || 0} application(s) for candidate:`);

    if (applications && applications.length > 0) {
      for (const app of applications) {
        const isOurJob = app.job_id === JOB_VINCERE_ID;
        const marker = isOurJob ? "👉 " : "   ";
        console.log(`${marker}Job ${app.job_id} - Stage: ${app.stage || 'Unknown'} (Stage ID: ${app.stage_id})`);
      }

      const ourApp = applications.find(a => a.job_id === JOB_VINCERE_ID);
      if (ourApp) {
        console.log("\n✅ Test candidate IS on the job shortlist!");
        console.log(`   Stage: ${ourApp.stage}`);
      } else {
        console.log("\n⚠️  Test candidate is NOT on this job's shortlist");
        console.log(`   Looking for job ID: ${JOB_VINCERE_ID}`);
      }
    } else {
      console.log("\n⚠️  No applications found for this candidate in Vincere");
      console.log("   Application may not have been synced");
    }
  } catch (err) {
    console.error("\n❌ Error checking applications:", err);
    if (err instanceof Error) {
      console.error("   Message:", err.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("CHECK COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

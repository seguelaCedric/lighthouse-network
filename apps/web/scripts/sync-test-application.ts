/**
 * Sync test application to Vincere
 *
 * Manually syncs the test candidate's application to Vincere.
 *
 * Run: cd apps/web && npx tsx scripts/sync-test-application.ts
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
  console.log("SYNC APPLICATION TO VINCERE");
  console.log("=".repeat(60));

  const vincereClientId = process.env.VINCERE_CLIENT_ID;
  const vincereApiKey = process.env.VINCERE_API_KEY;
  const vincereRefreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!vincereClientId || !vincereApiKey || !vincereRefreshToken) {
    console.error("\n❌ Missing Vincere credentials");
    process.exit(1);
  }

  const { VincereClient, shortlistCandidateOnJob } = await import("../lib/vincere");

  const client = new VincereClient({
    clientId: vincereClientId,
    apiKey: vincereApiKey,
    refreshToken: vincereRefreshToken,
  });

  await client.authenticate();
  console.log("\n✅ Authenticated with Vincere");

  console.log(`\n📤 Shortlisting candidate ${CANDIDATE_VINCERE_ID} on job ${JOB_VINCERE_ID}...`);

  try {
    const result = await shortlistCandidateOnJob(
      JOB_VINCERE_ID,
      CANDIDATE_VINCERE_ID,
      undefined,
      undefined,
      client
    );

    console.log("\n✅ Application synced to Vincere!");
    console.log("   Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("\n❌ Failed to sync application:", err);
    if (err instanceof Error) {
      console.error("   Message:", err.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SYNC COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

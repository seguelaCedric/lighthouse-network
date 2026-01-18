/**
 * Manual Candidate Sync to Vincere
 *
 * Manually triggers syncCandidateCreation for a specific candidate ID.
 *
 * Run: cd apps/web && npx tsx scripts/manual-sync-candidate.ts
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

// Test candidate from earlier testing
const CANDIDATE_ID = "53264c5e-c264-4b76-ab53-efca97e04ed2";

async function main() {
  console.log("=".repeat(60));
  console.log("MANUAL CANDIDATE SYNC TO VINCERE");
  console.log("=".repeat(60));

  // Check env vars
  const vincereClientId = process.env.VINCERE_CLIENT_ID;
  const vincereApiKey = process.env.VINCERE_API_KEY;
  const vincereRefreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!vincereClientId || !vincereApiKey || !vincereRefreshToken) {
    console.error("\n❌ Missing Vincere credentials");
    console.log("   VINCERE_CLIENT_ID:", vincereClientId ? "✓" : "✗");
    console.log("   VINCERE_API_KEY:", vincereApiKey ? "✓" : "✗");
    console.log("   VINCERE_REFRESH_TOKEN:", vincereRefreshToken ? "✓" : "✗");
    process.exit(1);
  }

  console.log("\n✅ Vincere credentials found");

  const { syncCandidateCreation } = await import("../lib/vincere/sync-service");

  console.log(`\n📤 Syncing candidate ${CANDIDATE_ID} to Vincere...`);

  try {
    const result = await syncCandidateCreation(CANDIDATE_ID);

    console.log("\n📋 Sync result:");
    console.log("   Success:", result.success);
    if (result.vincereId) {
      console.log("   Vincere ID:", result.vincereId);
    }
    if (result.error) {
      console.log("   Error:", result.error);
    }
    if (result.queued) {
      console.log("   Queued for retry:", result.queued);
    }

    if (result.success) {
      console.log("\n✅ Candidate synced to Vincere!");
    } else {
      console.log("\n⚠️  Sync failed");
    }
  } catch (err) {
    console.error("\n❌ Sync threw an error:", err);
    if (err instanceof Error) {
      console.error("   Message:", err.message);
      console.error("   Stack:", err.stack);
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

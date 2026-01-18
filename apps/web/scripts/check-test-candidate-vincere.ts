/**
 * Check Test Candidate in Vincere
 *
 * Verifies the test candidate was synced correctly with all their files.
 *
 * Run: cd apps/web && npx tsx scripts/check-test-candidate-vincere.ts
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

const VINCERE_ID = 260172;

async function main() {
  // Dynamic imports after env loaded
  const { VincereClient, getCandidateWithCustomFields, getCandidateFiles, getCandidateCVFile } =
    await import("../lib/vincere");

  console.log("=".repeat(60));
  console.log("TEST CANDIDATE VINCERE VERIFICATION");
  console.log("=".repeat(60));

  // Validate environment
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    console.error("\n❌ Missing Vincere environment variables");
    process.exit(1);
  }

  const client = new VincereClient({ clientId, apiKey, refreshToken });

  console.log("\n🔐 Authenticating with Vincere...");
  await client.authenticate();
  console.log("   ✅ Authenticated successfully!\n");

  // Get candidate data
  console.log(`📋 Fetching candidate ID ${VINCERE_ID}...`);
  const data = await getCandidateWithCustomFields(VINCERE_ID, client);

  if (!data) {
    console.log("   ❌ Candidate not found!");
    process.exit(1);
  }

  const { candidate } = data;
  console.log(`   ✅ Found: ${candidate.first_name} ${candidate.last_name}`);
  console.log(`   Email: ${candidate.email}`);
  console.log(`   Phone: ${candidate.phone || candidate.mobile || "N/A"}`);

  // Get files
  console.log("\n📁 Checking files...");
  const files = await getCandidateFiles(VINCERE_ID, client);

  if (files.length === 0) {
    console.log("   ⚠️  No files found in Vincere");
  } else {
    console.log(`   Found ${files.length} file(s):`);
    for (const file of files) {
      const type = file.original_cv ? "CV" : "Document";
      console.log(`   - [${type}] ${file.file_name || "Unknown"} (ID: ${file.id})`);
    }
  }

  // Check CV specifically
  console.log("\n📄 CV Check...");
  const cvFile = await getCandidateCVFile(VINCERE_ID, client);
  if (cvFile) {
    console.log(`   ✅ CV found: ${cvFile.file_name}`);
  } else {
    console.log("   ⚠️  No CV found in Vincere");
    console.log("   Note: CV was uploaded to Supabase but may not have synced to Vincere");
  }

  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

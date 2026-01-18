/**
 * Inspect Vincere Candidates
 *
 * Fetches and displays full data from Vincere for specific candidates,
 * including all files (photos, CVs, certificates) to debug avatar issues.
 *
 * Run: cd apps/web && npx tsx scripts/inspect-vincere-candidates.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  VincereClient,
  getCandidateWithCustomFields,
  getCandidateFiles,
  getCandidatePhotoFile,
  getCandidateCVFile,
} from "../lib/vincere";

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

// The 3 candidates to inspect
const CANDIDATES_TO_INSPECT = [
  { email: "karlo.pahlic@hotmail.com", vincereId: 91535, name: "Karlo Pahlic" },
  { email: "charlie@fisk.pro", vincereId: 70628, name: "Charlie Fisk" },
  { email: "annakhickey@outlook.com", vincereId: 72799, name: "Anna Hickey" },
];

async function main() {
  console.log("=".repeat(70));
  console.log("VINCERE CANDIDATE INSPECTION");
  console.log("=".repeat(70));

  // Validate environment variables
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    console.error("\nMissing environment variables:");
    console.error("  VINCERE_CLIENT_ID:", clientId ? "set" : "MISSING");
    console.error("  VINCERE_API_KEY:", apiKey ? "set" : "MISSING");
    console.error("  VINCERE_REFRESH_TOKEN:", refreshToken ? "set" : "MISSING");
    process.exit(1);
  }

  // Create Vincere client
  const client = new VincereClient({
    clientId,
    apiKey,
    refreshToken,
  });

  console.log("\nAuthenticating with Vincere...");
  await client.authenticate();
  console.log("Authenticated successfully!\n");

  for (const candidateInfo of CANDIDATES_TO_INSPECT) {
    console.log("=".repeat(70));
    console.log(`CANDIDATE: ${candidateInfo.name}`);
    console.log(`Email: ${candidateInfo.email}`);
    console.log(`Vincere ID: ${candidateInfo.vincereId}`);
    console.log("=".repeat(70));

    try {
      // 1. Get basic candidate data
      console.log("\n📋 BASIC CANDIDATE DATA:");
      const data = await getCandidateWithCustomFields(candidateInfo.vincereId, client);

      if (!data) {
        console.log("  ❌ Candidate not found in Vincere!");
        continue;
      }

      const { candidate } = data;
      console.log(`  Name: ${candidate.first_name} ${candidate.last_name}`);
      console.log(`  Email: ${candidate.primary_email || candidate.email}`);
      console.log(`  Job Title: ${candidate.job_title || "N/A"}`);
      console.log(`  Created: ${candidate.created_date}`);
      console.log(`  Updated: ${candidate.updated_date || "N/A"}`);

      // 2. Try the dedicated /photo endpoint
      console.log("\n🖼️ TRYING GET /candidate/{id}/photo ENDPOINT:");
      try {
        const photoResponse = await client.get<unknown>(`/candidate/${candidateInfo.vincereId}/photo`);
        console.log("  Photo endpoint response:");
        console.log(JSON.stringify(photoResponse, null, 2));
      } catch (err) {
        console.log(`  Photo endpoint error: ${err instanceof Error ? err.message : err}`);
      }

      // 3. Get ALL files
      console.log("\n📁 ALL FILES IN VINCERE:");
      const files = await getCandidateFiles(candidateInfo.vincereId, client);

      if (files.length === 0) {
        console.log("  No files found");
      } else {
        console.log(`  Total files: ${files.length}\n`);

        for (const file of files) {
          console.log(`  ┌─ File ID: ${file.id}`);
          console.log(`  │  Name: ${file.file_name || "N/A"}`);
          console.log(`  │  Is CV (original_cv): ${file.original_cv ? "YES ✅" : "No"}`);
          console.log(`  │  Document Type ID: ${file.document_type_id || "N/A"}`);
          console.log(`  │  Uploaded: ${file.uploaded_date || "N/A"}`);
          console.log(`  │  Expiry: ${file.expiry_date || "N/A"}`);
          if (file.url) {
            console.log(`  │  URL: ${file.url.substring(0, 100)}...`);
          }
          console.log(`  └────────────────────────────────────────`);
        }
      }

      // 4. What our system currently picks as photo
      console.log("\n🎯 WHAT OUR SYSTEM PICKS AS PHOTO:");
      const photoFile = await getCandidatePhotoFile(candidateInfo.vincereId, client);
      if (photoFile) {
        console.log(`  Selected: ${photoFile.file_name} (ID: ${photoFile.id})`);
      } else {
        console.log("  ❌ No photo selected");
      }

      // 5. CV selection
      console.log("\n📄 CV SELECTION:");
      const cvFile = await getCandidateCVFile(candidateInfo.vincereId, client);
      if (cvFile) {
        console.log(`  Selected: ${cvFile.file_name} (ID: ${cvFile.id})`);
      } else {
        console.log("  ❌ No CV found");
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }

    console.log("\n");
  }

  console.log("=".repeat(70));
  console.log("INSPECTION COMPLETE");
  console.log("=".repeat(70));
}

main().catch(console.error);

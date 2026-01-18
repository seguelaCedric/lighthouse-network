/**
 * Test CV Sync to Vincere
 *
 * This script tests the full CV sync flow to diagnose why documents
 * aren't being uploaded to Vincere.
 *
 * Run: cd apps/web && npx tsx scripts/test-cv-sync.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const CANDIDATE_ID = "79ae1bf7-5225-4684-a6ad-9bc6bade0aa3"; // Test candidate
const VINCERE_ID = 260172;

async function main() {
  console.log("=".repeat(60));
  console.log("CV SYNC TEST");
  console.log("=".repeat(60));

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vincereClientId = process.env.VINCERE_CLIENT_ID;
  const vincereApiKey = process.env.VINCERE_API_KEY;
  const vincereRefreshToken = process.env.VINCERE_REFRESH_TOKEN;

  console.log("\n📋 Environment Check:");
  console.log(`  SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`  VINCERE_CLIENT_ID: ${vincereClientId ? "✅ Set" : "❌ Missing"}`);
  console.log(`  VINCERE_API_KEY: ${vincereApiKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`  VINCERE_REFRESH_TOKEN: ${vincereRefreshToken ? "✅ Set" : "❌ Missing"}`);

  if (!supabaseUrl || !supabaseKey) {
    console.error("\n❌ Missing Supabase credentials");
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Get the candidate's CV document
  console.log("\n📄 Step 1: Fetching CV document from Supabase...");
  const { data: cvDoc, error: cvError } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_id", CANDIDATE_ID)
    .eq("type", "cv")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (cvError || !cvDoc) {
    console.error("  ❌ No CV document found:", cvError?.message);
    process.exit(1);
  }

  console.log(`  ✅ Found CV: ${cvDoc.name}`);
  console.log(`  File URL: ${cvDoc.file_url}`);
  console.log(`  File Path: ${cvDoc.file_path}`);

  // Step 2: Try to create a signed URL
  console.log("\n🔑 Step 2: Creating signed URL...");

  // Extract file path from URL
  const urlMatch = cvDoc.file_url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
  if (!urlMatch) {
    console.error("  ❌ Could not extract file path from URL");
    console.log("  URL format:", cvDoc.file_url);
    process.exit(1);
  }

  const filePath = urlMatch[1];
  console.log(`  File path: ${filePath}`);

  const { data: signedData, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 3600);

  if (signError) {
    console.error("  ❌ Failed to create signed URL:", signError.message);
    console.error("  Details:", signError);
    process.exit(1);
  }

  console.log(`  ✅ Signed URL created`);
  console.log(`  URL: ${signedData.signedUrl.substring(0, 80)}...`);

  // Step 3: Verify the signed URL works
  console.log("\n🌐 Step 3: Testing signed URL access...");
  try {
    const response = await fetch(signedData.signedUrl, { method: "HEAD" });
    console.log(`  Status: ${response.status}`);
    console.log(`  Content-Type: ${response.headers.get("content-type")}`);
    console.log(`  Content-Length: ${response.headers.get("content-length")} bytes`);

    if (!response.ok) {
      console.error("  ❌ Signed URL not accessible");
      process.exit(1);
    }
    console.log("  ✅ Signed URL is accessible");
  } catch (err) {
    console.error("  ❌ Failed to access signed URL:", err);
    process.exit(1);
  }

  // Step 4: Try to upload to Vincere
  if (!vincereClientId || !vincereApiKey || !vincereRefreshToken) {
    console.log("\n⚠️  Skipping Vincere upload - credentials not available");
    process.exit(0);
  }

  console.log("\n📤 Step 4: Uploading to Vincere...");

  const { VincereClient } = await import("../lib/vincere");
  const { uploadCandidateCVByUrl } = await import("../lib/vincere/files");

  const client = new VincereClient({
    clientId: vincereClientId,
    apiKey: vincereApiKey,
    refreshToken: vincereRefreshToken,
  });

  await client.authenticate();
  console.log("  ✅ Authenticated with Vincere");

  try {
    const result = await uploadCandidateCVByUrl(
      VINCERE_ID,
      signedData.signedUrl,
      cvDoc.name,
      client
    );
    console.log("  ✅ CV uploaded to Vincere!");
    console.log("  File ID:", result?.id);
  } catch (err) {
    console.error("  ❌ Failed to upload to Vincere:", err);
    if (err instanceof Error) {
      console.error("  Error message:", err.message);
      console.error("  Stack:", err.stack);
    }
    process.exit(1);
  }

  // Step 5: Verify upload
  console.log("\n✅ Step 5: Verifying upload in Vincere...");
  const { getCandidateFiles } = await import("../lib/vincere");
  const files = await getCandidateFiles(VINCERE_ID, client);

  console.log(`  Found ${files.length} file(s) in Vincere:`);
  for (const file of files) {
    const type = file.original_cv ? "CV" : "Document";
    console.log(`  - [${type}] ${file.file_name} (ID: ${file.id})`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

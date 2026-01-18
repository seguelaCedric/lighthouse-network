/**
 * Backfill Candidate Avatars
 *
 * Re-syncs all candidate avatars from Vincere using the new logic that
 * correctly identifies profile photos (document_type_id = null).
 *
 * Run: cd apps/web && npx tsx scripts/backfill-avatars.ts
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit=N    Process only N candidates (for testing)
 *   --offset=N   Start from candidate N (for resuming)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  VincereClient,
  getCandidatePhotoFile,
  downloadFile,
  getFileExtension,
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

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
const offsetArg = args.find((arg) => arg.startsWith("--offset="));
const offset = offsetArg ? parseInt(offsetArg.split("=")[1], 10) : 0;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=".repeat(70));
  console.log("BACKFILL CANDIDATE AVATARS");
  console.log("=".repeat(70));
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  if (limit) console.log(`Limit: ${limit} candidates`);
  if (offset) console.log(`Offset: starting from candidate ${offset}`);
  console.log("");

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create Vincere client
  const vincere = new VincereClient();
  await vincere.authenticate();
  console.log("Authenticated with Vincere\n");

  // Get all candidates with vincere_id and avatar_url
  // Supabase has a 1000 row limit, so we need to paginate
  console.log("Fetching candidates from database...");

  const PAGE_SIZE = 1000;
  let allCandidates: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    vincere_id: string;
    avatar_url: string | null;
  }> = [];

  let currentOffset = offset;
  let hasMore = true;

  while (hasMore) {
    const endRange = limit
      ? Math.min(currentOffset + PAGE_SIZE - 1, offset + limit - 1)
      : currentOffset + PAGE_SIZE - 1;

    // Fetch ALL candidates with vincere_id (not just those with avatars)
    const { data: batch, error: batchError } = await supabase
      .from("candidates")
      .select("id, email, first_name, last_name, vincere_id, avatar_url")
      .not("vincere_id", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .range(currentOffset, endRange);

    if (batchError) {
      console.error("Error fetching candidates:", batchError.message);
      process.exit(1);
    }

    if (batch && batch.length > 0) {
      allCandidates = allCandidates.concat(batch);
      console.log(`  Fetched ${allCandidates.length} candidates so far...`);
      currentOffset += PAGE_SIZE;

      // Check if we've hit the limit or got less than a full page
      if (batch.length < PAGE_SIZE || (limit && allCandidates.length >= limit)) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  const candidates = limit ? allCandidates.slice(0, limit) : allCandidates;
  const error = null;

  if (error) {
    console.error("Error fetching candidates:", error.message);
    process.exit(1);
  }

  console.log(`Found ${candidates?.length || 0} candidates to process\n`);

  // Stats
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let noPhoto = 0;
  let errors = 0;
  let alreadyCorrect = 0;

  for (const candidate of candidates || []) {
    processed++;
    const vincereId = parseInt(candidate.vincere_id, 10);
    const name = `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || candidate.email;

    process.stdout.write(`[${processed}/${candidates?.length}] ${name} (${vincereId})... `);

    try {
      // Get the correct photo from Vincere using new logic
      const photoFile = await getCandidatePhotoFile(vincereId, vincere);

      if (!photoFile) {
        console.log("no photo in Vincere");
        noPhoto++;
        continue;
      }

      // Check if it's a real profile photo (document_type_id = null)
      const isRealProfilePhoto = photoFile.document_type_id === null || photoFile.document_type_id === undefined;

      if (!isRealProfilePhoto) {
        console.log(`skipped (no profile photo, only documents)`);
        skipped++;
        continue;
      }

      // Check if current avatar already uses this photo (by file ID in URL)
      const currentUrl = candidate.avatar_url || "";
      if (currentUrl.includes(`${vincereId}_photo_`) && currentUrl.includes(`/${photoFile.id}_`)) {
        console.log("already correct");
        alreadyCorrect++;
        continue;
      }

      if (dryRun) {
        console.log(`would update -> ${photoFile.file_name}`);
        updated++;
        continue;
      }

      // Download the photo
      const fileBuffer = await downloadFile(vincereId, photoFile.id, vincere, photoFile.url);

      // Upload to Supabase storage
      const ext = getFileExtension(photoFile);
      const storagePath = `candidates/${candidate.id}/photo/${vincereId}_photo_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, fileBuffer, {
          contentType: photoFile.content_type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.log(`upload error: ${uploadError.message}`);
        errors++;
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
      const newAvatarUrl = urlData.publicUrl;

      // Update candidate
      const { error: updateError } = await supabase
        .from("candidates")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", candidate.id);

      if (updateError) {
        console.log(`update error: ${updateError.message}`);
        errors++;
        continue;
      }

      console.log(`✅ updated -> ${photoFile.file_name}`);
      updated++;

      // Small delay to avoid rate limiting
      await sleep(100);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`error: ${message.substring(0, 50)}`);
      errors++;

      // If rate limited, wait longer
      if (message.includes("429") || message.includes("rate")) {
        console.log("  Rate limited, waiting 30s...");
        await sleep(30000);
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Processed:       ${processed}`);
  console.log(`Updated:         ${updated}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`No photo:        ${noPhoto}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Errors:          ${errors}`);
  console.log("=".repeat(70));
}

main().catch(console.error);

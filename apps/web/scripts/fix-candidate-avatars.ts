/**
 * Fix Candidate Avatars
 *
 * Updates specific candidates with correct profile photos from Vincere.
 * Uses the new logic that identifies profile photos by document_type_id = null.
 *
 * Run: cd apps/web && npx tsx scripts/fix-candidate-avatars.ts
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

// The 3 candidates to fix
const CANDIDATES_TO_FIX = [
  { email: "karlo.pahlic@hotmail.com", vincereId: 91535, name: "Karlo Pahlic" },
  { email: "charlie@fisk.pro", vincereId: 70628, name: "Charlie Fisk" },
  { email: "annakhickey@outlook.com", vincereId: 72799, name: "Anna Hickey" },
];

async function main() {
  console.log("=".repeat(70));
  console.log("FIX CANDIDATE AVATARS");
  console.log("=".repeat(70));

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
  console.log("\nAuthenticated with Vincere\n");

  for (const candidateInfo of CANDIDATES_TO_FIX) {
    console.log("-".repeat(70));
    console.log(`Processing: ${candidateInfo.name} (${candidateInfo.email})`);

    // Get candidate from DB
    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("id, avatar_url")
      .eq("email", candidateInfo.email)
      .is("deleted_at", null)
      .single();

    if (error || !candidate) {
      console.log("  ERROR: Candidate not found in DB");
      continue;
    }

    console.log(`  Candidate ID: ${candidate.id}`);
    if (candidate.avatar_url) {
      console.log(`  Current avatar: ${candidate.avatar_url.substring(0, 80)}...`);
    }

    // Get correct photo from Vincere using new logic
    const photoFile = await getCandidatePhotoFile(candidateInfo.vincereId, vincere);
    if (!photoFile) {
      console.log("  No photo found in Vincere");
      continue;
    }

    console.log(`  Vincere photo: ${photoFile.file_name} (ID: ${photoFile.id})`);
    console.log(`  Document Type ID: ${photoFile.document_type_id ?? "null (profile photo)"}`);

    // Download the photo
    const fileBuffer = await downloadFile(
      candidateInfo.vincereId,
      photoFile.id,
      vincere,
      photoFile.url
    );
    console.log(`  Downloaded: ${fileBuffer.byteLength} bytes`);

    // Upload to Supabase storage
    const ext = getFileExtension(photoFile);
    const storagePath = `candidates/${candidate.id}/photo/${candidateInfo.vincereId}_photo_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, fileBuffer, {
        contentType: photoFile.content_type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.log(`  Upload error: ${uploadError.message}`);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
    const newAvatarUrl = urlData.publicUrl;
    console.log(`  New avatar URL: ${newAvatarUrl.substring(0, 80)}...`);

    // Update candidate
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", candidate.id);

    if (updateError) {
      console.log(`  Update error: ${updateError.message}`);
    } else {
      console.log(`  ✅ Avatar updated successfully!`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("DONE");
  console.log("=".repeat(70));
}

main().catch(console.error);

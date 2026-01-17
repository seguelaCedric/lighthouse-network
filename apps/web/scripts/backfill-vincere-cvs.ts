#!/usr/bin/env npx tsx
/**
 * Backfill Vincere CVs
 *
 * Syncs CVs to Vincere for candidates whose documents are missing vincere_file_id.
 * Primarily targets self-registration candidates whose CVs weren't synced due to
 * the metadata update bug.
 *
 * Usage:
 *   npx tsx apps/web/scripts/backfill-vincere-cvs.ts [options]
 *
 * Options:
 *   --dry-run         Preview without making changes
 *   --limit=N         Process only N documents (default: all)
 *   --self-reg-only   Only process self-registration candidates
 *   --verbose         Show detailed progress
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VincereClient, getVincereClient } from "../lib/vincere/client";
import { uploadCandidateCVByUrl, VINCERE_DOCUMENT_TYPES } from "../lib/vincere/files";

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Load env files
const envPaths = [
  join(process.cwd(), "apps/web/.env.local"),
  join(process.cwd(), ".env.local"),
  join(process.cwd(), "apps/web/.env"),
];
for (const envPath of envPaths) {
  loadEnvFile(envPath);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");
const selfRegOnly = args.includes("--self-reg-only");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

async function main() {
  console.log("\n=== Backfill Vincere CVs ===\n");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Self-registration only: ${selfRegOnly}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // Fetch documents that need syncing
  let query = supabase
    .from("documents")
    .select(`
      id,
      entity_id,
      type,
      name,
      file_url,
      metadata,
      created_at,
      candidates!inner (
        id,
        first_name,
        last_name,
        email,
        vincere_id,
        source
      )
    `)
    .eq("entity_type", "candidate")
    .eq("type", "cv")
    .not("candidates.vincere_id", "is", null)
    .or("metadata.is.null,metadata.eq.{}");

  if (selfRegOnly) {
    query = query.eq("candidates.source", "self_registration");
  }

  query = query.order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: documents, error: fetchError } = await query;

  if (fetchError) {
    console.error("Error fetching documents:", fetchError);
    process.exit(1);
  }

  if (!documents || documents.length === 0) {
    console.log("No documents need syncing!");
    return;
  }

  console.log(`Found ${documents.length} documents to sync\n`);

  let vincere: VincereClient | null = null;
  if (!isDryRun) {
    try {
      vincere = getVincereClient();
    } catch (e) {
      console.error("Failed to get Vincere client:", e);
      process.exit(1);
    }
  }

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (const doc of documents) {
    const candidate = Array.isArray(doc.candidates) ? doc.candidates[0] : doc.candidates;
    if (!candidate?.vincere_id) {
      console.log(`Skip: ${doc.id} - No vincere_id`);
      skipCount++;
      continue;
    }

    const vincereId = parseInt(candidate.vincere_id);
    const candidateName = `${candidate.first_name} ${candidate.last_name}`;

    if (isVerbose) {
      console.log(`\nProcessing: ${candidateName} (Vincere ID: ${vincereId})`);
      console.log(`  Document: ${doc.name}`);
      console.log(`  URL: ${doc.file_url}`);
    }

    if (isDryRun) {
      console.log(`[DRY RUN] Would sync CV for ${candidateName} (${vincereId})`);
      successCount++;
      continue;
    }

    try {
      // Generate signed URL for Vincere to access
      const urlMatch = doc.file_url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
      let signedUrl = doc.file_url;

      if (urlMatch) {
        const filePath = urlMatch[1];
        const { data: signedData, error: signError } = await supabase.storage
          .from("documents")
          .createSignedUrl(filePath, 3600);

        if (signError) {
          console.error(`  Error creating signed URL: ${signError.message}`);
          errorCount++;
          continue;
        }

        if (signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      }

      // Upload to Vincere
      const uploadResult = await uploadCandidateCVByUrl(vincereId, signedUrl, doc.name, vincere!);

      if (uploadResult?.id) {
        // Update document metadata
        const { error: updateError } = await supabase
          .from("documents")
          .update({
            metadata: {
              vincere_file_id: uploadResult.id,
              vincere_candidate_id: vincereId,
              original_filename: doc.name,
            },
          })
          .eq("id", doc.id);

        if (updateError) {
          console.error(`  Error updating metadata: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✓ Synced CV for ${candidateName} (file_id: ${uploadResult.id})`);
          successCount++;
        }
      } else {
        console.error(`  No file ID returned from Vincere`);
        errorCount++;
      }

      // Rate limiting - wait 200ms between requests
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`✗ Error syncing CV for ${candidateName}: ${error}`);
      errorCount++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Success: ${successCount}`);
  console.log(`Errors:  ${errorCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Total:   ${documents.length}`);
}

main().catch(console.error);

/**
 * CV Backfill Script
 *
 * Processes CVs for candidates imported from Bubble CSV.
 * Runs separately from main import with better timeout handling.
 *
 * Usage:
 *   npx tsx scripts/bubble-cv-backfill.ts --candidates=scripts/data/bubble-candidates.csv
 *   npx tsx scripts/bubble-cv-backfill.ts --candidates=scripts/data/bubble-candidates.csv --resume
 *   npx tsx scripts/bubble-cv-backfill.ts --candidates=scripts/data/bubble-candidates.csv --limit=100
 */

import { createReadStream } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { existsSync, readFileSync, writeFileSync } from "fs";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Import existing utilities
import { extractText } from "../lib/services/text-extraction";
import {
  extractFromCVSafe,
  buildSearchKeywords,
  generateEmbedding,
  buildUnifiedCandidateEmbeddingText,
} from "@lighthouse/ai";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROGRESS_FILE = resolve(__dirname, ".bubble-cv-backfill-progress.json");
const DEFAULT_ORG_ID = process.env.VINCERE_ORG_ID || "00000000-0000-0000-0000-000000000001";
const BATCH_SIZE = 20; // Batch size for processing
const CONCURRENCY = 5; // Number of parallel CV processes
const DOWNLOAD_TIMEOUT = 30000; // 30 second timeout for downloads
const MAX_RETRIES = 2;

// ============================================================================
// TYPES
// ============================================================================

interface BackfillProgress {
  startedAt: string;
  csvPath: string;
  totalWithCVs: number;
  lastProcessedRow: number;
  processedCount: number;
  uploadedCount: number;
  extractedCount: number;
  embeddedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

interface CSVRow {
  email: string;
  cvFile: string;
  avatar: string;
  nameFirst: string;
  nameLast: string;
  rowNumber: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message: string): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

function loadProgress(): BackfillProgress | null {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

function saveProgress(progress: BackfillProgress): void {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function normalizeBubbleUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  let normalized = url.trim();

  // Handle protocol-relative URLs
  if (normalized.startsWith("//")) {
    normalized = "https:" + normalized;
  }

  // Handle missing protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

// ============================================================================
// CV PROCESSING
// ============================================================================

async function downloadWithTimeout(url: string, timeoutMs: number): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function processCV(
  candidateId: string,
  cvUrl: string,
  supabase: SupabaseClient
): Promise<{ uploaded: boolean; extracted: boolean; embedded: boolean; error?: string }> {
  const normalizedUrl = normalizeBubbleUrl(cvUrl);
  if (!normalizedUrl) {
    return { uploaded: false, extracted: false, embedded: false, error: "Invalid URL" };
  }

  try {
    // Download CV with timeout
    let buffer: ArrayBuffer;
    try {
      buffer = await downloadWithTimeout(normalizedUrl, DOWNLOAD_TIMEOUT);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("aborted") || errorMsg.includes("abort")) {
        return { uploaded: false, extracted: false, embedded: false, error: "Download timeout" };
      }
      return { uploaded: false, extracted: false, embedded: false, error: `Download failed: ${errorMsg}` };
    }

    // Determine file extension
    const urlPath = new URL(normalizedUrl).pathname;
    let ext = urlPath.split(".").pop()?.toLowerCase() || "pdf";
    if (ext.length > 5) ext = "pdf";

    const contentType = ext === "pdf" ? "application/pdf" :
                       ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
                       ext === "doc" ? "application/msword" : "application/octet-stream";

    // Upload to storage
    const filename = `cv_${Date.now()}.${ext}`;
    const storagePath = `candidate/${candidateId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, Buffer.from(buffer), {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { uploaded: false, extracted: false, embedded: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath);

    // Extract text from CV
    let extractedText = "";
    try {
      const extractionResult = await extractText(buffer, contentType, filename);
      if (extractionResult.text && extractionResult.text.length > 50) {
        extractedText = extractionResult.text;
      }
    } catch (err) {
      // Continue without text extraction
    }

    // Create document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        entity_type: "candidate",
        entity_id: candidateId,
        type: "cv",
        name: filename,
        file_url: urlData.publicUrl,
        file_path: storagePath,
        file_size: buffer.byteLength,
        mime_type: contentType,
        status: "approved",
        is_latest_version: true,
        extracted_text: extractedText || null,
        organization_id: DEFAULT_ORG_ID,
        metadata: { source: "bubble_cv_backfill" },
      })
      .select("id")
      .single();

    if (docError || !doc) {
      return { uploaded: true, extracted: false, embedded: false, error: `Document record failed: ${docError?.message}` };
    }

    const documentId = doc.id;

    // If no text extracted, we're done
    if (!extractedText || extractedText.length < 100) {
      return { uploaded: true, extracted: false, embedded: false, error: "No text extracted" };
    }

    // AI extraction
    const extractionResponse = await extractFromCVSafe({
      cv_text: extractedText,
      candidate_id: candidateId,
      document_id: documentId,
    });

    if (!extractionResponse.success || !extractionResponse.extraction) {
      return { uploaded: true, extracted: false, embedded: false, error: "AI extraction failed" };
    }

    const extraction = extractionResponse.extraction;

    // Build search keywords
    const searchKeywords = buildSearchKeywords(extraction);

    // Update candidate with extracted data
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        years_experience: extraction.years_experience,
        primary_position: extraction.primary_position || undefined,
        position_category: extraction.position_category || undefined,
        highest_license: extraction.highest_license || undefined,
        has_stcw: extraction.has_stcw,
        has_eng1: extraction.has_eng1,
        positions_held: extraction.positions_held?.map((p) => p.normalized) || [],
        positions_extracted: extraction.positions_held,
        licenses_extracted: extraction.licenses,
        languages_extracted: extraction.languages,
        cv_skills: searchKeywords,
        yacht_experience_extracted: extraction.yacht_experience,
        villa_experience_extracted: extraction.villa_experience,
        education_extracted: extraction.education,
        references_extracted: extraction.references,
        certifications_extracted: extraction.certifications,
        cv_extracted_at: new Date().toISOString(),
        cv_extraction_version: 1,
        extraction_confidence: extraction.extraction_confidence,
        extraction_notes: extraction.extraction_notes,
        search_keywords: searchKeywords,
      })
      .eq("id", candidateId);

    if (updateError) {
      return { uploaded: true, extracted: false, embedded: false, error: `Update failed: ${updateError.message}` };
    }

    // Get candidate for embedding
    const { data: candidate, error: candError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candError || !candidate) {
      return { uploaded: true, extracted: true, embedded: false, error: "Candidate not found for embedding" };
    }

    // Build and generate embedding
    const embeddingText = buildUnifiedCandidateEmbeddingText(
      {
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        primary_position: candidate.primary_position,
        secondary_positions: candidate.secondary_positions,
        years_experience: candidate.years_experience,
        nationality: candidate.nationality,
        second_nationality: candidate.second_nationality,
        current_location: candidate.current_location,
        has_stcw: candidate.has_stcw,
        has_eng1: candidate.has_eng1,
        highest_license: candidate.highest_license,
        has_schengen: candidate.has_schengen,
        has_b1b2: candidate.has_b1b2,
        has_c1d: candidate.has_c1d,
        preferred_yacht_types: candidate.preferred_yacht_types,
        preferred_regions: candidate.preferred_regions,
        preferred_contract_types: candidate.preferred_contract_types,
        is_smoker: candidate.is_smoker,
        has_visible_tattoos: candidate.has_visible_tattoos,
        is_couple: candidate.is_couple,
        partner_position: candidate.partner_position,
        profile_summary: candidate.profile_summary,
        search_keywords: candidate.search_keywords,
      },
      [{
        type: "cv",
        extracted_text: extractedText,
        visibility: "recruiter" as const,
      }],
      [],
      [],
      "recruiter"
    );

    if (embeddingText.length < 50) {
      return { uploaded: true, extracted: true, embedded: false, error: "Insufficient embedding text" };
    }

    const embedding = await generateEmbedding(embeddingText);

    const { error: embeddingError } = await supabase
      .from("candidates")
      .update({
        embedding: embedding,
        embedding_text: embeddingText,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (embeddingError) {
      return { uploaded: true, extracted: true, embedded: false, error: `Embedding failed: ${embeddingError.message}` };
    }

    return { uploaded: true, extracted: true, embedded: true };
  } catch (error) {
    return { uploaded: false, extracted: false, embedded: false, error: String(error) };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("BUBBLE CV BACKFILL");
  console.log("=".repeat(60));

  // Parse arguments
  const args = process.argv.slice(2);
  let csvPath = "";
  let shouldResume = false;
  let limit = 0;

  for (const arg of args) {
    if (arg.startsWith("--candidates=")) {
      csvPath = arg.split("=")[1];
    } else if (arg === "--resume") {
      shouldResume = true;
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10);
    }
  }

  if (!csvPath) {
    console.error("Error: --candidates=<path> is required");
    process.exit(1);
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Resume: ${shouldResume}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log("=".repeat(60));

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load or initialize progress
  let progress: BackfillProgress = shouldResume && loadProgress()
    ? loadProgress()!
    : {
        startedAt: new Date().toISOString(),
        csvPath,
        totalWithCVs: 0,
        lastProcessedRow: 0,
        processedCount: 0,
        uploadedCount: 0,
        extractedCount: 0,
        embeddedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
      };

  // First pass: count CVs and build email-to-CV mapping
  log("Scanning CSV for CV files...");

  const cvEntries: CSVRow[] = [];
  let rowNumber = 0;

  const fullCsvPath = resolve(__dirname, csvPath);
  await new Promise<void>((resolvePromise, reject) => {
    const parser = createReadStream(fullCsvPath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
      })
    );

    parser.on("data", (row: Record<string, string>) => {
      rowNumber++;

      // Skip already processed rows
      if (rowNumber <= progress.lastProcessedRow) return;

      const email = row["email"]?.toLowerCase().trim();
      const cvFile = row["CV file"]?.trim();
      const avatar = row["Avatar"]?.trim();
      const nameFirst = row["Name First"]?.trim();
      const nameLast = row["Name Last"]?.trim();

      // Only include rows with CV files and names
      if (cvFile && (nameFirst || nameLast)) {
        cvEntries.push({
          email,
          cvFile,
          avatar,
          nameFirst,
          nameLast,
          rowNumber,
        });
      }
    });

    parser.on("end", () => resolvePromise());
    parser.on("error", (err) => reject(err));
  });

  progress.totalWithCVs = cvEntries.length + progress.processedCount;
  log(`Found ${cvEntries.length} candidates with CVs to process`);

  if (cvEntries.length === 0) {
    log("No CVs to process. Done.");
    return;
  }

  // Process CVs in batches
  let processed = 0;
  const total = limit ? Math.min(limit, cvEntries.length) : cvEntries.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = cvEntries.slice(i, Math.min(i + BATCH_SIZE, total));

    log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${i + batch.length} of ${total}) with ${CONCURRENCY} parallel workers...`);

    // Process batch in parallel chunks
    for (let j = 0; j < batch.length; j += CONCURRENCY) {
      const chunk = batch.slice(j, j + CONCURRENCY);

      const results = await Promise.all(
        chunk.map(async (entry) => {
          // Find candidate by email
          if (!entry.email) {
            return { entry, status: "skipped", reason: "no email" };
          }

          const { data: candidate, error: findError } = await supabase
            .from("candidates")
            .select("id")
            .eq("email", entry.email)
            .is("deleted_at", null)
            .single();

          if (findError || !candidate) {
            return { entry, status: "skipped", reason: "candidate not found" };
          }

          // Check if already has a CV document
          const { data: existingDoc } = await supabase
            .from("documents")
            .select("id")
            .eq("entity_id", candidate.id)
            .eq("type", "cv")
            .single();

          if (existingDoc) {
            return { entry, status: "skipped", reason: "already has CV" };
          }

          // Process CV
          const result = await processCV(candidate.id, entry.cvFile, supabase);
          return { entry, status: "processed", result };
        })
      );

      // Update progress from results
      for (const res of results) {
        processed++;
        progress.lastProcessedRow = res.entry.rowNumber;
        progress.processedCount++;

        if (res.status === "skipped") {
          progress.skippedCount++;
        } else if (res.status === "processed" && res.result) {
          if (res.result.uploaded) progress.uploadedCount++;
          if (res.result.extracted) progress.extractedCount++;
          if (res.result.embedded) progress.embeddedCount++;

          if (res.result.error && !res.result.uploaded) {
            progress.errorCount++;
            if (progress.errors.length < 100) {
              progress.errors.push({
                row: res.entry.rowNumber,
                email: res.entry.email,
                error: res.result.error,
              });
            }
          }
        }
      }
    }

    // Log and save progress after each batch
    log(`Progress: ${processed}/${total} | Uploaded: ${progress.uploadedCount} | Extracted: ${progress.extractedCount} | Embedded: ${progress.embeddedCount}`);
    saveProgress(progress);
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("CV BACKFILL COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total processed: ${progress.processedCount}`);
  console.log(`CVs uploaded: ${progress.uploadedCount}`);
  console.log(`CVs extracted: ${progress.extractedCount}`);
  console.log(`Embeddings generated: ${progress.embeddedCount}`);
  console.log(`Skipped: ${progress.skippedCount}`);
  console.log(`Errors: ${progress.errorCount}`);
  console.log("=".repeat(60));

  saveProgress(progress);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

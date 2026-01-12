#!/usr/bin/env npx tsx
/**
 * Backfill CV Processing for Bubble Imports
 *
 * Processes existing Bubble-imported candidates that have CVs but are missing:
 * - Text extraction from CV documents
 * - AI-powered CV data extraction
 * - Embedding generation
 *
 * Run: npx tsx scripts/backfill-bubble-cv-processing.ts --limit=50
 *
 * Options:
 *   --limit=N           Process only first N candidates (default: 100)
 *   --concurrency=N     Parallel processing count (default: 3)
 *   --dry-run           Show what would be processed without making changes
 *   --verbose           Show detailed logging
 *   --force             Re-process candidates that already have embeddings
 *
 * Environment variables (from .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
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

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  limit: parseInt(getArg("limit") || "100", 10),
  concurrency: parseInt(getArg("concurrency") || "3", 10),
  dryRun: hasFlag("dry-run"),
  verbose: hasFlag("verbose"),
  force: hasFlag("force"),
};

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// LOGGING
// ============================================================================

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logVerbose(message: string): void {
  if (CONFIG.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

function logError(message: string, error?: unknown): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  if (error && CONFIG.verbose) {
    console.error(error);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface CandidateToProcess {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  document_id: string;
  has_extracted_text: boolean;
  has_cv_extraction: boolean;
  has_embedding: boolean;
}

interface ProcessResult {
  candidate_id: string;
  candidate_name: string;
  text_extracted: boolean;
  cv_extracted: boolean;
  embedding_generated: boolean;
  error?: string;
  processing_time_ms: number;
}

// ============================================================================
// GET CANDIDATES TO PROCESS
// ============================================================================

async function getCandidatesToProcess(): Promise<CandidateToProcess[]> {
  log(`Fetching Bubble-imported candidates needing processing (limit: ${CONFIG.limit})...`);

  // Build query based on force flag
  let query = supabase
    .from("candidates")
    .select(`
      id,
      first_name,
      last_name,
      email,
      cv_extracted_at,
      embedding,
      documents!inner (
        id,
        type,
        extracted_text
      )
    `)
    .eq("source", "bubble_import")
    .is("deleted_at", null)
    .eq("documents.type", "cv")
    .eq("documents.entity_type", "candidate");

  // If not forcing, only get candidates without embeddings
  if (!CONFIG.force) {
    query = query.is("embedding", null);
  }

  const { data: candidates, error } = await query.limit(CONFIG.limit * 2);

  if (error || !candidates) {
    logError("Failed to fetch candidates", error);
    return [];
  }

  log(`Found ${candidates.length} Bubble candidates with CVs`);

  const results: CandidateToProcess[] = [];

  for (const candidate of candidates) {
    if (results.length >= CONFIG.limit) break;

    const documents = candidate.documents as Array<{
      id: string;
      type: string;
      extracted_text: string | null;
    }>;

    if (!documents || documents.length === 0) continue;

    // Pick the first CV document (there should typically be only one)
    const cvDoc = documents[0];

    results.push({
      candidate_id: candidate.id,
      candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      candidate_email: candidate.email,
      document_id: cvDoc.id,
      has_extracted_text: !!cvDoc.extracted_text,
      has_cv_extraction: !!candidate.cv_extracted_at,
      has_embedding: !!candidate.embedding,
    });
  }

  log(`Selected ${results.length} candidates for processing`);

  // Show breakdown
  const needsText = results.filter((r) => !r.has_extracted_text).length;
  const needsExtraction = results.filter((r) => !r.has_cv_extraction).length;
  const needsEmbedding = results.filter((r) => !r.has_embedding).length;

  log(`Breakdown:`);
  log(`  Need text extraction: ${needsText}`);
  log(`  Need CV extraction: ${needsExtraction}`);
  log(`  Need embedding: ${needsEmbedding}`);

  return results;
}

// ============================================================================
// PROCESS SINGLE CANDIDATE
// ============================================================================

async function processCandidate(candidate: CandidateToProcess): Promise<ProcessResult> {
  const startTime = Date.now();

  try {
    logVerbose(`Processing: ${candidate.candidate_name} (${candidate.candidate_id})`);

    if (CONFIG.dryRun) {
      log(
        `[DRY RUN] Would process: ${candidate.candidate_name} - ` +
          `text:${!candidate.has_extracted_text}, extract:${!candidate.has_cv_extraction}, embed:${!candidate.has_embedding}`
      );
      return {
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.candidate_name,
        text_extracted: false,
        cv_extracted: false,
        embedding_generated: false,
        processing_time_ms: Date.now() - startTime,
      };
    }

    let cvText = "";

    // Step 1: Extract text from document if needed
    if (!candidate.has_extracted_text) {
      logVerbose(`  Extracting text from document...`);

      // Get document file
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("file_path, mime_type, name")
        .eq("id", candidate.document_id)
        .single();

      if (docError || !doc) {
        throw new Error(`Document not found: ${candidate.document_id}`);
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download document: ${downloadError?.message}`);
      }

      // Extract text
      const buffer = await fileData.arrayBuffer();
      const extractionResult = await extractText(buffer, doc.mime_type, doc.name);

      if (!extractionResult.text || extractionResult.text.length < 100) {
        throw new Error(`Text extraction failed or insufficient text: ${extractionResult.error || "< 100 chars"}`);
      }

      cvText = extractionResult.text;

      // Update document with extracted text
      const { error: updateDocError } = await supabase
        .from("documents")
        .update({ extracted_text: cvText })
        .eq("id", candidate.document_id);

      if (updateDocError) {
        throw new Error(`Failed to save extracted text: ${updateDocError.message}`);
      }

      logVerbose(`  ✓ Extracted ${cvText.length} chars`);
    } else {
      // Get existing extracted text
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", candidate.document_id)
        .single();

      if (docError || !doc || !doc.extracted_text) {
        throw new Error("Failed to get extracted text");
      }

      cvText = doc.extracted_text;
    }

    // Step 2: Extract structured CV data if needed
    let shouldGenerateEmbedding = !candidate.has_embedding;

    if (!candidate.has_cv_extraction || CONFIG.force) {
      logVerbose(`  Extracting CV data with AI...`);

      const extractionResponse = await extractFromCVSafe({
        cv_text: cvText,
        candidate_id: candidate.candidate_id,
        document_id: candidate.document_id,
      });

      if (!extractionResponse.success || !extractionResponse.extraction) {
        throw new Error(extractionResponse.error || "CV extraction failed");
      }

      const extraction = extractionResponse.extraction;
      const searchKeywords = buildSearchKeywords(extraction);

      // Update candidate with extracted data
      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          years_experience: extraction.years_experience,
          primary_position: extraction.primary_position,
          position_category: extraction.position_category || "other",
          highest_license: extraction.highest_license,
          has_stcw: extraction.has_stcw,
          has_eng1: extraction.has_eng1,
          positions_held: extraction.positions_held.map((p) => p.normalized),
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
        .eq("id", candidate.candidate_id);

      if (updateError) {
        throw new Error(`Failed to update candidate: ${updateError.message}`);
      }

      logVerbose(`  ✓ Extracted: ${extraction.positions_held.length} positions, ${extraction.certifications.length} certs`);
      shouldGenerateEmbedding = true; // Always regenerate embedding when CV data changes
    }

    // Step 3: Generate embedding if needed
    if (shouldGenerateEmbedding) {
      logVerbose(`  Generating embedding...`);

      // Get fresh candidate data
      const { data: freshCandidate, error: candError } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", candidate.candidate_id)
        .single();

      if (candError || !freshCandidate) {
        throw new Error("Failed to get candidate data for embedding");
      }

      // Build embedding text
      const embeddingText = buildUnifiedCandidateEmbeddingText(
        {
          first_name: freshCandidate.first_name,
          last_name: freshCandidate.last_name,
          primary_position: freshCandidate.primary_position,
          secondary_positions: freshCandidate.secondary_positions,
          years_experience: freshCandidate.years_experience,
          nationality: freshCandidate.nationality,
          second_nationality: freshCandidate.second_nationality,
          current_location: freshCandidate.current_location,
          has_stcw: freshCandidate.has_stcw,
          has_eng1: freshCandidate.has_eng1,
          highest_license: freshCandidate.highest_license,
          has_schengen: freshCandidate.has_schengen,
          has_b1b2: freshCandidate.has_b1b2,
          has_c1d: freshCandidate.has_c1d,
          preferred_yacht_types: freshCandidate.preferred_yacht_types,
          preferred_regions: freshCandidate.preferred_regions,
          preferred_contract_types: freshCandidate.preferred_contract_types,
          is_smoker: freshCandidate.is_smoker,
          has_visible_tattoos: freshCandidate.has_visible_tattoos,
          is_couple: freshCandidate.is_couple,
          partner_position: freshCandidate.partner_position,
          profile_summary: freshCandidate.profile_summary,
          search_keywords: freshCandidate.search_keywords,
        },
        [
          {
            type: "cv",
            extracted_text: cvText,
            visibility: "recruiter" as const,
          },
        ],
        [],
        [],
        "recruiter"
      );

      if (embeddingText.length < 50) {
        throw new Error("Insufficient embedding text generated");
      }

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText);

      // Update candidate with embedding
      const { error: embeddingError } = await supabase
        .from("candidates")
        .update({
          embedding: embedding,
          embedding_text: embeddingText,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.candidate_id);

      if (embeddingError) {
        throw new Error(`Failed to save embedding: ${embeddingError.message}`);
      }

      logVerbose(`  ✓ Generated ${embedding.length}-dim embedding from ${embeddingText.length} chars`);
    }

    const result: ProcessResult = {
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      text_extracted: !candidate.has_extracted_text,
      cv_extracted: !candidate.has_cv_extraction || CONFIG.force,
      embedding_generated: shouldGenerateEmbedding,
      processing_time_ms: Date.now() - startTime,
    };

    log(`✓ ${candidate.candidate_name}: text=${result.text_extracted}, extract=${result.cv_extracted}, embed=${result.embedding_generated} (${result.processing_time_ms}ms)`);

    return result;
  } catch (error) {
    const result: ProcessResult = {
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      text_extracted: false,
      cv_extracted: false,
      embedding_generated: false,
      error: error instanceof Error ? error.message : String(error),
      processing_time_ms: Date.now() - startTime,
    };

    logError(`✗ ${candidate.candidate_name}: ${result.error}`);

    return result;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL BUBBLE CV PROCESSING");
  console.log("=".repeat(60));
  console.log(`Config: limit=${CONFIG.limit}, concurrency=${CONFIG.concurrency}`);
  if (CONFIG.dryRun) console.log("MODE: DRY RUN (no changes will be made)");
  if (CONFIG.force) console.log("MODE: FORCE (re-process all candidates)");
  console.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  // Get candidates to process
  const candidates = await getCandidatesToProcess();

  if (candidates.length === 0) {
    log("No candidates to process. Done!");
    return;
  }

  // Process in batches for concurrency control
  const results: ProcessResult[] = [];

  for (let i = 0; i < candidates.length; i += CONFIG.concurrency) {
    const batch = candidates.slice(i, i + CONFIG.concurrency);
    log(`\nProcessing batch ${Math.floor(i / CONFIG.concurrency) + 1} (${batch.length} candidates)...`);

    const batchResults = await Promise.all(batch.map((c) => processCandidate(c)));
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + CONFIG.concurrency < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error).length;
  const textExtracted = results.filter((r) => r.text_extracted).length;
  const cvExtracted = results.filter((r) => r.cv_extracted).length;
  const embeddingsGenerated = results.filter((r) => r.embedding_generated).length;
  const avgTime =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.processing_time_ms, 0) / results.length)
      : 0;

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nOperations completed:`);
  console.log(`  Text extracted: ${textExtracted}`);
  console.log(`  CV data extracted (AI): ${cvExtracted}`);
  console.log(`  Embeddings generated: ${embeddingsGenerated}`);
  console.log(`\nPerformance:`);
  console.log(`  Average time per candidate: ${avgTime}ms`);
  console.log(`  Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log("=".repeat(60) + "\n");

  // Show failed candidates
  if (failed > 0) {
    console.log("Failed candidates:");
    results
      .filter((r) => r.error)
      .forEach((r) => {
        console.log(`  - ${r.candidate_name}: ${r.error}`);
      });
    console.log("");
  }

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

#!/usr/bin/env npx tsx
// ============================================================================
// FULL CANDIDATE BACKFILL SCRIPT
// ============================================================================
// Pulls candidates with CVs, extracts structured data, and generates embeddings.
// This is a comprehensive script to prepare candidates for AI matching testing.
//
// Usage:
//   npx tsx scripts/backfill-candidates-full.ts --limit=200
//   npx tsx scripts/backfill-candidates-full.ts --limit=50 --concurrency=3
//   npx tsx scripts/backfill-candidates-full.ts --dry-run
//   npx tsx scripts/backfill-candidates-full.ts --force  # Re-process already extracted
//   npx tsx scripts/backfill-candidates-full.ts --skip-extraction  # Only generate embeddings
//   npx tsx scripts/backfill-candidates-full.ts --skip-embedding  # Only extract CVs
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENAI_API_KEY
// ============================================================================

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  extractFromCV,
  buildSearchKeywords,
  generateEmbedding,
  buildUnifiedCandidateEmbeddingText,
  type CVExtractionResult,
} from '@lighthouse/ai';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  limit: parseInt(getArg('limit') || '200', 10),
  concurrency: parseInt(getArg('concurrency') || '5', 10),
  dryRun: hasFlag('dry-run'),
  verbose: hasFlag('verbose'),
  force: hasFlag('force'),
  skipExtraction: hasFlag('skip-extraction'),
  skipEmbedding: hasFlag('skip-embedding'),
};

// ----------------------------------------------------------------------------
// SUPABASE CLIENT
// ----------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data && CONFIG.verbose) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (error) {
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CandidateToProcess {
  candidate_id: string;
  candidate_name: string;
  document_id: string;
  cv_text: string;
  needs_extraction: boolean;
  needs_embedding: boolean;
}

interface ProcessResult {
  candidate_id: string;
  candidate_name: string;
  extraction_success: boolean;
  embedding_success: boolean;
  extraction_error?: string;
  embedding_error?: string;
  extraction?: CVExtractionResult;
  processing_time_ms: number;
}

// ----------------------------------------------------------------------------
// GET CANDIDATES TO PROCESS
// ----------------------------------------------------------------------------

const MIN_CV_TEXT_LENGTH = 100;

async function getCandidatesToProcess(): Promise<CandidateToProcess[]> {
  log(`Fetching candidates with CVs (limit: ${CONFIG.limit})...`);

  // First, get all documents with usable CV text
  const { data: cvDocs, error: docError } = await supabase
    .from('documents')
    .select('id, name, extracted_text, entity_id')
    .eq('entity_type', 'candidate')
    .eq('type', 'cv')
    .not('extracted_text', 'is', null)
    .gt('extracted_text', ''); // Has some text

  if (docError || !cvDocs) {
    logError('Failed to fetch CV documents', docError);
    return [];
  }

  // Filter to valid CVs (>100 chars, no logo versions)
  const validCVs = cvDocs.filter((doc) => {
    if (doc.name?.toLowerCase().includes('logo')) return false;
    if (!doc.extracted_text || doc.extracted_text.length < MIN_CV_TEXT_LENGTH) return false;
    return true;
  });

  // Group by candidate, keeping best CV per candidate
  const candidateCVMap = new Map<string, typeof validCVs[0]>();
  for (const cv of validCVs) {
    const existing = candidateCVMap.get(cv.entity_id);
    if (!existing || (cv.extracted_text?.length || 0) > (existing.extracted_text?.length || 0)) {
      candidateCVMap.set(cv.entity_id, cv);
    }
  }

  const candidateIds = Array.from(candidateCVMap.keys());
  log(`Found ${candidateIds.length} candidates with valid CVs`);

  // Now fetch candidate details
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, cv_extracted_at, embedding')
    .in('id', candidateIds)
    .is('deleted_at', null);

  if (error || !candidates) {
    logError('Failed to fetch candidates', error);
    return [];
  }

  // Filter based on what needs processing
  const results: CandidateToProcess[] = [];

  for (const candidate of candidates) {
    if (results.length >= CONFIG.limit) break;

    const needsExtraction = CONFIG.force || !candidate.cv_extracted_at;
    const needsEmbedding = CONFIG.force || !candidate.embedding;

    // Skip if nothing to do (unless forcing)
    if (!needsExtraction && !needsEmbedding) continue;

    // Apply skip flags
    const actualNeedsExtraction = needsExtraction && !CONFIG.skipExtraction;
    const actualNeedsEmbedding = needsEmbedding && !CONFIG.skipEmbedding;

    if (!actualNeedsExtraction && !actualNeedsEmbedding) continue;

    const cvDoc = candidateCVMap.get(candidate.id);
    if (!cvDoc || !cvDoc.extracted_text) {
      if (CONFIG.verbose) {
        log(`  ⚠ ${candidate.first_name} ${candidate.last_name}: No valid CV found`);
      }
      continue;
    }

    results.push({
      candidate_id: candidate.id,
      candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      document_id: cvDoc.id,
      cv_text: cvDoc.extracted_text!,
      needs_extraction: actualNeedsExtraction,
      needs_embedding: actualNeedsEmbedding,
    });
  }

  log(`Found ${results.length} candidates with CV documents to process`);

  // Log breakdown
  const needExtraction = results.filter(r => r.needs_extraction).length;
  const needEmbedding = results.filter(r => r.needs_embedding).length;
  log(`  - Need extraction: ${needExtraction}`);
  log(`  - Need embedding: ${needEmbedding}`);

  return results;
}

// ----------------------------------------------------------------------------
// PROCESS SINGLE CANDIDATE
// ----------------------------------------------------------------------------

async function processCandidate(candidate: CandidateToProcess): Promise<ProcessResult> {
  const startTime = Date.now();
  const result: ProcessResult = {
    candidate_id: candidate.candidate_id,
    candidate_name: candidate.candidate_name,
    extraction_success: !candidate.needs_extraction, // True if skipping
    embedding_success: !candidate.needs_embedding, // True if skipping
    processing_time_ms: 0,
  };

  try {
    log(`Processing: ${candidate.candidate_name} (${candidate.candidate_id})`);

    if (CONFIG.dryRun) {
      log(`[DRY RUN] Would process CV (${candidate.cv_text.length} chars)`);
      result.processing_time_ms = Date.now() - startTime;
      return result;
    }

    // =========================================================================
    // STEP 1: CV EXTRACTION
    // =========================================================================
    let extraction: CVExtractionResult | undefined;

    if (candidate.needs_extraction) {
      try {
        log(`  → Extracting CV data...`);
        extraction = await extractFromCV(candidate.cv_text);
        result.extraction = extraction;

        // Build search keywords
        const searchKeywords = buildSearchKeywords(extraction);

        // Update candidate record
        const yearsExp = extraction.years_experience
          ? Math.round(extraction.years_experience)
          : null;

        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            years_experience: yearsExp,
            primary_position: extraction.primary_position,
            // Never save null position_category - default to 'other'
            position_category: extraction.position_category || 'other',
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
          .eq('id', candidate.candidate_id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        result.extraction_success = true;
        log(`  ✓ Extraction: ${extraction.years_experience || 0} years, ${extraction.positions_held.length} positions, category: ${extraction.position_category}`);
      } catch (error) {
        result.extraction_success = false;
        result.extraction_error = error instanceof Error ? error.message : 'Unknown error';
        logError(`  ✗ Extraction failed: ${result.extraction_error}`);
      }
    }

    // =========================================================================
    // STEP 2: EMBEDDING GENERATION
    // =========================================================================
    if (candidate.needs_embedding) {
      try {
        log(`  → Generating embedding...`);

        // Fetch full candidate data (may have been updated by extraction)
        const { data: candidateData, error: fetchError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidate.candidate_id)
          .single();

        if (fetchError || !candidateData) {
          throw new Error(`Failed to fetch candidate: ${fetchError?.message}`);
        }

        // Fetch documents for embedding
        const { data: documents } = await supabase
          .from('documents')
          .select('type, name, extracted_text, visibility')
          .eq('entity_type', 'candidate')
          .eq('entity_id', candidate.candidate_id)
          .eq('is_latest_version', true)
          .is('deleted_at', null);

        // Fetch interview notes
        const { data: notes } = await supabase
          .from('candidate_interview_notes')
          .select('note_type, title, content, summary, visibility, include_in_embedding')
          .eq('candidate_id', candidate.candidate_id)
          .eq('include_in_embedding', true);

        // Fetch references
        const { data: references } = await supabase
          .from('candidate_references')
          .select('referee_name, relationship, reference_text, voice_summary, overall_rating, would_rehire, is_verified')
          .eq('candidate_id', candidate.candidate_id)
          .eq('is_verified', true);

        // Build embedding text
        const profile = {
          first_name: candidateData.first_name,
          last_name: candidateData.last_name,
          primary_position: candidateData.primary_position,
          secondary_positions: candidateData.secondary_positions,
          years_experience: candidateData.years_experience,
          nationality: candidateData.nationality,
          second_nationality: candidateData.second_nationality,
          current_location: candidateData.current_location,
          has_stcw: candidateData.has_stcw,
          stcw_expiry: candidateData.stcw_expiry,
          has_eng1: candidateData.has_eng1,
          eng1_expiry: candidateData.eng1_expiry,
          highest_license: candidateData.highest_license,
          has_schengen: candidateData.has_schengen,
          has_b1b2: candidateData.has_b1b2,
          has_c1d: candidateData.has_c1d,
          other_visas: candidateData.other_visas,
          preferred_yacht_types: candidateData.preferred_yacht_types,
          preferred_yacht_size_min: candidateData.preferred_yacht_size_min,
          preferred_yacht_size_max: candidateData.preferred_yacht_size_max,
          preferred_regions: candidateData.preferred_regions,
          preferred_contract_types: candidateData.preferred_contract_types,
          is_smoker: candidateData.is_smoker,
          has_visible_tattoos: candidateData.has_visible_tattoos,
          is_couple: candidateData.is_couple,
          partner_position: candidateData.partner_position,
          profile_summary: candidateData.profile_summary,
          search_keywords: candidateData.search_keywords,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const embeddingText = buildUnifiedCandidateEmbeddingText(
          profile,
          (documents || []) as any,
          (notes || []) as any,
          (references || []) as any,
          'recruiter'
        );

        if (embeddingText.length < 50) {
          throw new Error('Insufficient text for embedding');
        }

        // Generate embedding
        const embedding = await generateEmbedding(embeddingText);

        // Update candidate with embedding
        // Note: embedding_text is optional for debugging, embedding_updated_at tracks freshness
        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            embedding: embedding,
            embedding_text: embeddingText.substring(0, 10000), // Limit for storage
            embedding_updated_at: new Date().toISOString(),
          })
          .eq('id', candidate.candidate_id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        result.embedding_success = true;
        log(`  ✓ Embedding: ${embedding.length} dims from ${embeddingText.length} chars`);
      } catch (error) {
        result.embedding_success = false;
        result.embedding_error = error instanceof Error ? error.message : 'Unknown error';
        logError(`  ✗ Embedding failed: ${result.embedding_error}`);
      }
    }

    result.processing_time_ms = Date.now() - startTime;
    return result;
  } catch (error) {
    result.processing_time_ms = Date.now() - startTime;
    logError(`Fatal error processing ${candidate.candidate_name}`, error);
    return result;
  }
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('FULL CANDIDATE BACKFILL');
  console.log('========================================');
  console.log(`Config: limit=${CONFIG.limit}, concurrency=${CONFIG.concurrency}`);
  if (CONFIG.dryRun) console.log('MODE: DRY RUN (no changes will be made)');
  if (CONFIG.force) console.log('MODE: FORCE (re-processing already done)');
  if (CONFIG.skipExtraction) console.log('SKIP: CV extraction');
  if (CONFIG.skipEmbedding) console.log('SKIP: Embedding generation');
  console.log('========================================\n');

  const startTime = Date.now();

  // Get candidates to process
  const candidates = await getCandidatesToProcess();

  if (candidates.length === 0) {
    log('No candidates to process. Done!');
    return;
  }

  // Process in batches for concurrency control
  const results: ProcessResult[] = [];

  for (let i = 0; i < candidates.length; i += CONFIG.concurrency) {
    const batch = candidates.slice(i, i + CONFIG.concurrency);
    const batchNum = Math.floor(i / CONFIG.concurrency) + 1;
    const totalBatches = Math.ceil(candidates.length / CONFIG.concurrency);

    log(`\n--- Batch ${batchNum}/${totalBatches} (${batch.length} candidates) ---`);

    const batchResults = await Promise.all(batch.map((c) => processCandidate(c)));
    results.push(...batchResults);

    // Progress update
    const progress = Math.round(((i + batch.length) / candidates.length) * 100);
    const extractionSuccess = results.filter((r) => r.extraction_success).length;
    const embeddingSuccess = results.filter((r) => r.embedding_success).length;
    log(`Progress: ${progress}% | Extraction: ${extractionSuccess}/${results.length} | Embedding: ${embeddingSuccess}/${results.length}`);

    // Small delay between batches to avoid rate limits
    if (i + CONFIG.concurrency < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  const totalTime = Date.now() - startTime;
  const extractionSuccess = results.filter((r) => r.extraction_success).length;
  const extractionFailed = results.filter((r) => !r.extraction_success && r.extraction_error).length;
  const embeddingSuccess = results.filter((r) => r.embedding_success).length;
  const embeddingFailed = results.filter((r) => !r.embedding_success && r.embedding_error).length;
  const avgTime = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.processing_time_ms, 0) / results.length)
    : 0;

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total processed: ${results.length}`);
  console.log(`CV Extraction: ${extractionSuccess} success, ${extractionFailed} failed`);
  console.log(`Embeddings: ${embeddingSuccess} success, ${embeddingFailed} failed`);
  console.log(`Average time per candidate: ${avgTime}ms`);
  console.log(`Total time: ${Math.round(totalTime / 1000)}s`);
  console.log('========================================\n');

  // Show position category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const r of results) {
    if (r.extraction?.position_category) {
      categoryBreakdown[r.extraction.position_category] =
        (categoryBreakdown[r.extraction.position_category] || 0) + 1;
    }
  }

  if (Object.keys(categoryBreakdown).length > 0) {
    console.log('Position Category Breakdown:');
    for (const [category, count] of Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${category}: ${count}`);
    }
    console.log('');
  }

  // Show failed candidates
  const extractionFailures = results.filter((r) => r.extraction_error);
  const embeddingFailures = results.filter((r) => r.embedding_error);

  if (extractionFailures.length > 0) {
    console.log('Extraction Failures:');
    extractionFailures.forEach((r) => {
      console.log(`  - ${r.candidate_name}: ${r.extraction_error}`);
    });
    console.log('');
  }

  if (embeddingFailures.length > 0) {
    console.log('Embedding Failures:');
    embeddingFailures.forEach((r) => {
      console.log(`  - ${r.candidate_name}: ${r.embedding_error}`);
    });
    console.log('');
  }

  // Exit with error code if significant failures
  const totalFailures = extractionFailed + embeddingFailed;
  if (totalFailures > results.length * 0.1) {
    console.log(`⚠️  More than 10% failures (${totalFailures}/${results.length * 2})`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

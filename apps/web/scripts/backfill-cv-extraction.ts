#!/usr/bin/env npx tsx
// ============================================================================
// BACKFILL CV EXTRACTION SCRIPT
// ============================================================================
// Processes existing CVs to extract structured data using AI
//
// Usage:
//   npx tsx scripts/backfill-cv-extraction.ts --limit=10
//   npx tsx scripts/backfill-cv-extraction.ts --limit=100 --concurrency=3
//   npx tsx scripts/backfill-cv-extraction.ts --candidate-id=uuid
//   npx tsx scripts/backfill-cv-extraction.ts --dry-run
//   npx tsx scripts/backfill-cv-extraction.ts --force --limit=50  # Re-extract already processed CVs
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENAI_API_KEY
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  extractFromCV,
  buildSearchKeywords,
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
  limit: parseInt(getArg('limit') || '10', 10),
  concurrency: parseInt(getArg('concurrency') || '5', 10),
  candidateId: getArg('candidate-id'),
  dryRun: hasFlag('dry-run'),
  verbose: hasFlag('verbose'),
  force: hasFlag('force'), // Re-process even if already extracted
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
// GET CANDIDATES NEEDING EXTRACTION
// ----------------------------------------------------------------------------

interface CandidateToProcess {
  candidate_id: string;
  candidate_name: string;
  document_id: string;
  cv_text: string;
}

async function getCandidatesToProcess(): Promise<CandidateToProcess[]> {
  log(`Fetching candidates needing extraction (limit: ${CONFIG.limit})...`);

  // If specific candidate ID provided
  if (CONFIG.candidateId) {
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name')
      .eq('id', CONFIG.candidateId)
      .single();

    if (candError || !candidate) {
      logError(`Candidate not found: ${CONFIG.candidateId}`);
      return [];
    }

    // Get their latest CV (documents use entity_type/entity_id pattern)
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, extracted_text')
      .eq('entity_type', 'candidate')
      .eq('entity_id', CONFIG.candidateId)
      .eq('type', 'cv')
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (docError || !doc) {
      logError(`No CV document found for candidate: ${CONFIG.candidateId}`);
      return [];
    }

    return [
      {
        candidate_id: candidate.id,
        candidate_name: `${candidate.first_name} ${candidate.last_name}`,
        document_id: doc.id,
        cv_text: doc.extracted_text,
      },
    ];
  }

  // Get candidates - either without extraction, or all if --force is set
  let query = supabase
    .from('candidates')
    .select('id, first_name, last_name, cv_extracted_at')
    .is('deleted_at', null);

  // Only filter to unextracted candidates if not forcing re-extraction
  if (!CONFIG.force) {
    query = query.is('cv_extracted_at', null);
  }

  const { data: candidates, error } = await query.limit(CONFIG.limit * 2); // Fetch more to account for those without CVs

  if (error || !candidates) {
    logError('Failed to fetch candidates', error);
    return [];
  }

  const filterType = CONFIG.force ? 'all (force mode)' : 'without extraction';
  log(`Found ${candidates.length} candidates ${filterType}`);

  // For each candidate, get their latest CV document
  const results: CandidateToProcess[] = [];

  for (const candidate of candidates) {
    if (results.length >= CONFIG.limit) break;

    const { data: doc } = await supabase
      .from('documents')
      .select('id, extracted_text')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidate.id)
      .eq('type', 'cv')
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (doc && doc.extracted_text) {
      results.push({
        candidate_id: candidate.id,
        candidate_name: `${candidate.first_name} ${candidate.last_name}`,
        document_id: doc.id,
        cv_text: doc.extracted_text,
      });
    }
  }

  log(`Found ${results.length} candidates with CV documents to process`);
  return results;
}

// ----------------------------------------------------------------------------
// PROCESS SINGLE CANDIDATE
// ----------------------------------------------------------------------------

interface ProcessResult {
  candidate_id: string;
  candidate_name: string;
  success: boolean;
  error?: string;
  extraction?: CVExtractionResult;
  processing_time_ms: number;
}

async function processCandidate(candidate: CandidateToProcess): Promise<ProcessResult> {
  const startTime = Date.now();

  try {
    log(`Processing: ${candidate.candidate_name} (${candidate.candidate_id})`);

    if (CONFIG.dryRun) {
      log(`[DRY RUN] Would extract from CV (${candidate.cv_text.length} chars)`);
      return {
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.candidate_name,
        success: true,
        processing_time_ms: Date.now() - startTime,
      };
    }

    // Extract structured data
    const extraction = await extractFromCV(candidate.cv_text);

    if (CONFIG.verbose) {
      log('Extraction result:', extraction);
    }

    // Build search keywords
    const searchKeywords = buildSearchKeywords(extraction);

    // Update candidate record
    // Note: years_experience is INT in DB, so round any decimals
    const yearsExp = extraction.years_experience
      ? Math.round(extraction.years_experience)
      : null;

    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        // Core fields
        years_experience: yearsExp,
        primary_position: extraction.primary_position,
        position_category: extraction.position_category,
        highest_license: extraction.highest_license,

        // Boolean flags
        has_stcw: extraction.has_stcw,
        has_eng1: extraction.has_eng1,

        // Extracted arrays
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

        // Metadata
        cv_extracted_at: new Date().toISOString(),
        cv_extraction_version: 1,
        extraction_confidence: extraction.extraction_confidence,
        extraction_notes: extraction.extraction_notes,
        search_keywords: searchKeywords,
      })
      .eq('id', candidate.candidate_id);

    if (updateError) {
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    const result: ProcessResult = {
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      success: true,
      extraction,
      processing_time_ms: Date.now() - startTime,
    };

    log(
      `✓ ${candidate.candidate_name}: ${extraction.years_experience || 0} years, ` +
        `${extraction.positions_held.length} positions, ` +
        `${extraction.certifications.length} certs, ` +
        `${extraction.licenses.length} licenses, ` +
        `${extraction.references.length} refs ` +
        `(${result.processing_time_ms}ms)`
    );

    return result;
  } catch (error) {
    const result: ProcessResult = {
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    };

    logError(`✗ ${candidate.candidate_name}: ${result.error}`);

    return result;
  }
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('CV EXTRACTION BACKFILL');
  console.log('========================================');
  console.log(`Config: limit=${CONFIG.limit}, concurrency=${CONFIG.concurrency}`);
  if (CONFIG.dryRun) console.log('MODE: DRY RUN (no changes will be made)');
  if (CONFIG.force) console.log('MODE: FORCE (re-extracting already processed CVs)');
  if (CONFIG.candidateId) console.log(`Target: ${CONFIG.candidateId}`);
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
    log(`\nProcessing batch ${Math.floor(i / CONFIG.concurrency) + 1}...`);

    const batchResults = await Promise.all(batch.map((c) => processCandidate(c)));
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + CONFIG.concurrency < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgTime = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.processing_time_ms, 0) / results.length)
    : 0;

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average time per CV: ${avgTime}ms`);
  console.log(`Total time: ${totalTime}ms`);
  console.log('========================================\n');

  // Show failed candidates
  if (failed > 0) {
    console.log('Failed candidates:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.candidate_name}: ${r.error}`);
      });
    console.log('');
  }

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env npx tsx
// ============================================================================
// BACKFILL CANDIDATE BIOS SCRIPT
// ============================================================================
// Generates 5-paragraph bios for candidates with CV extraction data
//
// Usage:
//   npx tsx scripts/backfill-candidate-bios.ts --limit=10
//   npx tsx scripts/backfill-candidate-bios.ts --limit=100 --concurrency=5
//   npx tsx scripts/backfill-candidate-bios.ts --candidate-id=uuid
//   npx tsx scripts/backfill-candidate-bios.ts --dry-run
//   npx tsx scripts/backfill-candidate-bios.ts --force --limit=50  # Regenerate existing bios
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ANTHROPIC_API_KEY
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  generateCandidateBio,
  BIO_GENERATION_VERSION,
  type BioGenerationResult,
  type BioGenerationCandidate,
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
  force: hasFlag('force'), // Regenerate even if bio exists
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
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
// GET CANDIDATES NEEDING BIO GENERATION
// ----------------------------------------------------------------------------

interface CandidateToProcess {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  primary_position: string | null;
  years_experience: number | null;
  positions_held: string[] | null;
  positions_extracted: unknown[] | null;
  yacht_experience_extracted: unknown[] | null;
  villa_experience_extracted: unknown[] | null;
  certifications_extracted: unknown[] | null;
  licenses_extracted: unknown[] | null;
  education_extracted: unknown[] | null;
  references_extracted: unknown[] | null;
  languages_extracted: unknown[] | null;
  cv_skills: string[] | null;
  profile_summary: string | null;
  highest_license: string | null;
  has_stcw: boolean | null;
  has_eng1: boolean | null;
}

async function getCandidatesToProcess(): Promise<CandidateToProcess[]> {
  log(`Fetching candidates needing bio generation (limit: ${CONFIG.limit})...`);

  // If specific candidate ID provided
  if (CONFIG.candidateId) {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select(`
        id, first_name, last_name, date_of_birth, nationality,
        primary_position, years_experience, positions_held, positions_extracted,
        yacht_experience_extracted, villa_experience_extracted,
        certifications_extracted, licenses_extracted, education_extracted,
        references_extracted, languages_extracted, cv_skills,
        profile_summary, highest_license, has_stcw, has_eng1
      `)
      .eq('id', CONFIG.candidateId)
      .single();

    if (error || !candidate) {
      logError(`Candidate not found: ${CONFIG.candidateId}`);
      return [];
    }

    return [candidate as CandidateToProcess];
  }

  // Build query for candidates needing bio generation
  let query = supabase
    .from('candidates')
    .select(`
      id, first_name, last_name, date_of_birth, nationality,
      primary_position, years_experience, positions_held, positions_extracted,
      yacht_experience_extracted, villa_experience_extracted,
      certifications_extracted, licenses_extracted, education_extracted,
      references_extracted, languages_extracted, cv_skills,
      profile_summary, highest_license, has_stcw, has_eng1
    `)
    .is('deleted_at', null)
    .not('cv_extracted_at', 'is', null); // Must have CV extraction

  // Only process those without bio, unless force mode
  if (!CONFIG.force) {
    query = query.is('bio_generated_at', null);
  }

  const { data: candidates, error } = await query.limit(CONFIG.limit);

  if (error || !candidates) {
    logError('Failed to fetch candidates', error);
    return [];
  }

  const filterType = CONFIG.force ? 'all with CV extraction (force mode)' : 'without bio';
  log(`Found ${candidates.length} candidates ${filterType}`);

  return candidates as CandidateToProcess[];
}

// ----------------------------------------------------------------------------
// PROCESS SINGLE CANDIDATE
// ----------------------------------------------------------------------------

interface ProcessResult {
  candidate_id: string;
  candidate_name: string;
  success: boolean;
  error?: string;
  bio_result?: BioGenerationResult;
  processing_time_ms: number;
}

async function processCandidate(candidate: CandidateToProcess): Promise<ProcessResult> {
  const startTime = Date.now();
  const candidateName = `${candidate.first_name} ${candidate.last_name}`;

  try {
    log(`Processing: ${candidateName} (${candidate.id})`);

    if (CONFIG.dryRun) {
      log(`[DRY RUN] Would generate bio for ${candidateName}`);
      return {
        candidate_id: candidate.id,
        candidate_name: candidateName,
        success: true,
        processing_time_ms: Date.now() - startTime,
      };
    }

    // Build the candidate data for bio generation
    const bioCandidate: BioGenerationCandidate = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      date_of_birth: candidate.date_of_birth,
      nationality: candidate.nationality,
      primary_position: candidate.primary_position,
      years_experience: candidate.years_experience,
      positions_held: candidate.positions_extracted as BioGenerationCandidate['positions_held'],
      yacht_experience_extracted: candidate.yacht_experience_extracted as BioGenerationCandidate['yacht_experience_extracted'],
      villa_experience_extracted: candidate.villa_experience_extracted as BioGenerationCandidate['villa_experience_extracted'],
      certifications_extracted: candidate.certifications_extracted as BioGenerationCandidate['certifications_extracted'],
      licenses_extracted: candidate.licenses_extracted as BioGenerationCandidate['licenses_extracted'],
      education_extracted: candidate.education_extracted as BioGenerationCandidate['education_extracted'],
      references_extracted: candidate.references_extracted as BioGenerationCandidate['references_extracted'],
      languages_extracted: candidate.languages_extracted as BioGenerationCandidate['languages_extracted'],
      cv_skills: candidate.cv_skills,
      profile_summary: candidate.profile_summary,
      highest_license: candidate.highest_license,
      has_stcw: candidate.has_stcw ?? undefined,
      has_eng1: candidate.has_eng1 ?? undefined,
    };

    // Generate the bio
    const bioResult = await generateCandidateBio({ candidate: bioCandidate });

    if (CONFIG.verbose) {
      log('Bio result:', bioResult);
    }

    // Update candidate record
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        bio_full: bioResult.bio_full,
        bio_anonymized: bioResult.bio_anonymized,
        bio_generated_at: new Date().toISOString(),
        bio_generation_version: BIO_GENERATION_VERSION,
      })
      .eq('id', candidate.id);

    if (updateError) {
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    const bioPreview = bioResult.bio_full.substring(0, 80).replace(/\n/g, ' ') + '...';
    const result: ProcessResult = {
      candidate_id: candidate.id,
      candidate_name: candidateName,
      success: true,
      bio_result: bioResult,
      processing_time_ms: Date.now() - startTime,
    };

    log(
      `✓ ${candidateName}: confidence ${(bioResult.generation_confidence * 100).toFixed(0)}%, ` +
        `${bioResult.bio_full.length} chars ` +
        `(${result.processing_time_ms}ms)`
    );
    if (CONFIG.verbose) {
      log(`  Preview: ${bioPreview}`);
    }

    return result;
  } catch (error) {
    const result: ProcessResult = {
      candidate_id: candidate.id,
      candidate_name: candidateName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    };

    logError(`✗ ${candidateName}: ${result.error}`);

    return result;
  }
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('CANDIDATE BIO GENERATION BACKFILL');
  console.log('========================================');
  console.log(`Config: limit=${CONFIG.limit}, concurrency=${CONFIG.concurrency}`);
  console.log(`Bio generation version: ${BIO_GENERATION_VERSION}`);
  if (CONFIG.dryRun) console.log('MODE: DRY RUN (no changes will be made)');
  if (CONFIG.force) console.log('MODE: FORCE (regenerating existing bios)');
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
  console.log(`Average time per bio: ${avgTime}ms`);
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

#!/usr/bin/env npx tsx
// ============================================================================
// FIX 'OTHER' CATEGORY CANDIDATES
// ============================================================================
// Re-runs CV extraction on candidates in the 'other' position category to
// properly categorize them. Many were wrongly assigned 'other' when they
// should be 'engineering', 'deck', 'interior', etc.
//
// Usage:
//   npx tsx scripts/fix-other-category-candidates.ts
//   npx tsx scripts/fix-other-category-candidates.ts --dry-run
//   npx tsx scripts/fix-other-category-candidates.ts --verbose
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENAI_API_KEY
// ============================================================================

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
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
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  dryRun: hasFlag('dry-run'),
  verbose: hasFlag('verbose'),
  concurrency: 3,
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

interface CandidateToFix {
  candidate_id: string;
  candidate_name: string;
  current_position: string | null;
  document_id: string;
  cv_text: string;
}

interface FixResult {
  candidate_id: string;
  candidate_name: string;
  old_category: string;
  new_category: string | null;
  new_position: string | null;
  success: boolean;
  error?: string;
}

// ----------------------------------------------------------------------------
// GET CANDIDATES IN 'OTHER' CATEGORY WITH CVs
// ----------------------------------------------------------------------------

const MIN_CV_TEXT_LENGTH = 100;

async function getOtherCategoryCandidates(): Promise<CandidateToFix[]> {
  log('Fetching candidates in "other" category with CV documents...');

  // Get candidates in 'other' category with their CV documents
  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, primary_position, position_category')
    .eq('position_category', 'other')
    .is('deleted_at', null)
    .not('first_name', 'is', null);

  if (candError || !candidates) {
    logError('Failed to fetch candidates', candError);
    return [];
  }

  log(`Found ${candidates.length} candidates in 'other' category`);

  const results: CandidateToFix[] = [];

  // For each candidate, find their best CV document
  for (const candidate of candidates) {
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('id, name, extracted_text')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidate.id)
      .eq('type', 'cv')
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false });

    if (docError || !docs || docs.length === 0) {
      if (CONFIG.verbose) {
        log(`  - ${candidate.first_name} ${candidate.last_name}: No CV document found`);
      }
      continue;
    }

    // Find the best CV (longest text, not a logo version)
    const validDocs = docs.filter(
      (d) =>
        d.extracted_text &&
        d.extracted_text.length >= MIN_CV_TEXT_LENGTH &&
        !d.name?.toLowerCase().includes('logo')
    );

    if (validDocs.length === 0) {
      if (CONFIG.verbose) {
        log(`  - ${candidate.first_name} ${candidate.last_name}: No valid CV text`);
      }
      continue;
    }

    // Sort by text length and take the longest
    validDocs.sort((a, b) => (b.extracted_text?.length || 0) - (a.extracted_text?.length || 0));
    const bestDoc = validDocs[0];

    results.push({
      candidate_id: candidate.id,
      candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      current_position: candidate.primary_position,
      document_id: bestDoc.id,
      cv_text: bestDoc.extracted_text!,
    });
  }

  log(`Found ${results.length} candidates with valid CVs to re-process`);
  return results;
}

// ----------------------------------------------------------------------------
// PROCESS SINGLE CANDIDATE
// ----------------------------------------------------------------------------

async function fixCandidate(candidate: CandidateToFix): Promise<FixResult> {
  const result: FixResult = {
    candidate_id: candidate.candidate_id,
    candidate_name: candidate.candidate_name,
    old_category: 'other',
    new_category: null,
    new_position: null,
    success: false,
  };

  try {
    log(`Processing: ${candidate.candidate_name}`);
    log(`  Current position: ${candidate.current_position || 'N/A'}`);
    log(`  CV length: ${candidate.cv_text.length} chars`);

    if (CONFIG.dryRun) {
      log(`  [DRY RUN] Would re-extract CV`);
      result.success = true;
      return result;
    }

    // Run CV extraction
    const extraction: CVExtractionResult = await extractFromCV(candidate.cv_text);

    result.new_category = extraction.position_category || 'other';
    result.new_position = extraction.primary_position;

    // Build search keywords
    const searchKeywords = buildSearchKeywords(extraction);

    // Update candidate record
    const yearsExp = extraction.years_experience ? Math.round(extraction.years_experience) : null;

    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        years_experience: yearsExp,
        primary_position: extraction.primary_position,
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
        cv_extraction_version: 2, // Increment version to track re-extraction
        extraction_confidence: extraction.extraction_confidence,
        extraction_notes: extraction.extraction_notes,
        search_keywords: searchKeywords,
        cv_document_id: candidate.document_id, // Link the CV document
      })
      .eq('id', candidate.candidate_id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    // Also regenerate embedding
    log(`  Regenerating embedding...`);

    const { data: candidateData, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidate.candidate_id)
      .single();

    if (fetchError || !candidateData) {
      throw new Error(`Failed to fetch updated candidate: ${fetchError?.message}`);
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
      .select(
        'referee_name, relationship, reference_text, voice_summary, overall_rating, would_rehire, is_verified'
      )
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

    if (embeddingText.length >= 50) {
      const embedding = await generateEmbedding(embeddingText);

      await supabase
        .from('candidates')
        .update({
          embedding: embedding,
          embedding_text: embeddingText.substring(0, 10000),
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', candidate.candidate_id);
    }

    result.success = true;

    const categoryChanged = result.new_category !== 'other';
    const icon = categoryChanged ? '***' : '';
    log(
      `  ${icon} Result: ${result.old_category} -> ${result.new_category} (position: ${result.new_position}) ${icon}`
    );

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logError(`  Failed: ${result.error}`);
    return result;
  }
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log("FIX 'OTHER' CATEGORY CANDIDATES");
  console.log('========================================');
  if (CONFIG.dryRun) console.log('MODE: DRY RUN (no changes will be made)');
  if (CONFIG.verbose) console.log('MODE: VERBOSE');
  console.log('========================================\n');

  const startTime = Date.now();

  // Get candidates to fix
  const candidates = await getOtherCategoryCandidates();

  if (candidates.length === 0) {
    log('No candidates to process');
    return;
  }

  // Process candidates
  const results: FixResult[] = [];

  for (const candidate of candidates) {
    const result = await fixCandidate(candidate);
    results.push(result);

    // Small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const categoryChanged = results.filter((r) => r.success && r.new_category !== 'other').length;

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Category changed (no longer 'other'): ${categoryChanged}`);
  console.log(`Still 'other': ${successful - categoryChanged}`);
  console.log(`Total time: ${totalTime}s`);
  console.log('========================================\n');

  // Show changed categories
  if (categoryChanged > 0) {
    console.log('Candidates with corrected categories:');
    for (const r of results.filter((r) => r.success && r.new_category !== 'other')) {
      console.log(`  - ${r.candidate_name}: other -> ${r.new_category} (${r.new_position})`);
    }
  }

  // Show remaining 'other' candidates
  const stillOther = results.filter((r) => r.success && r.new_category === 'other');
  if (stillOther.length > 0) {
    console.log('\nCandidates still in "other" category (may be correct):');
    for (const r of stillOther) {
      console.log(`  - ${r.candidate_name}: ${r.new_position || 'N/A'}`);
    }
  }

  // Show failed
  if (failed > 0) {
    console.log('\nFailed candidates:');
    for (const r of results.filter((r) => !r.success)) {
      console.log(`  - ${r.candidate_name}: ${r.error}`);
    }
  }
}

main().catch(console.error);

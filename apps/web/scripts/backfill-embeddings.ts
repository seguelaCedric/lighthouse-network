#!/usr/bin/env npx tsx
/**
 * Backfill embeddings for candidates with CVs from Bubble import
 *
 * Run: npx tsx scripts/backfill-embeddings.ts [limit]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { generateEmbedding, buildUnifiedCandidateEmbeddingText } from '@lighthouse/ai';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processCandidateEmbedding(candidateId: string): Promise<boolean> {
  try {
    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      console.log(`  ❌ Candidate not found: ${candidateId}`);
      return false;
    }

    // Fetch documents (especially CV with extracted text)
    const { data: documents } = await supabase
      .from('documents')
      .select('type, name, extracted_text')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidateId)
      .eq('is_latest_version', true)
      .is('deleted_at', null);

    // Build embedding text from profile and documents
    const profile = {
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
    };

    const docsForEmbedding = (documents || []).map(d => ({
      type: d.type as 'cv' | 'certificate' | 'written_reference' | 'id_document' | 'other',
      name: d.name,
      extracted_text: d.extracted_text,
      visibility: 'recruiter' as const,
    }));

    const embeddingText = buildUnifiedCandidateEmbeddingText(
      profile,
      docsForEmbedding,
      [],
      [],
      'recruiter'
    );

    if (embeddingText.length < 50) {
      console.log(`  ⚠️ ${candidate.first_name} ${candidate.last_name}: Insufficient text (${embeddingText.length} chars)`);
      return false;
    }

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Update candidate
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        embedding: embedding,
        embedding_text: embeddingText,
        embedding_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      console.log(`  ❌ ${candidate.first_name} ${candidate.last_name}: Update failed - ${updateError.message}`);
      return false;
    }

    console.log(`  ✅ ${candidate.first_name} ${candidate.last_name}: ${embedding.length} dims from ${embeddingText.length} chars`);
    return true;
  } catch (error) {
    console.log(`  ❌ ${candidateId}: ${error}`);
    return false;
  }
}

async function main() {
  const limit = parseInt(process.argv[2] || '500', 10);

  console.log(`\n🚀 Starting embedding backfill for up to ${limit} candidates...\n`);

  // Get candidates imported from Bubble who have CVs but no embedding
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, first_name, last_name')
    .is('embedding', null)
    .is('deleted_at', null)
    .eq('source', 'bubble_import')
    .limit(limit);

  if (error || !candidates) {
    console.error('Failed to fetch candidates:', error);
    process.exit(1);
  }

  console.log(`Found ${candidates.length} Bubble candidates without embeddings\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const success = await processCandidateEmbedding(candidate.id);

    if (success) {
      succeeded++;
    } else {
      failed++;
    }

    // Progress update every 50
    if ((i + 1) % 50 === 0) {
      console.log(`\nProgress: ${i + 1}/${candidates.length} (${succeeded} succeeded, ${failed} failed)\n`);
    }
  }

  console.log(`\n✅ Backfill complete:`);
  console.log(`   Processed: ${candidates.length}`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}\n`);
}

main().catch(console.error);

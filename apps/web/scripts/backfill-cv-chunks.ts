#!/usr/bin/env npx tsx
/**
 * CV Chunks Backfill Script
 *
 * Processes existing CV documents and creates chunked embeddings
 * for granular semantic search.
 *
 * Usage:
 *   npx tsx scripts/backfill-cv-chunks.ts [options]
 *
 * Options:
 *   --limit=N      Process at most N CVs (default: 1000)
 *   --batch=N      Process N CVs at a time (default: 10)
 *   --dry-run      Show what would be processed without making changes
 *   --force        Re-process CVs that already have chunks
 */

import { createClient } from '@supabase/supabase-js';
import { chunkCVText, generateEmbeddings } from '@lighthouse/ai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

const args = process.argv.slice(2);
const options = {
  limit: 1000,
  batch: 10,
  dryRun: false,
  force: false,
};

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--batch=')) {
    options.batch = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--force') {
    options.force = true;
  }
}

// ============================================================================
// STATS TRACKING
// ============================================================================

interface Stats {
  documentsFound: number;
  documentsProcessed: number;
  documentsSkipped: number;
  documentsFailed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  startTime: Date;
}

const stats: Stats = {
  documentsFound: 0,
  documentsProcessed: 0,
  documentsSkipped: 0,
  documentsFailed: 0,
  chunksCreated: 0,
  embeddingsGenerated: 0,
  startTime: new Date(),
};

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function main() {
  console.log('🚀 CV Chunks Backfill Script');
  console.log('============================');
  console.log(`Options: limit=${options.limit}, batch=${options.batch}, dryRun=${options.dryRun}, force=${options.force}`);
  console.log('');

  // Get CV documents that need processing
  let query = supabase
    .from('documents')
    .select('id, entity_id, extracted_text')
    .eq('type', 'cv')
    .eq('entity_type', 'candidate')
    .is('deleted_at', null)
    .not('extracted_text', 'is', null)
    .gt('extracted_text', '') // Has content
    .order('created_at', { ascending: false })
    .limit(options.limit);

  // If not forcing, exclude documents that already have chunks
  if (!options.force) {
    const { data: existingChunks } = await supabase
      .from('cv_chunks')
      .select('document_id');

    const existingDocIds = new Set((existingChunks || []).map((c) => c.document_id));

    if (existingDocIds.size > 0) {
      console.log(`Found ${existingDocIds.size} documents already processed, excluding...`);
    }
  }

  const { data: documents, error: fetchError } = await query;

  if (fetchError) {
    console.error('Failed to fetch documents:', fetchError);
    process.exit(1);
  }

  if (!documents || documents.length === 0) {
    console.log('No CV documents found to process.');
    return;
  }

  stats.documentsFound = documents.length;
  console.log(`Found ${documents.length} CV documents to process`);
  console.log('');

  if (options.dryRun) {
    console.log('DRY RUN - No changes will be made');
    console.log('');
  }

  // Process in batches
  for (let i = 0; i < documents.length; i += options.batch) {
    const batch = documents.slice(i, i + options.batch);
    console.log(`Processing batch ${Math.floor(i / options.batch) + 1}/${Math.ceil(documents.length / options.batch)}`);

    await processBatch(batch);

    // Progress update
    const progress = Math.min(i + options.batch, documents.length);
    const elapsed = (Date.now() - stats.startTime.getTime()) / 1000;
    const rate = stats.documentsProcessed / elapsed;
    console.log(`  Progress: ${progress}/${documents.length} (${rate.toFixed(1)} docs/sec)`);
    console.log('');
  }

  // Final stats
  printStats();
}

async function processBatch(
  documents: Array<{ id: string; entity_id: string; extracted_text: string }>
) {
  for (const doc of documents) {
    try {
      await processDocument(doc);
      stats.documentsProcessed++;
    } catch (error) {
      console.error(`  ❌ Failed to process ${doc.id}:`, error);
      stats.documentsFailed++;
    }
  }
}

async function processDocument(doc: {
  id: string;
  entity_id: string;
  extracted_text: string;
}) {
  const text = doc.extracted_text;

  // Skip if text is too short
  if (!text || text.length < 100) {
    console.log(`  ⏭️ Skipping ${doc.id}: text too short (${text?.length || 0} chars)`);
    stats.documentsSkipped++;
    return;
  }

  // Generate chunks
  const chunks = chunkCVText(text, {
    maxChunkSize: 3200,
    minChunkSize: 400,
    overlapSize: 250,
    maxChunks: 5,
  });

  if (chunks.length === 0) {
    console.log(`  ⏭️ Skipping ${doc.id}: no chunks generated`);
    stats.documentsSkipped++;
    return;
  }

  console.log(`  📄 ${doc.id}: ${chunks.length} chunks from ${text.length} chars`);

  if (options.dryRun) {
    stats.chunksCreated += chunks.length;
    return;
  }

  // Generate embeddings for all chunks
  const chunkTexts = chunks.map((c) => c.text);
  let embeddings: number[][] = [];

  try {
    embeddings = await generateEmbeddings(chunkTexts);
    stats.embeddingsGenerated += embeddings.length;
  } catch (embeddingError) {
    console.error(`    ⚠️ Embedding generation failed:`, embeddingError);
    // Continue without embeddings - they can be generated later
  }

  // Delete existing chunks for this document (if any)
  if (options.force) {
    await supabase.from('cv_chunks').delete().eq('document_id', doc.id);
  }

  // Insert new chunks
  const chunkRecords = chunks.map((chunk, idx) => ({
    document_id: doc.id,
    candidate_id: doc.entity_id,
    chunk_index: chunk.chunkIndex,
    chunk_text: chunk.text,
    chunk_start_offset: chunk.startOffset,
    chunk_end_offset: chunk.endOffset,
    section_type: chunk.sectionType,
    section_weight: chunk.sectionWeight,
    embedding: embeddings[idx] ? JSON.stringify(embeddings[idx]) : null,
  }));

  const { error: insertError } = await supabase.from('cv_chunks').insert(chunkRecords);

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  stats.chunksCreated += chunks.length;
  console.log(`    ✅ Created ${chunks.length} chunks`);
}

function printStats() {
  const elapsed = (Date.now() - stats.startTime.getTime()) / 1000;

  console.log('');
  console.log('============================');
  console.log('📊 Backfill Complete');
  console.log('============================');
  console.log(`Documents found:     ${stats.documentsFound}`);
  console.log(`Documents processed: ${stats.documentsProcessed}`);
  console.log(`Documents skipped:   ${stats.documentsSkipped}`);
  console.log(`Documents failed:    ${stats.documentsFailed}`);
  console.log(`Chunks created:      ${stats.chunksCreated}`);
  console.log(`Embeddings generated:${stats.embeddingsGenerated}`);
  console.log(`Total time:          ${elapsed.toFixed(1)}s`);
  console.log(`Rate:                ${(stats.documentsProcessed / elapsed).toFixed(1)} docs/sec`);
  console.log('');

  if (options.dryRun) {
    console.log('DRY RUN - No changes were made');
  }
}

// ============================================================================
// RUN
// ============================================================================

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * Test script to debug V4 Agentic Search pipeline
 * Run: npx tsx scripts/test-v4-search.ts
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, parseQuerySafe } from '@lighthouse/ai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VECTOR_MATCH_THRESHOLD = 0.30;

async function testV4Search() {
  console.log('='.repeat(60));
  console.log('V4 SEARCH DEBUG TEST');
  console.log('='.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Test query
  const query = 'purser';
  console.log(`\nTest query: "${query}"`);

  // Stage 1: Parse query
  console.log('\n--- STAGE 1: Query Parsing ---');
  const parsedQuery = await parseQuerySafe(query);
  console.log('Parsed query:', JSON.stringify(parsedQuery, null, 2));

  // Stage 2: Generate embedding
  console.log('\n--- STAGE 2: Generate Embedding ---');
  const queryEmbedding = await generateEmbedding(query);
  console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

  // Stage 3: Fetch candidates with embeddings
  console.log('\n--- STAGE 3: Fetch Candidates ---');
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      id,
      first_name,
      last_name,
      primary_position,
      years_experience,
      verification_tier,
      availability_status,
      has_stcw,
      has_eng1,
      embedding
    `)
    .is('deleted_at', null)
    .not('embedding', 'is', null)
    .limit(100);

  if (error) {
    console.error('Error fetching candidates:', error);
    return;
  }

  console.log(`Fetched ${candidates?.length || 0} candidates with embeddings`);

  // Stage 4: Calculate vector similarity
  console.log('\n--- STAGE 4: Vector Similarity ---');

  // Debug: Check what type the embedding is
  if (candidates && candidates.length > 0) {
    const firstCandidate = candidates[0];
    console.log('Embedding type:', typeof firstCandidate.embedding);
    console.log('Is array:', Array.isArray(firstCandidate.embedding));
    if (typeof firstCandidate.embedding === 'string') {
      console.log('Embedding string preview:', firstCandidate.embedding.substring(0, 100));
    } else if (Array.isArray(firstCandidate.embedding)) {
      console.log('Embedding array length:', firstCandidate.embedding.length);
      console.log('First few values:', firstCandidate.embedding.slice(0, 5));
    }
  }

  const results: Array<{
    id: string;
    name: string;
    position: string | null;
    similarity: number;
  }> = [];

  for (const candidate of candidates || []) {
    let embedding: number[] | null = null;

    // Handle both string and array formats
    if (typeof candidate.embedding === 'string') {
      try {
        embedding = JSON.parse(candidate.embedding);
      } catch {
        console.error(`Failed to parse embedding for ${candidate.first_name}`);
        continue;
      }
    } else if (Array.isArray(candidate.embedding)) {
      embedding = candidate.embedding;
    }

    if (!embedding || embedding.length === 0) continue;

    const similarity = cosineSimilarity(queryEmbedding, embedding);
    results.push({
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`,
      position: candidate.primary_position,
      similarity,
    });
  }

  // Sort by similarity
  results.sort((a, b) => b.similarity - a.similarity);

  // Show top 10
  console.log('\nTop 10 by vector similarity:');
  results.slice(0, 10).forEach((r, i) => {
    const passThreshold = r.similarity >= VECTOR_MATCH_THRESHOLD ? '✓' : '✗';
    console.log(`${i + 1}. [${passThreshold}] ${r.name} (${r.position}) - ${(r.similarity * 100).toFixed(2)}%`);
  });

  // Count passing threshold
  const passingThreshold = results.filter(r => r.similarity >= VECTOR_MATCH_THRESHOLD);
  console.log(`\nPassing threshold (>= ${VECTOR_MATCH_THRESHOLD * 100}%): ${passingThreshold.length} candidates`);

  // Show Pursers specifically
  console.log('\n--- PURSER CANDIDATES ---');
  const pursers = results.filter(r => r.position?.toLowerCase().includes('purser'));
  pursers.forEach((p, i) => {
    const passThreshold = p.similarity >= VECTOR_MATCH_THRESHOLD ? '✓ PASS' : '✗ FAIL';
    console.log(`${i + 1}. ${p.name} - ${(p.similarity * 100).toFixed(2)}% ${passThreshold}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

testV4Search().catch(console.error);

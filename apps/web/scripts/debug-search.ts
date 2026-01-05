#!/usr/bin/env npx tsx
/**
 * Debug script to trace why "chief stewardess for 50m yacht" returns 0 results
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Copy of getDepartment from route.ts
function getDepartment(role: string): string | null {
  const roleLower = role.toLowerCase();

  // Deck
  if (['deckhand', 'bosun', 'officer', 'captain', 'mate', 'master'].some(d => roleLower.includes(d))) {
    return 'deck';
  }
  // Interior
  if (['stew', 'purser', 'butler', 'footman'].some(d => roleLower.includes(d))) {
    return 'interior';
  }
  // Engineering
  if (['engineer', 'eto', 'mechanic', 'electrician'].some(d => roleLower.includes(d))) {
    return 'engineering';
  }
  // Galley
  if (['chef', 'cook', 'galley', 'sous'].some(d => roleLower.includes(d))) {
    return 'galley';
  }
  // Management
  if (['manager', 'director', 'head of'].some(d => roleLower.includes(d))) {
    return 'management';
  }
  // Childcare
  if (['nanny', 'governess', 'tutor'].some(d => roleLower.includes(d))) {
    return 'childcare';
  }

  return null;
}

const CAREER_LADDERS: string[][] = [
  ['deckhand', 'lead deckhand', 'bosun', 'second officer', 'first officer', 'chief officer', 'captain'],
  ['stewardess', 'second stewardess', 'chief stewardess', 'purser', 'interior manager'],
  ['junior engineer', 'third engineer', 'second engineer', 'chief engineer'],
  ['cook', 'sous chef', 'chef', 'head chef', 'executive chef'],
  ['footman', 'under butler', 'butler', 'head butler', 'house manager'],
  ['housemaid', 'housekeeper', 'head housekeeper', 'house manager'],
  ['nanny', 'head nanny', 'governess'],
  ['security officer', 'close protection officer', 'head of security'],
];

function getEligibleRolesForStepUp(targetRole: string): string[] {
  const normalized = targetRole.toLowerCase().trim();
  const eligible = new Set<string>([normalized]);

  for (const ladder of CAREER_LADDERS) {
    const targetIndex = ladder.findIndex(r =>
      r.includes(normalized) || normalized.includes(r)
    );

    if (targetIndex > 0) {
      eligible.add(ladder[targetIndex - 1]);
    }

    if (targetIndex >= 0) {
      eligible.add(ladder[targetIndex]);
    }
  }

  return Array.from(eligible);
}

function areDepartmentsCompatible(searchRole: string, candidateRole: string): boolean {
  const searchDept = getDepartment(searchRole);
  const candidateDept = getDepartment(candidateRole);

  if (!searchDept || !candidateDept) return true;
  if (searchDept === candidateDept) return true;

  if ((searchDept === 'interior' && candidateDept === 'management') ||
      (searchDept === 'management' && candidateDept === 'interior')) {
    return true;
  }

  return false;
}

function isPositionEligible(
  candidatePosition: string | null,
  candidatePositionsHeld: string[] | null,
  targetRole: string
): boolean {
  if (!candidatePosition && (!candidatePositionsHeld || candidatePositionsHeld.length === 0)) {
    return false;
  }

  const eligibleRoles = getEligibleRolesForStepUp(targetRole);
  const currentPosition = candidatePosition?.toLowerCase() || '';

  if (!currentPosition) {
    const heldPositions = (candidatePositionsHeld || []).map(p => p.toLowerCase());
    return heldPositions.some(pos =>
      eligibleRoles.some(eligible =>
        pos.includes(eligible) || eligible.includes(pos)
      )
    );
  }

  return eligibleRoles.some(eligible =>
    currentPosition.includes(eligible) || eligible.includes(currentPosition)
  );
}

// Cosine similarity
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

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

async function main() {
  const searchRole = 'chief stewardess';

  console.log('\n========== DEBUG SEARCH ==========\n');
  console.log(`Search role: "${searchRole}"`);

  // 1. Test getEligibleRolesForStepUp
  console.log('\n--- Testing getEligibleRolesForStepUp ---');
  const eligibleRoles = getEligibleRolesForStepUp(searchRole);
  console.log('Eligible roles:', eligibleRoles);

  // Trace through the bug
  console.log('\n--- Tracing findIndex bug ---');
  const interiorLadder = ['stewardess', 'second stewardess', 'chief stewardess', 'purser', 'interior manager'];
  const normalized = searchRole.toLowerCase().trim();
  console.log(`Normalized role: "${normalized}"`);

  interiorLadder.forEach((r, i) => {
    const includes = r.includes(normalized);
    const includesReverse = normalized.includes(r);
    console.log(`  [${i}] "${r}": r.includes(normalized)=${includes}, normalized.includes(r)=${includesReverse}`);
  });

  const foundIndex = interiorLadder.findIndex(r =>
    r.includes(normalized) || normalized.includes(r)
  );
  console.log(`findIndex returns: ${foundIndex} (should be 2)`);

  // 2. Query candidates
  console.log('\n--- Querying candidates ---');
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      id,
      first_name,
      last_name,
      primary_position,
      positions_held,
      years_experience,
      embedding
    `)
    .is('deleted_at', null)
    .not('embedding', 'is', null)
    .limit(100);

  if (error) {
    console.error('Query error:', error);
    return;
  }

  console.log(`Total candidates with embeddings: ${candidates?.length || 0}`);

  // 3. Filter by department
  console.log('\n--- Department filter ---');
  const afterDepartment = candidates?.filter(c => {
    const compatible = areDepartmentsCompatible(searchRole, c.primary_position || '');
    if (!compatible) {
      console.log(`  ✗ ${c.first_name} ${c.last_name} (${c.primary_position}) - department mismatch`);
    }
    return compatible;
  });
  console.log(`After department filter: ${afterDepartment?.length || 0}`);

  // 4. Filter by position eligibility
  console.log('\n--- Position eligibility filter ---');
  const afterPosition = afterDepartment?.filter(c => {
    const eligible = isPositionEligible(c.primary_position, c.positions_held, searchRole);
    if (!eligible) {
      console.log(`  ✗ ${c.first_name} ${c.last_name} (${c.primary_position}) - position not eligible`);
    } else {
      console.log(`  ✓ ${c.first_name} ${c.last_name} (${c.primary_position}) - ELIGIBLE`);
    }
    return eligible;
  });
  console.log(`After position filter: ${afterPosition?.length || 0}`);

  // 5. Check embeddings and similarity
  console.log('\n--- Embedding check ---');
  if (afterPosition && afterPosition.length > 0) {
    for (const c of afterPosition.slice(0, 3)) {
      console.log(`\nCandidate: ${c.first_name} ${c.last_name}`);
      console.log(`  Embedding type: ${typeof c.embedding}`);

      let embedding: number[] | null = null;
      if (typeof c.embedding === 'string') {
        try {
          embedding = JSON.parse(c.embedding);
          console.log(`  Parsed from string: ${embedding?.length} dimensions`);
        } catch (e) {
          console.log(`  Failed to parse embedding: ${e}`);
        }
      } else if (Array.isArray(c.embedding)) {
        embedding = c.embedding;
        console.log(`  Already array: ${embedding?.length} dimensions`);
      } else {
        console.log(`  Unknown embedding format:`, c.embedding);
      }

      // Show first 5 values
      if (embedding && embedding.length > 0) {
        console.log(`  First 5 values: [${embedding.slice(0, 5).join(', ')}]`);
      }
    }
  }

  // 6. Generate query embedding and test similarity
  console.log('\n--- Query embedding and similarity test ---');

  // We need to generate an embedding for the query
  // Using OpenAI's text-embedding-3-small model via direct HTTP call
  const query = 'a chief stewardess for a 50m yacht';
  console.log(`Query: "${query}"`);

  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  });

  const embeddingData = await embeddingResponse.json();
  if (!embeddingData.data?.[0]?.embedding) {
    console.error('Failed to get embedding:', embeddingData);
    return;
  }

  const queryEmbedding = embeddingData.data[0].embedding;
  console.log(`Query embedding: ${queryEmbedding.length} dimensions`);

  // Test similarity for each position-eligible candidate
  console.log('\n--- Similarity scores (threshold = 0.35) ---');
  const VECTOR_MATCH_THRESHOLD = 0.35;

  const candidatesWithScores: Array<{
    name: string;
    position: string;
    similarity: number;
    passesThreshold: boolean;
  }> = [];

  for (const c of afterPosition || []) {
    let embedding: number[] | null = null;
    if (typeof c.embedding === 'string') {
      try {
        embedding = JSON.parse(c.embedding);
      } catch {
        continue;
      }
    } else if (Array.isArray(c.embedding)) {
      embedding = c.embedding;
    }

    if (!embedding || embedding.length === 0) continue;

    const similarity = cosineSimilarity(queryEmbedding, embedding);
    const passes = similarity >= VECTOR_MATCH_THRESHOLD;

    candidatesWithScores.push({
      name: `${c.first_name} ${c.last_name}`,
      position: c.primary_position || 'N/A',
      similarity,
      passesThreshold: passes,
    });

    const status = passes ? '✓' : '✗';
    console.log(`  ${status} ${c.first_name} ${c.last_name} (${c.primary_position}): ${similarity.toFixed(4)}`);
  }

  // Summary
  const passing = candidatesWithScores.filter(c => c.passesThreshold);
  console.log(`\nSummary: ${passing.length}/${candidatesWithScores.length} candidates pass similarity threshold`);

  if (passing.length === 0) {
    console.log('\n⚠️  NO CANDIDATES PASS SIMILARITY THRESHOLD - This is the bug!');
    console.log('\nLowering threshold to 0.25 to see who would match:');
    const wouldMatch = candidatesWithScores.filter(c => c.similarity >= 0.25);
    wouldMatch.forEach(c => {
      console.log(`  ${c.name} (${c.position}): ${c.similarity.toFixed(4)}`);
    });
  }

  console.log('\n========== END DEBUG ==========\n');
}

main().catch(console.error);

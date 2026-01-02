// ============================================================================
// V4 AGENTIC SEARCH - API Endpoint
// ============================================================================
// 4-Stage Pipeline:
// 1. Query Parser (gpt-4o-mini) → Extract structured requirements
// 2. SQL Hard Filters → Deterministic filtering in PostgreSQL
// 3. Vector Search → pgvector similarity (low threshold, cast wide net)
// 4. Agentic Judge (Claude Haiku) → REAL reasoning + fit scores
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  generateEmbedding,
  parseQuerySafe,
  evaluateCandidatesSafe,
  type ParsedQuery,
  type AgenticCandidateProfile,
  type V4SearchResult,
  type V4SearchResponse,
  type PipelineStats,
} from '@lighthouse/ai';

// ----------------------------------------------------------------------------
// REQUEST VALIDATION
// ----------------------------------------------------------------------------

const v4SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(20),
  useFallback: z.boolean().default(false), // Keep Cohere as safety net
});

// ----------------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------------

/** Vector similarity threshold - LOW to cast wide net before agentic filtering */
const VECTOR_MATCH_THRESHOLD = 0.30;

/** Maximum candidates to send to agentic judge (cost control) */
const MAX_CANDIDATES_FOR_AGENTIC = 30;

/** Minimum fit score from agentic judge to include in results */
const MIN_AGENTIC_FIT_SCORE = 40;

// ----------------------------------------------------------------------------
// MAIN HANDLER
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = v4SearchRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { query, limit } = parseResult.data;

    console.log(`[V4 Search] Starting pipeline for: "${query}"`);

    // =========================================================================
    // STAGE 1: QUERY PARSING (gpt-4o-mini)
    // =========================================================================
    console.log('[V4 Search] Stage 1: Parsing query...');
    const parsedQuery = await parseQuerySafe(query);
    console.log('[V4 Search] Parsed:', JSON.stringify(parsedQuery, null, 2));

    // =========================================================================
    // STAGE 2: SQL HARD FILTERS + VECTOR SEARCH
    // =========================================================================
    console.log('[V4 Search] Stage 2: SQL filters + Vector search...');

    // Generate query embedding for semantic search
    const queryEmbedding = await generateEmbedding(query);

    // Build dynamic SQL filter query
    const candidatesAfterFilters = await applyHardFiltersAndVectorSearch(
      supabase,
      parsedQuery,
      queryEmbedding,
      MAX_CANDIDATES_FOR_AGENTIC * 2 // Fetch more than needed
    );

    const pipelineStats: PipelineStats = {
      afterHardFilters: candidatesAfterFilters.length,
      afterVectorSearch: 0,
      afterAgenticJudge: 0,
    };

    console.log(`[V4 Search] After hard filters: ${candidatesAfterFilters.length} candidates`);

    // Check if we have no candidates after hard filters
    if (candidatesAfterFilters.length === 0) {
      const noResultsResponse: V4SearchResponse = {
        results: [],
        total_count: 0,
        processing_time_ms: Date.now() - startTime,
        parsedQuery,
        pipelineStats,
        noResultsReason: 'No candidates match the hard filter requirements',
        suggestions: await getPositionSuggestions(supabase, query),
      };
      return NextResponse.json(noResultsResponse);
    }

    // =========================================================================
    // STAGE 3: PREPARE CANDIDATES FOR AGENTIC JUDGE
    // =========================================================================
    // Take top candidates by vector score for agentic evaluation
    const candidatesForAgentic = candidatesAfterFilters
      .sort((a, b) => b.vectorScore - a.vectorScore)
      .slice(0, MAX_CANDIDATES_FOR_AGENTIC);

    pipelineStats.afterVectorSearch = candidatesForAgentic.length;
    console.log(`[V4 Search] Stage 3: Sending ${candidatesForAgentic.length} to Agentic Judge`);

    // =========================================================================
    // STAGE 4: AGENTIC JUDGE (Claude Haiku)
    // =========================================================================
    console.log('[V4 Search] Stage 4: Agentic evaluation...');

    // Build candidate profiles for the agentic judge
    // Include enriched CV extraction data for better evaluation
    const candidateProfiles: AgenticCandidateProfile[] = candidatesForAgentic.map((c) => ({
      candidate_id: c.candidate_id,
      first_name: c.first_name,
      last_name: c.last_name,
      primary_position: c.primary_position,
      years_experience: c.years_experience,
      certifications: buildCertificationsList(c),
      skills: [...(c.skills || []), ...(c.cv_skills || [])].filter((s, i, a) => a.indexOf(s) === i), // Dedupe skills
      bio: c.bio ?? undefined,
      current_location: c.current_location ?? undefined,
      nationality: c.nationality ?? undefined,
      // Enhanced fields from CV extraction
      positions_held: c.positions_held?.length ? c.positions_held : undefined,
      languages: c.languages_extracted?.length
        ? c.languages_extracted.map((l) => ({ language: l.language, proficiency: l.proficiency }))
        : undefined,
      yacht_experience: c.yacht_experience_extracted?.length
        ? c.yacht_experience_extracted.map((y) => ({
            yacht_name: y.yacht_name,
            yacht_size_meters: y.yacht_size_meters,
            position: y.position,
            duration_months: y.duration_months,
          }))
        : undefined,
    }));

    // Evaluate all candidates with Claude Haiku
    const evaluations = await evaluateCandidatesSafe(parsedQuery, candidateProfiles, 5);

    // Build final results with agentic explanations
    const results: V4SearchResult[] = candidatesForAgentic
      .map((c): V4SearchResult | null => {
        const evaluation = evaluations.get(c.candidate_id);
        if (!evaluation) return null;

        return {
          candidate_id: c.candidate_id,
          first_name: c.first_name,
          last_name: c.last_name,
          primary_position: c.primary_position,
          years_experience: c.years_experience,
          verification_tier: c.verification_tier,
          availability_status: c.availability_status,
          nationality: c.nationality,
          current_location: c.current_location,
          avatar_url: c.avatar_url,
          agenticExplanation: evaluation,
          vectorScore: c.vectorScore,
          finalScore: evaluation.fitScore,
        };
      })
      .filter((r): r is V4SearchResult => r !== null && r.finalScore >= MIN_AGENTIC_FIT_SCORE)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);

    pipelineStats.afterAgenticJudge = results.length;
    console.log(`[V4 Search] Stage 4: ${results.length} qualified results (score >= ${MIN_AGENTIC_FIT_SCORE})`);

    // Check if no results qualified
    if (results.length === 0) {
      const noResultsResponse: V4SearchResponse = {
        results: [],
        total_count: 0,
        processing_time_ms: Date.now() - startTime,
        parsedQuery,
        pipelineStats,
        noResultsReason: `No candidates achieved a fit score of ${MIN_AGENTIC_FIT_SCORE}% or higher`,
        suggestions: await getPositionSuggestions(supabase, query),
      };
      return NextResponse.json(noResultsResponse);
    }

    // Build successful response
    const response: V4SearchResponse = {
      results,
      total_count: results.length,
      processing_time_ms: Date.now() - startTime,
      parsedQuery,
      pipelineStats,
    };

    console.log(`[V4 Search] Complete in ${response.processing_time_ms}ms`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[V4 Search] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// HELPER: Apply Hard Filters + Vector Search
// ----------------------------------------------------------------------------

interface CandidateWithVector {
  candidate_id: string;
  first_name: string;
  last_name: string;
  primary_position: string | null;
  years_experience: number | null;
  position_category: string | null;
  verification_tier: string;
  availability_status: string;
  nationality: string | null;
  current_location: string | null;
  avatar_url: string | null;
  has_stcw: boolean;
  has_eng1: boolean;
  has_schengen: boolean;
  has_b1b2: boolean;
  skills: string[];
  positions_held: string[];
  cv_skills: string[];
  certifications_extracted: CertificationExtracted[];
  licenses_extracted: LicenseExtracted[];
  languages_extracted: LanguageExtracted[];
  yacht_experience_extracted: YachtExperienceExtracted[];
  bio: string | null;
  vectorScore: number;
}

// Types for extracted CV data
interface CertificationExtracted {
  name: string;
  category: string;
  expiry_date?: string | null;
  license_number?: string | null;
}

interface LicenseExtracted {
  name: string;
  license_type?: string | null;
  issuing_authority?: string | null;
  license_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  limitations?: string | null;
}

interface LanguageExtracted {
  language: string;
  proficiency: string;
}

interface YachtExperienceExtracted {
  yacht_name?: string | null;
  yacht_size_meters?: number | null;
  position: string;
  duration_months?: number | null;
  yacht_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

async function applyHardFiltersAndVectorSearch(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  parsedQuery: ParsedQuery,
  queryEmbedding: number[],
  maxResults: number
): Promise<CandidateWithVector[]> {
  // Build the base query - includes CV extraction fields for richer agentic evaluation
  let query = supabase
    .from('candidates')
    .select(`
      id,
      first_name,
      last_name,
      primary_position,
      years_experience,
      position_category,
      verification_tier,
      availability_status,
      nationality,
      current_location,
      avatar_url,
      has_stcw,
      has_eng1,
      has_schengen,
      has_b1b2,
      search_keywords,
      profile_summary,
      embedding,
      positions_held,
      cv_skills,
      certifications_extracted,
      licenses_extracted,
      languages_extracted,
      yacht_experience_extracted
    `)
    .is('deleted_at', null)
    .not('embedding', 'is', null);

  // Apply hard filters from parsed query
  const { hardFilters } = parsedQuery;

  // IMPORTANT: Position is NOT a hard filter for V4 search
  // For role-based searches (e.g., "purser", "deckhand"), we rely on:
  // 1. Vector similarity (which searches the full embedding of profile + keywords)
  // 2. Agentic judge (which evaluates candidate fit holistically)
  //
  // This is intentional - hard position filters are too restrictive because:
  // - Candidates may have relevant experience in their profile but different primary_position
  // - Similar roles (e.g., "Stewardess" vs "Chief Stewardess") should all be considered
  // - The agentic judge is better at evaluating role relevance than exact string matching

  // Certification filters
  if (hardFilters.require_stcw === true) {
    query = query.eq('has_stcw', true);
  }
  if (hardFilters.require_eng1 === true) {
    query = query.eq('has_eng1', true);
  }

  // Visa filters
  if (hardFilters.require_schengen === true) {
    query = query.eq('has_schengen', true);
  }
  if (hardFilters.require_b1b2 === true) {
    query = query.eq('has_b1b2', true);
  }

  // Experience filters
  if (hardFilters.min_experience !== undefined) {
    query = query.gte('years_experience', hardFilters.min_experience);
  }
  if (hardFilters.max_experience !== undefined) {
    query = query.lte('years_experience', hardFilters.max_experience);
  }

  // Execute query
  const { data: candidates, error } = await query.limit(maxResults * 3);

  if (error) {
    console.error('[V4 Search] Hard filter query error:', error);
    throw new Error(`Failed to query candidates: ${error.message}`);
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Calculate vector similarity for each candidate
  const results: CandidateWithVector[] = candidates
    .map((c) => {
      // Handle embedding as string (Supabase returns vector type as string)
      let embedding: number[] | null = null;
      if (typeof c.embedding === 'string') {
        try {
          embedding = JSON.parse(c.embedding);
        } catch {
          return null;
        }
      } else if (Array.isArray(c.embedding)) {
        embedding = c.embedding;
      }

      if (!embedding || embedding.length === 0) return null;

      // Calculate cosine similarity
      const vectorScore = cosineSimilarity(queryEmbedding, embedding);

      // Filter by vector threshold
      if (vectorScore < VECTOR_MATCH_THRESHOLD) return null;

      return {
        candidate_id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        primary_position: c.primary_position,
        years_experience: c.years_experience,
        position_category: c.position_category,
        verification_tier: c.verification_tier,
        availability_status: c.availability_status,
        nationality: c.nationality,
        current_location: c.current_location,
        avatar_url: c.avatar_url,
        has_stcw: c.has_stcw,
        has_eng1: c.has_eng1,
        has_schengen: c.has_schengen,
        has_b1b2: c.has_b1b2,
        skills: c.search_keywords || [],
        positions_held: c.positions_held || [],
        cv_skills: c.cv_skills || [],
        certifications_extracted: c.certifications_extracted || [],
        licenses_extracted: c.licenses_extracted || [],
        languages_extracted: c.languages_extracted || [],
        yacht_experience_extracted: c.yacht_experience_extracted || [],
        bio: c.profile_summary,
        vectorScore,
      };
    })
    .filter((c): c is CandidateWithVector => c !== null);

  return results;
}

// ----------------------------------------------------------------------------
// HELPER: Cosine Similarity
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// HELPER: Build Certifications List (uses extracted CV data)
// ----------------------------------------------------------------------------

function buildCertificationsList(candidate: CandidateWithVector): string[] {
  const certs = new Set<string>();

  // Add certifications from CV extraction
  if (candidate.certifications_extracted && candidate.certifications_extracted.length > 0) {
    candidate.certifications_extracted.forEach((cert) => {
      certs.add(cert.name);
    });
  }

  // Add licenses from CV extraction
  if (candidate.licenses_extracted && candidate.licenses_extracted.length > 0) {
    candidate.licenses_extracted.forEach((license) => {
      certs.add(license.name);
    });
  }

  // Fallback to boolean flags if no extraction data
  if (certs.size === 0) {
    if (candidate.has_stcw) certs.add('STCW');
    if (candidate.has_eng1) certs.add('ENG1');
  }

  // Always add visa info from boolean flags (not extracted from CV)
  if (candidate.has_schengen) certs.add('Schengen Visa');
  if (candidate.has_b1b2) certs.add('B1/B2 US Visa');

  return Array.from(certs);
}

// ----------------------------------------------------------------------------
// HELPER: Get Position Suggestions
// ----------------------------------------------------------------------------

async function getPositionSuggestions(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  query: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select('primary_position')
    .not('primary_position', 'is', null)
    .is('deleted_at', null)
    .limit(200);

  if (error || !data) {
    return [];
  }

  // Get unique positions
  const positions = [
    ...new Set(
      data
        .map((c) => c.primary_position)
        .filter((p): p is string => !!p && p.length > 0)
    ),
  ];

  // Find positions that share words with the query
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const relatedPositions = positions.filter((pos) => {
    const posLower = pos.toLowerCase();
    return queryWords.some(
      (word) => posLower.includes(word) || word.includes(posLower.split(' ')[0])
    );
  });

  if (relatedPositions.length > 0) {
    return relatedPositions.slice(0, 5);
  }

  // Return most common positions
  const positionCounts = new Map<string, number>();
  data.forEach((c) => {
    if (c.primary_position) {
      positionCounts.set(
        c.primary_position,
        (positionCounts.get(c.primary_position) || 0) + 1
      );
    }
  });

  return [...positionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pos]) => pos);
}

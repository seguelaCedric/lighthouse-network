import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding, rerankDocuments } from '@lighthouse/ai';
import {
  cvSearchRequestSchema,
  type CVSearchResult,
  type CVSearchResponse,
  type MatchExplanation,
} from '@/lib/validations/cv-search';

interface RerankDocument {
  id: string;
  text: string;
}

// ============================================================================
// V3: MINIMUM RELEVANCE THRESHOLD
// ============================================================================

/**
 * Minimum relevance score (0.0 - 1.0) for a result to be shown
 *
 * After Cohere reranking, results below this threshold are filtered out.
 * This prevents showing irrelevant "closest match" results when no
 * actual matches exist in the database.
 *
 * 0.25 means: "Show results only if Cohere thinks they're at least 25% relevant"
 */
const MINIMUM_RELEVANCE_THRESHOLD = 0.25;

// ============================================================================
// QUERY PARSING - Extract experience (soft signal, not hard filter)
// ============================================================================

/**
 * Parse experience requirement from natural language query
 * Examples: "5 years experience", "3+ yrs", "10 years"
 *
 * NOTE: This is used for DISPLAY only - not for hard filtering.
 * Cohere reranking handles relevance based on rich candidate text.
 */
function parseExperienceFromQuery(query: string): number | null {
  // Match patterns like "5 years", "3+ years", "10 yrs experience"
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+(?:of\s+)?experience)?/i,
    /(?:at\s+least\s+)?(\d+)\s*(?:years?|yrs?)/i,
    /experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)?/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

// REMOVED: detectJobCategory() - This was blocking valid searches
// The whole point of semantic search + Cohere reranking is that AI understands
// the query semantically. Hardcoded keyword matching is the opposite of AI.

/**
 * Build rich text for Cohere reranking
 *
 * This is THE critical function that makes AI search intelligent.
 * Cohere's cross-encoder model will READ this text and the query,
 * then determine relevance based on semantic understanding.
 *
 * The more context we provide, the smarter the ranking.
 */
function buildRerankingText(candidate: Record<string, unknown>): string {
  const parts: string[] = [];

  // Position (most important for matching)
  if (candidate.primary_position) {
    parts.push(`POSITION: ${candidate.primary_position}`);
  }
  if (Array.isArray(candidate.secondary_positions) && candidate.secondary_positions.length > 0) {
    parts.push(`ALSO QUALIFIED AS: ${candidate.secondary_positions.join(', ')}`);
  }

  // Experience
  if (candidate.years_experience) {
    parts.push(`EXPERIENCE: ${candidate.years_experience} years`);
  }

  // Location (critical for "in barcelona" type queries)
  const locationParts = [candidate.current_location, candidate.current_country].filter(Boolean);
  if (locationParts.length > 0) {
    parts.push(`LOCATION: ${locationParts.join(', ')}`);
  }

  // Availability (critical for "available today/immediately" queries)
  if (candidate.availability_status) {
    let availText = `AVAILABILITY: ${candidate.availability_status}`;
    if (candidate.available_from) {
      availText += ` from ${candidate.available_from}`;
    }
    parts.push(availText);
  }

  // Certifications (for any industry)
  const certs: string[] = [];
  if (candidate.has_stcw) certs.push('STCW');
  if (candidate.has_eng1) certs.push('ENG1');
  if (candidate.highest_license) certs.push(candidate.highest_license as string);
  if (certs.length > 0) {
    parts.push(`CERTIFICATIONS: ${certs.join(', ')}`);
  }

  // Visas
  const visas: string[] = [];
  if (candidate.has_schengen) visas.push('Schengen');
  if (candidate.has_b1b2) visas.push('B1/B2 USA');
  if (candidate.has_c1d) visas.push('C1/D');
  if (visas.length > 0) {
    parts.push(`VISAS: ${visas.join(', ')}`);
  }

  // Nationality
  if (candidate.nationality) {
    parts.push(`NATIONALITY: ${candidate.nationality}`);
  }

  // AI/Profile summary (GOLD for reranking - contains skills, specializations, etc.)
  if (candidate.ai_summary) {
    parts.push(`PROFILE: ${candidate.ai_summary}`);
  } else if (candidate.profile_summary) {
    parts.push(`PROFILE: ${candidate.profile_summary}`);
  }

  // Search keywords (indexed skills, specializations)
  if (Array.isArray(candidate.search_keywords) && candidate.search_keywords.length > 0) {
    parts.push(`SKILLS: ${candidate.search_keywords.join(', ')}`);
  }

  // Embedding text excerpt (CV content for detailed matching)
  if (candidate.embedding_text) {
    const excerpt = (candidate.embedding_text as string).slice(0, 500);
    parts.push(`CV: ${excerpt}`);
  }

  return parts.join(' | ');
}

// ============================================================================
// V3: MATCH EXPLANATION - WHY was this candidate picked?
// ============================================================================

/**
 * Generate a human-readable explanation of why a candidate matched the query
 *
 * This helps recruiters understand AI decisions by showing:
 * - Summary: One-liner about match quality
 * - Matched criteria: What aligned (green checkmarks)
 * - Missing criteria: What didn't match (amber warnings)
 * - Confidence level: high/medium/low based on relevance score
 */
function generateMatchExplanation(
  query: string,
  candidate: {
    primary_position?: string | null;
    years_experience?: number | null;
    current_location?: string | null;
    current_country?: string | null;
    nationality?: string | null;
    availability_status?: string | null;
  },
  relevanceScore: number
): MatchExplanation {
  const queryLower = query.toLowerCase();
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];

  // Check position match
  const position = candidate.primary_position?.toLowerCase() || '';
  const positionWords = position.split(/\s+/).filter(w => w.length > 2);
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const positionOverlap = queryWords.filter(qw =>
    positionWords.some(pw => pw.includes(qw) || qw.includes(pw))
  );

  if (positionOverlap.length > 0) {
    matchedCriteria.push(`Position: ${candidate.primary_position}`);
  } else if (position && relevanceScore >= 0.3) {
    // Related role - AI sees connection but not exact match
    matchedCriteria.push(`Related role: ${candidate.primary_position}`);
  }

  // Check experience mentions in query
  const expMatch = query.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+(?:of\s+)?experience)?/i);
  if (expMatch) {
    const requestedYears = parseInt(expMatch[1], 10);
    const candidateYears = candidate.years_experience || 0;
    if (candidateYears >= requestedYears) {
      matchedCriteria.push(`Experience: ${candidateYears} years (requested ${requestedYears}+)`);
    } else if (candidateYears > 0) {
      missingCriteria.push(`Experience: ${candidateYears} years (requested ${requestedYears}+)`);
    }
  } else if (candidate.years_experience) {
    matchedCriteria.push(`Experience: ${candidate.years_experience} years`);
  }

  // Check location mentions
  const locationKeywords = [
    'barcelona', 'monaco', 'france', 'spain', 'uk', 'dubai', 'antibes',
    'palma', 'fort lauderdale', 'miami', 'netherlands', 'italy'
  ];
  const mentionedLocation = locationKeywords.find(loc => queryLower.includes(loc));
  if (mentionedLocation) {
    const candidateLocation = [
      candidate.current_location,
      candidate.current_country
    ].filter(Boolean).join(', ').toLowerCase();

    if (candidateLocation && candidateLocation.includes(mentionedLocation)) {
      matchedCriteria.push(`Location: ${candidate.current_location || candidate.current_country}`);
    } else {
      const displayLoc = candidate.current_location || candidate.current_country || 'not specified';
      missingCriteria.push(`Location: ${displayLoc} (searched: ${mentionedLocation})`);
    }
  }

  // Check availability keywords
  const availabilityKeywords = ['available', 'immediate', 'immediately', 'now', 'urgent'];
  if (availabilityKeywords.some(kw => queryLower.includes(kw))) {
    if (candidate.availability_status === 'available') {
      matchedCriteria.push('Availability: Available now');
    } else if (candidate.availability_status === 'looking') {
      matchedCriteria.push('Availability: Actively looking');
    } else if (candidate.availability_status) {
      missingCriteria.push(`Availability: ${candidate.availability_status}`);
    }
  }

  // Check nationality if mentioned
  if (candidate.nationality && queryLower.includes(candidate.nationality.toLowerCase())) {
    matchedCriteria.push(`Nationality: ${candidate.nationality}`);
  }

  // Generate summary based on score
  let summary: string;
  let confidenceLevel: 'high' | 'medium' | 'low';

  if (relevanceScore >= 0.7) {
    summary = 'Strong match - multiple criteria align';
    confidenceLevel = 'high';
  } else if (relevanceScore >= 0.4) {
    summary = 'Good match - key criteria align';
    confidenceLevel = 'medium';
  } else if (relevanceScore >= MINIMUM_RELEVANCE_THRESHOLD) {
    summary = 'Partial match - some relevance found';
    confidenceLevel = 'low';
  } else {
    summary = 'Weak match - limited relevance';
    confidenceLevel = 'low';
  }

  return {
    summary,
    matchedCriteria,
    missingCriteria: missingCriteria.length > 0 ? missingCriteria : undefined,
    confidenceLevel,
  };
}

// ============================================================================
// V3: POSITION SUGGESTIONS - Help when no results match
// ============================================================================

/**
 * Get position suggestions when search returns no qualified results
 *
 * Helps recruiters discover what roles ARE available in the database
 * when their search didn't match anything.
 */
async function getPositionSuggestions(
  supabase: SupabaseClient,
  query: string
): Promise<string[]> {
  // Get distinct positions from database
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
  const positions = [...new Set(
    data
      .map(c => c.primary_position)
      .filter((p): p is string => !!p && p.length > 0)
  )];

  // Find positions that share words with the query
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const relatedPositions = positions.filter(pos => {
    const posLower = pos.toLowerCase();
    return queryWords.some(word =>
      posLower.includes(word) || word.includes(posLower.split(' ')[0])
    );
  });

  // If we found related positions, return those
  if (relatedPositions.length > 0) {
    return relatedPositions.slice(0, 5);
  }

  // Otherwise return top available positions (most common ones)
  const positionCounts = new Map<string, number>();
  data.forEach(c => {
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

/**
 * CV Search API Endpoint
 *
 * POST /api/search/cv
 *
 * Two-stage AI search architecture:
 *
 * STAGE 1 - Embedding Retrieval (Cast Wide Net):
 * - Uses whole-candidate embeddings (one embedding per candidate)
 * - Low threshold (0.35) to capture potentially relevant candidates
 * - NO hard filters - let AI handle relevance
 *
 * STAGE 2 - Cohere Reranking (Intelligent Sorting):
 * - Cross-encoder model that READS query + candidate text
 * - Understands multi-criteria queries ("chef michelin keto japanese")
 * - Rich context: position, experience, location, availability, skills, CV excerpt
 * - This is what makes the search actually intelligent
 *
 * Works for ANY industry - no hardcoded categories or roles.
 */
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

    const parseResult = cvSearchRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      query,
      filters,
      limit,
      offset,
      use_rerank,
      include_snippets,
      mode,
    } = parseResult.data;

    // Generate query embedding for semantic search
    let queryEmbedding: number[] | null = null;
    if (mode === 'hybrid' || mode === 'semantic') {
      queryEmbedding = await generateEmbedding(query);
    }

    let results: CVSearchResult[] = [];
    let totalCount = 0;

    // Build filter arrays - include ALL verification tiers by default (including unverified)
    const verificationTiers = filters?.verification_tiers || ['unverified', 'basic', 'identity', 'verified', 'premium'];
    const availabilityStatuses = filters?.availability_statuses || ['available', 'looking', 'employed'];

    // Extract experience from query for DISPLAY only (not filtering)
    const extractedExperience = parseExperienceFromQuery(query);
    // REMOVED: extractedCategory - no more hardcoded category detection

    if (mode === 'hybrid' && queryEmbedding) {
      // STAGE 1: Cast wide net with embeddings (Cohere will do the intelligent sorting)
      const { data: hybridResults, error: hybridError } = await supabase.rpc(
        'search_cv_hybrid',
        {
          query_embedding: JSON.stringify(queryEmbedding),
          query_text: query,
          match_threshold: 0.35, // LOW threshold - let Cohere filter for relevance
          match_count: limit + offset + 100, // Get more candidates for Cohere to rank
          p_verification_tiers: verificationTiers,
          p_availability_statuses: availabilityStatuses,
          // REMOVED: p_department, p_min_experience - no hard filters, trust AI
        }
      );

      if (hybridError) {
        console.error('Hybrid search error:', hybridError);
        throw new Error(`Search failed: ${hybridError.message}`);
      }

      // Get candidate details
      const candidateIds = (hybridResults || []).map((r: { candidate_id: string }) => r.candidate_id);

      if (candidateIds.length > 0) {
        // Fetch ALL relevant fields for rich reranking context
        const { data: candidates, error: candidatesError } = await supabase
          .from('candidates')
          .select(`
            id,
            first_name,
            last_name,
            primary_position,
            secondary_positions,
            years_experience,
            nationality,
            current_location,
            current_country,
            verification_tier,
            availability_status,
            available_from,
            avatar_url,
            has_stcw,
            has_eng1,
            has_schengen,
            has_b1b2,
            has_c1d,
            highest_license,
            ai_summary,
            profile_summary,
            search_keywords
          `)
          .in('id', candidateIds)
          .is('deleted_at', null);

        if (candidatesError) {
          console.error('Candidates fetch error:', candidatesError);
          throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
        }

        // Merge results with candidate data
        const candidateMap = new Map(
          (candidates || []).map((c: Record<string, unknown>) => [c.id, c])
        );

        results = (hybridResults || [])
          .map((r: {
            candidate_id: string;
            combined_score: number;
            whole_doc_score: number;
            fulltext_score: number;
            best_snippet: string | null;
          }) => {
            const candidate = candidateMap.get(r.candidate_id) as Record<string, unknown> | undefined;
            if (!candidate) return null;

            return {
              candidate_id: r.candidate_id,
              first_name: candidate.first_name as string,
              last_name: candidate.last_name as string,
              primary_position: candidate.primary_position as string | null,
              years_experience: candidate.years_experience as number | null,
              nationality: candidate.nationality as string | null,
              verification_tier: candidate.verification_tier as string,
              availability_status: candidate.availability_status as string,
              match_score: r.combined_score,
              whole_doc_score: r.whole_doc_score,
              fulltext_score: r.fulltext_score,
              snippet: include_snippets ? (r.best_snippet ?? undefined) : undefined,
              has_stcw: candidate.has_stcw as boolean,
              has_eng1: candidate.has_eng1 as boolean,
              has_schengen: candidate.has_schengen as boolean,
              has_b1b2: candidate.has_b1b2 as boolean,
              avatar_url: candidate.avatar_url as string | null,
              // Store FULL candidate data for rich reranking (will be stripped before response)
              _candidateData: candidate,
            };
          })
          .filter(Boolean) as (CVSearchResult & { _candidateData?: Record<string, unknown> })[];

        // Apply additional filters
        results = applyFilters(results, filters);
        totalCount = results.length;
      }
    } else if (mode === 'keyword') {
      // Full-text only search
      const { data: textResults, error: textError } = await supabase.rpc(
        'search_cv_fulltext',
        {
          query_text: query,
          match_count: limit + offset + 50,
        }
      );

      if (textError) {
        console.error('Fulltext search error:', textError);
        throw new Error(`Search failed: ${textError.message}`);
      }

      const candidateIds = (textResults || []).map((r: { candidate_id: string }) => r.candidate_id);

      if (candidateIds.length > 0) {
        const { data: candidates } = await supabase
          .from('candidates')
          .select(`
            id,
            first_name,
            last_name,
            primary_position,
            years_experience,
            nationality,
            verification_tier,
            availability_status,
            avatar_url,
            has_stcw,
            has_eng1,
            has_schengen,
            has_b1b2
          `)
          .in('id', candidateIds)
          .is('deleted_at', null);

        const candidateMap = new Map(
          (candidates || []).map((c: Record<string, unknown>) => [c.id, c])
        );

        results = (textResults || [])
          .map((r: { candidate_id: string; rank: number; headline: string }) => {
            const candidate = candidateMap.get(r.candidate_id) as Record<string, unknown> | undefined;
            if (!candidate) return null;

            return {
              candidate_id: r.candidate_id,
              first_name: candidate.first_name as string,
              last_name: candidate.last_name as string,
              primary_position: candidate.primary_position as string | null,
              years_experience: candidate.years_experience as number | null,
              nationality: candidate.nationality as string | null,
              verification_tier: candidate.verification_tier as string,
              availability_status: candidate.availability_status as string,
              match_score: r.rank,
              whole_doc_score: 0,
              fulltext_score: r.rank,
              snippet: include_snippets ? r.headline : undefined,
              has_stcw: candidate.has_stcw as boolean,
              has_eng1: candidate.has_eng1 as boolean,
              has_schengen: candidate.has_schengen as boolean,
              has_b1b2: candidate.has_b1b2 as boolean,
              avatar_url: candidate.avatar_url as string | null,
            };
          })
          .filter(Boolean) as CVSearchResult[];

        results = applyFilters(results, filters);
        totalCount = results.length;
      }
    } else if (mode === 'semantic' && queryEmbedding) {
      // STAGE 1: Vector-only search using whole-candidate embeddings
      const { data: vectorResults, error: vectorError } = await supabase.rpc(
        'search_candidates_by_embedding',
        {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.35, // LOW threshold - let Cohere filter
          match_count: limit + offset + 100,
        }
      );

      if (vectorError) {
        console.error('Vector search error:', vectorError);
        throw new Error(`Search failed: ${vectorError.message}`);
      }

      const candidateIds = (vectorResults || []).map((r: { id: string }) => r.id);

      if (candidateIds.length > 0) {
        const { data: candidates } = await supabase
          .from('candidates')
          .select(`
            id,
            first_name,
            last_name,
            primary_position,
            secondary_positions,
            years_experience,
            nationality,
            current_location,
            current_country,
            verification_tier,
            availability_status,
            available_from,
            avatar_url,
            has_stcw,
            has_eng1,
            has_schengen,
            has_b1b2,
            has_c1d,
            highest_license,
            ai_summary,
            profile_summary,
            search_keywords,
            embedding_text
          `)
          .in('id', candidateIds)
          .is('deleted_at', null);

        const candidateMap = new Map(
          (candidates || []).map((c: Record<string, unknown>) => [c.id, c])
        );

        // Build similarity score map from RPC results
        const similarityMap = new Map(
          (vectorResults || []).map((r: { id: string; similarity: number }) => [r.id, r.similarity])
        );

        results = (candidates || [])
          .map((candidate: Record<string, unknown>) => {
            const similarity = similarityMap.get(candidate.id as string) || 0;

            return {
              candidate_id: candidate.id as string,
              first_name: candidate.first_name as string,
              last_name: candidate.last_name as string,
              primary_position: candidate.primary_position as string | null,
              years_experience: candidate.years_experience as number | null,
              nationality: candidate.nationality as string | null,
              verification_tier: candidate.verification_tier as string,
              availability_status: candidate.availability_status as string,
              match_score: similarity,
              whole_doc_score: similarity,
              fulltext_score: 0,
              snippet: include_snippets && candidate.embedding_text
                ? (candidate.embedding_text as string).slice(0, 300)
                : undefined,
              has_stcw: candidate.has_stcw as boolean,
              has_eng1: candidate.has_eng1 as boolean,
              has_schengen: candidate.has_schengen as boolean,
              has_b1b2: candidate.has_b1b2 as boolean,
              avatar_url: candidate.avatar_url as string | null,
              // Store FULL candidate data for rich reranking
              _candidateData: candidate,
            };
          })
          .sort((a, b) => (b.match_score as number) - (a.match_score as number))
          .filter(Boolean) as (CVSearchResult & { _candidateData?: Record<string, unknown> })[];

        results = applyFilters(results, filters);
        totalCount = results.length;
      }
    }

    // STAGE 2: Cohere reranking - THE BRAIN that makes search intelligent
    let rerankUsed = false;
    console.log(`[CV Search] Stage 2: Reranking ${results.length} candidates for query: "${query}"`);
    console.log(`[CV Search] COHERE_API_KEY set: ${!!process.env.COHERE_API_KEY}`);

    if (use_rerank && results.length > 3) {
      try {
        // Build RICH text for Cohere to reason about
        const documentsToRerank: RerankDocument[] = results.slice(0, 100).map((r) => {
          // Use the full candidate data stored in _candidateData for rich reranking
          const candidateData = (r as CVSearchResult & { _candidateData?: Record<string, unknown> })._candidateData;
          return {
            id: r.candidate_id,
            text: candidateData
              ? buildRerankingText(candidateData)
              : `POSITION: ${r.primary_position || 'Unknown'} | EXPERIENCE: ${r.years_experience || 0} years`,
          };
        });

        const reranked = await rerankDocuments(query, documentsToRerank, {
          topN: Math.min(limit + offset, 100), // Rank more candidates
        });

        // Reorder results based on reranking
        const rerankMap = new Map<string, { score: number; rank: number }>(
          reranked.map((r: { id: string; relevanceScore: number }, i: number) => [
            r.id,
            { score: r.relevanceScore, rank: i },
          ])
        );

        results = results
          .map((r) => {
            const rerankData = rerankMap.get(r.candidate_id);
            if (rerankData) {
              return {
                ...r,
                rerank_score: rerankData.score,
                _rerank_rank: rerankData.rank,
              };
            }
            return { ...r, _rerank_rank: 1000 };
          })
          .sort((a, b) =>
            (a as CVSearchResult & { _rerank_rank: number })._rerank_rank -
            (b as CVSearchResult & { _rerank_rank: number })._rerank_rank
          ) as CVSearchResult[];

        rerankUsed = true;
      } catch (rerankError) {
        console.error('Rerank error (falling back to original order):', rerankError);
      }
    }

    // =========================================================================
    // STAGE 3: QUALITY GATE + TRANSPARENCY (V3)
    // =========================================================================
    // Filter out irrelevant results and add match explanations

    const embeddingMatchCount = results.length;
    let qualifiedResults: (CVSearchResult & { _candidateData?: Record<string, unknown> })[] = [];

    if (rerankUsed) {
      // Apply minimum relevance threshold - THE KEY FIX
      qualifiedResults = results.filter((r) => {
        const score = r.rerank_score ?? 0;
        return score >= MINIMUM_RELEVANCE_THRESHOLD;
      });

      console.log(`[CV Search] Stage 3: Quality gate - ${results.length} → ${qualifiedResults.length} (threshold: ${MINIMUM_RELEVANCE_THRESHOLD})`);
    } else {
      // If reranking wasn't used, keep all results (no quality gate without rerank scores)
      qualifiedResults = results;
    }

    // Check if we have NO qualified results - need to return suggestions
    if (qualifiedResults.length === 0 && embeddingMatchCount > 0) {
      console.log(`[CV Search] No results meet threshold - generating suggestions for: "${query}"`);

      const suggestions = await getPositionSuggestions(supabase, query);

      const noResultsResponse: CVSearchResponse = {
        results: [],
        total_count: 0,
        processing_time_ms: Date.now() - startTime,
        search_mode: mode,
        rerank_used: rerankUsed,
        suggestions,
        searchMetadata: {
          query,
          embeddingMatches: embeddingMatchCount,
          afterReranking: rerankUsed ? results.length : 0,
          afterThreshold: 0,
          threshold: MINIMUM_RELEVANCE_THRESHOLD,
          noResultsReason: `No candidates meet the ${Math.round(MINIMUM_RELEVANCE_THRESHOLD * 100)}% relevance threshold for "${query}"`,
        },
      };

      return NextResponse.json(noResultsResponse);
    }

    // Add match explanations to each qualified result
    const resultsWithExplanations = qualifiedResults.map((r) => {
      const candidateData = r._candidateData as Record<string, unknown> | undefined;
      const relevanceScore = r.rerank_score ?? r.match_score ?? 0;

      // Generate explanation using candidate data
      const matchExplanation = generateMatchExplanation(
        query,
        {
          primary_position: candidateData?.primary_position as string | null ?? r.primary_position,
          years_experience: candidateData?.years_experience as number | null ?? r.years_experience,
          current_location: candidateData?.current_location as string | null ?? null,
          current_country: candidateData?.current_country as string | null ?? null,
          nationality: candidateData?.nationality as string | null ?? r.nationality,
          availability_status: candidateData?.availability_status as string | null ?? r.availability_status,
        },
        relevanceScore
      );

      // Remove internal fields
      const { _candidateData, _rerank_rank, ...cleanResult } = r as CVSearchResult & {
        _candidateData?: Record<string, unknown>;
        _rerank_rank?: number;
      };

      return {
        ...cleanResult,
        matchExplanation,
      };
    });

    // Apply pagination
    const paginatedResults = resultsWithExplanations.slice(offset, offset + limit);

    const response: CVSearchResponse & {
      extracted_experience?: number | null;
    } = {
      results: paginatedResults,
      total_count: qualifiedResults.length,
      processing_time_ms: Date.now() - startTime,
      search_mode: mode,
      rerank_used: rerankUsed,
      // Include extracted info for display (experience only - no category filtering)
      extracted_experience: extractedExperience,
      // V3: Add search metadata for transparency
      searchMetadata: {
        query,
        embeddingMatches: embeddingMatchCount,
        afterReranking: rerankUsed ? results.length : embeddingMatchCount,
        afterThreshold: qualifiedResults.length,
        threshold: MINIMUM_RELEVANCE_THRESHOLD,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('CV Search error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Apply additional filters to search results
 * Note: These are EXPLICIT user-selected filters, not AI-inferred filters
 */
function applyFilters(
  results: (CVSearchResult & { _candidateData?: Record<string, unknown> })[],
  filters: {
    positions?: string[];
    min_experience?: number;
    max_experience?: number;
    require_stcw?: boolean;
    require_eng1?: boolean;
    require_schengen?: boolean;
    require_b1b2?: boolean;
    non_smoker_only?: boolean;
    no_tattoos_only?: boolean;
  } | undefined
): (CVSearchResult & { _candidateData?: Record<string, unknown> })[] {
  if (!filters) return results;

  return results.filter((r) => {
    // Position filter
    if (filters.positions?.length) {
      const position = r.primary_position?.toLowerCase() || '';
      const matchesPosition = filters.positions.some((p) =>
        position.includes(p.toLowerCase())
      );
      if (!matchesPosition) return false;
    }

    // Experience filter
    if (filters.min_experience !== undefined && r.years_experience !== null) {
      if (r.years_experience < filters.min_experience) return false;
    }
    if (filters.max_experience !== undefined && r.years_experience !== null) {
      if (r.years_experience > filters.max_experience) return false;
    }

    // Certification filters
    if (filters.require_stcw && !r.has_stcw) return false;
    if (filters.require_eng1 && !r.has_eng1) return false;

    // Visa filters
    if (filters.require_schengen && !r.has_schengen) return false;
    if (filters.require_b1b2 && !r.has_b1b2) return false;

    return true;
  });
}

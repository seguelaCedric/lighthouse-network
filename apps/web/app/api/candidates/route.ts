import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  candidateQuerySchema,
  createCandidateSchema,
} from "@/lib/validations/candidate";
import { generateEmbedding } from "@lighthouse/ai";
import type { Candidate, PaginatedResponse } from "@lighthouse/database";

/**
 * Hybrid Search Implementation
 *
 * Combines vector similarity search with keyword/metadata filtering:
 * 1. If search query provided and semantic=true (default):
 *    - Generate embedding for query
 *    - Use pgvector similarity search to find semantically similar candidates
 *    - Also include keyword matches (hybrid approach)
 *    - Apply metadata filters (position, availability, etc.)
 * 2. If semantic=false or no search query:
 *    - Fall back to traditional ILIKE keyword search
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = candidateQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      search,
      position,
      availability,
      verification,
      minExperience,
      page,
      limit,
      sortBy,
      sortOrder,
      semantic,
      threshold,
    } = parseResult.data;

    // Use hybrid search when there's a search query and semantic is enabled
    const useSemanticSearch = search && semantic && search.trim().length > 2;

    if (useSemanticSearch) {
      // HYBRID SEARCH: Combine vector similarity with keyword matching
      return await performHybridSearch(supabase, {
        search: search!,
        position,
        availability,
        verification,
        minExperience,
        page,
        limit,
        sortBy,
        sortOrder,
        threshold,
      });
    }

    // TRADITIONAL SEARCH: Keyword-based ILIKE matching
    let query = supabase
      .from("candidates")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

    // Apply filters
    if (search) {
      // Split search into words and search for each word across fields
      // This handles multi-word searches like "Matthew Van Duuren"
      const searchTerms = search.trim().split(/\s+/).filter(Boolean);

      if (searchTerms.length === 1) {
        // Single word search - search across all fields
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,primary_position.ilike.%${search}%`
        );
      } else {
        // Multi-word search - each term must match at least one field
        // Build a combined filter that requires all terms to be present somewhere
        for (const term of searchTerms) {
          query = query.or(
            `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,primary_position.ilike.%${term}%`
          );
        }
      }
    }

    if (position) {
      query = query.or(
        `primary_position.ilike.%${position}%,secondary_position.ilike.%${position}%`
      );
    }

    if (availability) {
      query = query.eq("availability_status", availability);
    }

    if (verification !== undefined) {
      query = query.eq("verification_tier", verification);
    }

    if (minExperience !== undefined) {
      query = query.gte("years_experience", minExperience);
    }

    // Apply sorting (ignore 'similarity' when not using semantic search)
    const effectiveSortBy = sortBy === "similarity" ? "created_at" : sortBy;
    query = query.order(effectiveSortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Candidate> = {
      data: data ?? [],
      total,
      page,
      per_page: limit,
      total_pages: totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Hybrid Search: Combines vector similarity with keyword matching
 *
 * Strategy:
 * 1. Generate embedding for the search query
 * 2. Call match_candidates_by_embedding RPC for vector similarity
 * 3. Also get keyword matches for candidates without embeddings
 * 4. Merge and deduplicate results, prioritizing by similarity score
 * 5. Apply additional metadata filters
 */
async function performHybridSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    search: string;
    position?: string;
    availability?: string;
    verification?: number;
    minExperience?: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    threshold: number;
  }
) {
  const {
    search,
    position,
    availability,
    verification,
    minExperience,
    page,
    limit,
    sortBy,
    sortOrder,
    threshold,
  } = params;

  try {
    // Generate embedding for the search query
    console.log(`[Hybrid Search] Generating embedding for: "${search}"`);
    const queryEmbedding = await generateEmbedding(search);

    // Build filters for vector search
    // Note: The RPC function has limited filtering, so we'll apply more filters in post-processing
    const verificationTiers = verification !== undefined
      ? [verification === 0 ? 'unverified' : verification === 1 ? 'basic' : verification === 2 ? 'verified' : 'premium']
      : ['unverified', 'basic', 'verified', 'premium'];

    const availabilityStatuses = availability
      ? [availability]
      : ['available', 'notice_period', 'not_looking', 'on_contract', 'unknown'];

    // Vector similarity search (candidates WITH embeddings)
    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      'match_candidates_by_embedding',
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: 100, // Get more than limit for post-filtering
        p_verification_tiers: verificationTiers,
        p_availability_statuses: availabilityStatuses,
        p_exclude_ids: [],
      }
    );

    if (vectorError) {
      console.error("[Hybrid Search] Vector search error:", vectorError);
      // Fall back to keyword search on error
    }

    // Keyword search for candidates WITHOUT embeddings (fallback)
    // This ensures we don't miss candidates who haven't been vectorized yet
    let keywordQuery = supabase
      .from("candidates")
      .select("*")
      .is("deleted_at", null)
      .is("embedding", null); // Only candidates without embeddings

    const searchTerms = search.trim().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 1) {
      keywordQuery = keywordQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,primary_position.ilike.%${search}%,profile_summary.ilike.%${search}%`
      );
    } else {
      for (const term of searchTerms) {
        keywordQuery = keywordQuery.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,primary_position.ilike.%${term}%,profile_summary.ilike.%${term}%`
        );
      }
    }

    // Apply filters to keyword search
    if (availability) {
      keywordQuery = keywordQuery.eq("availability_status", availability);
    }
    if (verification !== undefined) {
      keywordQuery = keywordQuery.eq("verification_tier", verification);
    }
    if (minExperience !== undefined) {
      keywordQuery = keywordQuery.gte("years_experience", minExperience);
    }

    keywordQuery = keywordQuery.limit(50);

    const { data: keywordResults, error: keywordError } = await keywordQuery;

    if (keywordError) {
      console.error("[Hybrid Search] Keyword search error:", keywordError);
    }

    // Merge results
    const resultsMap = new Map<string, Candidate & { similarity?: number }>();

    // Add vector results first (they have similarity scores)
    if (vectorResults) {
      for (const result of vectorResults) {
        resultsMap.set(result.id, {
          ...result,
          similarity: result.similarity,
        } as Candidate & { similarity: number });
      }
    }

    // Add keyword results for candidates not already in results
    // Give them a lower similarity score so they appear after vector matches
    if (keywordResults) {
      for (const result of keywordResults) {
        if (!resultsMap.has(result.id)) {
          resultsMap.set(result.id, {
            ...result,
            similarity: 0.1, // Lower score for keyword-only matches
          });
        }
      }
    }

    // Convert to array and apply additional filters
    let mergedResults = Array.from(resultsMap.values());

    // Post-filter by position if specified
    if (position) {
      const posLower = position.toLowerCase();
      mergedResults = mergedResults.filter(
        (c) =>
          c.primary_position?.toLowerCase().includes(posLower) ||
          c.secondary_position?.toLowerCase().includes(posLower)
      );
    }

    // Post-filter by minExperience for vector results (keyword results already filtered)
    if (minExperience !== undefined) {
      mergedResults = mergedResults.filter(
        (c) => (c.years_experience ?? 0) >= minExperience
      );
    }

    // Sort by similarity (descending) by default, or by specified sort field
    if (sortBy === "similarity" || sortBy === "created_at") {
      // For similarity or default sort, order by similarity score
      mergedResults.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    } else {
      // Apply custom sort
      mergedResults.sort((a, b) => {
        const aVal = (a as unknown as Record<string, string | number | null>)[sortBy];
        const bVal = (b as unknown as Record<string, string | number | null>)[sortBy];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    // Apply pagination
    const total = mergedResults.length;
    const totalPages = Math.ceil(total / limit);
    const from = (page - 1) * limit;
    const paginatedResults = mergedResults.slice(from, from + limit);

    console.log(
      `[Hybrid Search] Found ${vectorResults?.length ?? 0} vector matches, ${keywordResults?.length ?? 0} keyword matches, ${total} total after merge`
    );

    const response: PaginatedResponse<Candidate> = {
      data: paginatedResults,
      total,
      page,
      per_page: limit,
      total_pages: totalPages,
    };

    return NextResponse.json({
      ...response,
      searchType: "hybrid",
      vectorMatches: vectorResults?.length ?? 0,
      keywordMatches: keywordResults?.length ?? 0,
    });
  } catch (error) {
    console.error("[Hybrid Search] Error:", error);
    // Fall back to traditional search on any error
    return NextResponse.json(
      { error: "Search failed, please try again" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate input
    const parseResult = createCandidateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const candidateData = parseResult.data;

    // Insert candidate
    const { data, error } = await supabase
      .from("candidates")
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A candidate with this email already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create candidate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// V4 AGENTIC SEARCH - Type Definitions
// ============================================================================
// Types for the V4 AI-powered search pipeline:
// Query Parser → SQL Hard Filters → Vector Search → Agentic Judge
// ============================================================================

// ----------------------------------------------------------------------------
// QUERY PARSER TYPES
// ----------------------------------------------------------------------------

/**
 * Output from the LLM query parser (gpt-4o-mini).
 * Extracts structured requirements from natural language search queries.
 */
export interface ParsedQuery {
  /** Original user query */
  originalQuery: string;

  /** Extracted primary position (e.g., "Chief Stewardess") */
  position?: string;

  /**
   * Hard filters - deterministic requirements that MUST be met.
   * Applied as SQL WHERE clauses BEFORE vector search.
   */
  hardFilters: {
    require_stcw?: boolean;
    require_eng1?: boolean;
    require_schengen?: boolean;
    require_b1b2?: boolean;
    min_experience?: number;
    max_experience?: number;
    /** Position synonyms to match against (e.g., ["Stewardess", "Chief Stewardess"]) */
    positions?: string[];
  };

  /**
   * Soft preferences - nice-to-have but not required.
   * Used for scoring/ranking but won't exclude candidates.
   */
  softPreferences: {
    region?: string;
    yacht_type?: string;
    contract_type?: string;
    salary_range?: { min?: number; max?: number };
  };

  /**
   * Intent classification for the search.
   * Helps optimize the search strategy.
   */
  searchIntent: 'role-based' | 'skill-based' | 'availability-based' | 'general';
}

// ----------------------------------------------------------------------------
// AGENTIC JUDGE TYPES
// ----------------------------------------------------------------------------

/**
 * Verdict from the agentic judge.
 * Maps to fit score ranges for consistent interpretation.
 */
export type Verdict =
  | 'strong_match' // 80-100
  | 'good_match' // 60-79
  | 'partial_match' // 40-59
  | 'weak_match' // 20-39
  | 'no_match'; // 0-19

/**
 * Output from the LLM agentic judge (Claude Haiku).
 * Provides REAL reasoning about why a candidate matches or doesn't match.
 */
export interface AgenticExplanation {
  /** Fit score from 0-100 */
  fitScore: number;

  /** Categorical verdict based on fit score */
  verdict: Verdict;

  /** Human-readable reasoning */
  reasoning: {
    /** What makes this candidate a good fit (2-4 points) */
    strengths: string[];
    /** Potential concerns or gaps (0-3 points) */
    concerns: string[];
    /** One-sentence overall assessment */
    summary: string;
  };
}

/**
 * Candidate profile input for the agentic judge.
 * Enhanced with CV extraction data for richer evaluation.
 */
export interface CandidateProfile {
  candidate_id: string;
  first_name: string;
  last_name: string;
  primary_position: string | null;
  years_experience: number | null;
  certifications: string[];
  skills: string[];
  bio?: string;
  current_location?: string;
  nationality?: string;

  // Enhanced fields from CV extraction
  /** All positions held (normalized) */
  positions_held?: string[];
  /** Languages with proficiency levels */
  languages?: Array<{ language: string; proficiency: string }>;
  /** Yacht experience summary */
  yacht_experience?: Array<{
    yacht_name?: string | null;
    yacht_size_meters?: number | null;
    position: string;
    duration_months?: number | null;
  }>;
}

// ----------------------------------------------------------------------------
// V4 SEARCH RESULT TYPES
// ----------------------------------------------------------------------------

/**
 * Individual search result with agentic explanation.
 */
export interface V4SearchResult {
  candidate_id: string;
  first_name: string;
  last_name: string;
  primary_position: string | null;
  years_experience: number | null;
  verification_tier: string;
  availability_status: string;
  nationality?: string | null;
  current_location?: string | null;
  avatar_url?: string | null;

  /** V4: Agentic explanation (replaces V3 heuristic matchExplanation) */
  agenticExplanation: AgenticExplanation;

  /** Vector similarity score for debugging */
  vectorScore: number;

  /** Final score (from agentic judge fitScore) */
  finalScore: number;
}

/**
 * Pipeline statistics for transparency and debugging.
 */
export interface PipelineStats {
  /** Candidates remaining after SQL hard filters */
  afterHardFilters: number;
  /** Candidates sent to agentic judge */
  afterVectorSearch: number;
  /** Final results after agentic evaluation */
  afterAgenticJudge: number;
}

/**
 * V4 Search API response.
 */
export interface V4SearchResponse {
  results: V4SearchResult[];
  total_count: number;
  processing_time_ms: number;

  /** Parsed query for transparency */
  parsedQuery: ParsedQuery;

  /** Pipeline statistics */
  pipelineStats: PipelineStats;

  /** Suggestions when no results found */
  suggestions?: string[];

  /** Reason when no results found */
  noResultsReason?: string;
}

// ----------------------------------------------------------------------------
// V4 SEARCH REQUEST
// ----------------------------------------------------------------------------

/**
 * V4 Search API request body.
 */
export interface V4SearchRequest {
  query: string;
  limit?: number;
  /** Use Cohere reranking as fallback safety net */
  useFallback?: boolean;
}

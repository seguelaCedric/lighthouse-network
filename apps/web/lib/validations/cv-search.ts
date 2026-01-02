import { z } from 'zod';

// CV Search request schema
export const cvSearchRequestSchema = z.object({
  // Search query (required)
  query: z.string().min(2, 'Search query must be at least 2 characters'),

  // Filters
  filters: z
    .object({
      // Position filters
      positions: z.array(z.string()).optional(),
      min_experience: z.number().int().min(0).max(50).optional(),
      max_experience: z.number().int().min(0).max(50).optional(),

      // Certification filters
      require_stcw: z.boolean().optional(),
      require_eng1: z.boolean().optional(),
      licenses: z.array(z.string()).optional(),

      // Visa filters
      require_schengen: z.boolean().optional(),
      require_b1b2: z.boolean().optional(),

      // Availability
      availability_statuses: z
        .array(z.enum(['available', 'looking', 'employed', 'unavailable']))
        .optional(),

      // Verification
      verification_tiers: z
        .array(z.enum(['basic', 'identity', 'verified', 'premium']))
        .optional(),

      // Preferences
      yacht_types: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      contract_types: z.array(z.string()).optional(),

      // Personal
      non_smoker_only: z.boolean().optional(),
      no_tattoos_only: z.boolean().optional(),
    })
    .optional(),

  // Pagination
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),

  // Search options
  use_rerank: z.boolean().default(false), // Opt-in for Cohere reranking (adds latency + cost)
  include_snippets: z.boolean().default(true),

  // Search mode
  mode: z.enum(['hybrid', 'semantic', 'keyword']).default('hybrid'),
});

export type CVSearchRequest = z.infer<typeof cvSearchRequestSchema>;

// Match explanation types for transparency
export interface MatchExplanation {
  summary: string;
  matchedCriteria: string[];
  missingCriteria?: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

// CV Search response types
export interface CVSearchResult {
  candidate_id: string;
  first_name: string;
  last_name: string;
  primary_position: string | null;
  years_experience: number | null;
  nationality: string | null;
  verification_tier: string;
  availability_status: string;
  avatar_url?: string | null;

  // Scores
  match_score: number;
  whole_doc_score: number;
  chunk_score: number;
  fulltext_score: number;
  rerank_score?: number;

  // Match explanation (V3: transparency feature)
  matchExplanation?: MatchExplanation;

  // Matching context
  snippet?: string;
  matched_sections?: string[];

  // Quick reference
  has_stcw: boolean;
  has_eng1: boolean;
  has_schengen: boolean;
  has_b1b2: boolean;
}

// Search metadata for debugging and transparency
export interface SearchMetadata {
  query: string;
  embeddingMatches: number;
  afterReranking: number;
  afterThreshold: number;
  threshold: number;
  noResultsReason?: string;
}

export interface CVSearchResponse {
  results: CVSearchResult[];
  total_count: number;
  processing_time_ms: number;
  search_mode: 'hybrid' | 'semantic' | 'keyword';
  rerank_used: boolean;

  // V3: Transparency features
  suggestions?: string[];
  searchMetadata?: SearchMetadata;
}

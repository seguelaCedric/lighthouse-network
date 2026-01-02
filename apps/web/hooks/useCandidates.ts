import { useQuery } from "@tanstack/react-query";
import type { Candidate, PaginatedResponse } from "@lighthouse/database";

export interface CandidateSearchParams {
  search?: string;
  position?: string;
  availability?: string;
  verification?: number;
  minExperience?: number;
  maxExperience?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // AI/Semantic search options
  semantic?: boolean; // Enable AI-powered semantic search (default: true)
  threshold?: number; // Similarity threshold for vector search (0-1, default: 0.3)
}

// Extended response type that includes hybrid search metadata
export interface CandidateSearchResponse extends PaginatedResponse<Candidate> {
  searchType?: "hybrid" | "keyword";
  vectorMatches?: number;
  keywordMatches?: number;
}

async function fetchCandidates(
  params: CandidateSearchParams
): Promise<CandidateSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.position) searchParams.set("position", params.position);
  if (params.availability) searchParams.set("availability", params.availability);
  if (params.verification !== undefined)
    searchParams.set("verification", String(params.verification));
  if (params.minExperience !== undefined)
    searchParams.set("minExperience", String(params.minExperience));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  // AI search options - semantic search is enabled by default on the API
  if (params.semantic !== undefined)
    searchParams.set("semantic", String(params.semantic));
  if (params.threshold !== undefined)
    searchParams.set("threshold", String(params.threshold));

  const response = await fetch(`/api/candidates?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch candidates");
  }

  return response.json();
}

export function useCandidates(params: CandidateSearchParams) {
  return useQuery({
    queryKey: ["candidates", params],
    queryFn: () => fetchCandidates(params),
    placeholderData: (previousData) => previousData,
  });
}

import { useQuery } from "@tanstack/react-query";
import type { Candidate, PaginatedResponse } from "../../../../packages/database/types";

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
}

async function fetchCandidates(
  params: CandidateSearchParams
): Promise<PaginatedResponse<Candidate>> {
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

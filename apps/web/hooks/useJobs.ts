import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Job, PaginatedResponse } from "@lighthouse/database";

export interface JobSearchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

async function fetchJobs(params: JobSearchParams): Promise<PaginatedResponse<Job>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`/api/jobs?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch jobs");
  }

  return response.json();
}

export function useJobs(params: JobSearchParams = {}) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => fetchJobs(params),
    placeholderData: (previousData) => previousData,
  });
}

// Add candidate to job (create application)
async function addCandidateToJob(data: {
  jobId: string;
  candidateId: string;
}): Promise<void> {
  const response = await fetch(`/api/jobs/${data.jobId}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id: data.candidateId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add candidate to job");
  }
}

export function useAddCandidateToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCandidateToJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

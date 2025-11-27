import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PublicJobsResponse,
  PublicJobDetailResponse,
  ApplicationSuccessResponse,
} from "@/lib/validations/public-job";

export interface PublicJobSearchParams {
  search?: string;
  position?: string;
  region?: string;
  contract_type?: string;
  vessel_type?: string;
  min_salary?: number;
  max_salary?: number;
  sort_by?: "newest" | "oldest" | "salary_high" | "salary_low";
  page?: number;
  limit?: number;
}

async function fetchPublicJobs(
  params: PublicJobSearchParams
): Promise<PublicJobsResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.position) searchParams.set("position", params.position);
  if (params.region) searchParams.set("region", params.region);
  if (params.contract_type) searchParams.set("contract_type", params.contract_type);
  if (params.vessel_type) searchParams.set("vessel_type", params.vessel_type);
  if (params.min_salary) searchParams.set("min_salary", String(params.min_salary));
  if (params.max_salary) searchParams.set("max_salary", String(params.max_salary));
  if (params.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`/api/public/jobs?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch jobs");
  }

  return response.json();
}

export function usePublicJobs(params: PublicJobSearchParams = {}) {
  return useQuery({
    queryKey: ["publicJobs", params],
    queryFn: () => fetchPublicJobs(params),
    placeholderData: (previousData) => previousData,
  });
}

async function fetchPublicJobDetail(
  id: string
): Promise<PublicJobDetailResponse> {
  const response = await fetch(`/api/public/jobs/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch job details");
  }

  return response.json();
}

export function usePublicJobDetail(id: string | null) {
  return useQuery({
    queryKey: ["publicJob", id],
    queryFn: () => fetchPublicJobDetail(id!),
    enabled: !!id,
  });
}

async function applyToJob(data: {
  jobId: string;
  coverLetter?: string;
}): Promise<ApplicationSuccessResponse> {
  const response = await fetch(`/api/public/jobs/${data.jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cover_letter: data.coverLetter }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit application");
  }

  return response.json();
}

export function useApplyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyToJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicJobs"] });
      queryClient.invalidateQueries({ queryKey: ["crewApplications"] });
    },
  });
}

// Hook for candidate's own applications
export interface CrewApplicationsParams {
  status?: "all" | "active" | "rejected" | "placed";
  page?: number;
  limit?: number;
}

export interface CrewApplication {
  id: string;
  stage: string;
  source: string;
  match_score: number | null;
  applied_at: string;
  created_at: string;
  interview_scheduled_at: string | null;
  placed_at: string | null;
  rejection_reason: string | null;
  withdrawn_reason: string | null;
  job: {
    id: string;
    title: string;
    vessel_type: string | null;
    vessel_size_meters: number | null;
    primary_region: string | null;
    contract_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    start_date: string | null;
    status: string;
    is_public: boolean;
    created_by_agency: {
      id: string;
      name: string;
    } | null;
  };
}

export interface CrewApplicationsResponse {
  data: CrewApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    all: number;
    active: number;
    rejected: number;
    placed: number;
  };
}

async function fetchCrewApplications(
  params: CrewApplicationsParams
): Promise<CrewApplicationsResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`/api/crew/applications?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch applications");
  }

  return response.json();
}

export function useCrewApplications(params: CrewApplicationsParams = {}) {
  return useQuery({
    queryKey: ["crewApplications", params],
    queryFn: () => fetchCrewApplications(params),
    placeholderData: (previousData) => previousData,
  });
}

async function withdrawApplication(data: {
  applicationId: string;
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/crew/applications/${data.applicationId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: data.reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to withdraw application");
  }

  return response.json();
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crewApplications"] });
    },
  });
}

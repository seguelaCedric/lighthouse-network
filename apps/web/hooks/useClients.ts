import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Client,
  ClientWithJobs,
  CreateClientInput,
  UpdateClientInput,
  ClientStatus,
  ClientType,
} from "@/lib/validations/client";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ClientSearchParams {
  search?: string;
  type?: ClientType;
  status?: ClientStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchClients(
  params: ClientSearchParams
): Promise<PaginatedResponse<Client>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const response = await fetch(`/api/clients?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch clients");
  }

  return response.json();
}

async function fetchClient(id: string): Promise<ClientWithJobs> {
  const response = await fetch(`/api/clients/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch client");
  }

  const result = await response.json();
  return result.data;
}

async function createClient(data: CreateClientInput): Promise<Client> {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create client");
  }

  const result = await response.json();
  return result.data;
}

async function updateClient({
  id,
  data,
}: {
  id: string;
  data: UpdateClientInput;
}): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update client");
  }

  const result = await response.json();
  return result.data;
}

async function archiveClient(id: string): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive client");
  }
}

// Hooks

export function useClients(params: ClientSearchParams) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => fetchClients(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", data.id] });
    },
  });
}

export function useArchiveClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

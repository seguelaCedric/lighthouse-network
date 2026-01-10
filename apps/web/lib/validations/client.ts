import { z } from "zod";

// Client types
export const clientTypeSchema = z.enum([
  "yacht",
  "management_co",
  "private_owner",
  "charter_co",
]);

export type ClientType = z.infer<typeof clientTypeSchema>;

// Client status
export const clientStatusSchema = z.enum(["active", "inactive", "prospect"]);

export type ClientStatus = z.infer<typeof clientStatusSchema>;

// Vessel types
export const vesselTypeSchema = z.enum([
  "motor",
  "sailing",
  "catamaran",
  "explorer",
  "expedition",
  "classic",
]);

export type VesselType = z.infer<typeof vesselTypeSchema>;

// Source types
export const sourceTypeSchema = z.enum([
  "referral",
  "website",
  "event",
  "cold_outreach",
  "social_media",
  "other",
]);

export type SourceType = z.infer<typeof sourceTypeSchema>;

// Query params for GET /api/clients
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  type: clientTypeSchema.optional(),
  status: clientStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "name",
      "total_jobs",
      "total_revenue",
      "total_placements",
      "last_placement_at",
    ])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ClientQuery = z.infer<typeof clientQuerySchema>;

// Create client schema
export const createClientSchema = z.object({
  // Basic info
  name: z.string().min(1, "Client name is required"),
  type: clientTypeSchema.default("yacht"),

  // Contact
  primary_contact_name: z.string().optional().nullable(),
  primary_contact_email: z.string().email("Invalid email").optional().nullable(),
  primary_contact_phone: z.string().optional().nullable(),
  primary_contact_role: z.string().optional().nullable(),

  // Vessel info (for yachts)
  vessel_name: z.string().optional().nullable(),
  vessel_type: vesselTypeSchema.optional().nullable(),
  vessel_size: z.number().int().min(1).max(200).optional().nullable(),
  vessel_flag: z.string().optional().nullable(),
  vessel_build_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 5)
    .optional()
    .nullable(),

  // Relationship
  status: clientStatusSchema.default("active"),
  source: sourceTypeSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

// Update client schema (all fields optional)
export const updateClientSchema = createClientSchema.partial().extend({
  // Portal access fields (only for update)
  portal_enabled: z.boolean().optional(),
  portal_email: z.string().email("Invalid email").optional().nullable(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// Client type for frontend
export interface Client {
  id: string;
  agency_id: string;
  name: string;
  type: ClientType;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  primary_contact_role: string | null;
  vessel_name: string | null;
  vessel_type: VesselType | null;
  vessel_size: number | null;
  vessel_flag: string | null;
  vessel_build_year: number | null;
  status: ClientStatus;
  source: SourceType | null;
  notes: string | null;
  total_jobs: number;
  total_placements: number;
  total_revenue: number;
  last_placement_at: string | null;
  last_job_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Portal access
  portal_enabled: boolean;
  portal_email: string | null;
  portal_last_login: string | null;
}

// Contact associated with a client
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  is_active: boolean;
  vincere_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Client with related data
export interface ClientWithJobs extends Client {
  jobs?: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    submissions_count: number;
  }>;
  placements?: Array<{
    id: string;
    start_date: string | null;
    total_fee: number | null;
    status: string;
    candidate?: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
    job?: {
      id: string;
      title: string;
    } | null;
  }>;
  contacts?: ClientContact[];
}

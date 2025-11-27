import { z } from "zod";
import { positionCategorySchema, contractTypeSchema } from "./candidate";

// Job status enum
export const jobStatusSchema = z.enum([
  "draft",
  "open",
  "shortlist",
  "interviewing",
  "offer",
  "filled",
  "closed",
]);

// Job visibility enum
export const jobVisibilitySchema = z.enum(["private", "network", "public"]);

// Application stage enum
export const applicationStageSchema = z.enum([
  "applied",
  "screening",
  "shortlisted",
  "submitted",
  "interview",
  "offer",
  "placed",
  "rejected",
]);

// Job requirements schema (nested object)
export const jobRequirementsSchema = z.object({
  experience_years_min: z.number().int().min(0).optional(),
  experience_years_max: z.number().int().min(0).optional(),
  certifications_required: z.array(z.string()).optional(),
  certifications_preferred: z.array(z.string()).optional(),
  visas_required: z.array(z.string()).optional(),
  languages_required: z.array(z.string()).optional(),
  languages_preferred: z.array(z.string()).optional(),
  non_smoker: z.boolean().optional(),
  no_visible_tattoos: z.boolean().optional(),
  nationality_preferences: z.array(z.string()).optional(),
  couple_acceptable: z.boolean().optional(),
  gender_preference: z.string().optional(),
});

export type JobRequirements = z.infer<typeof jobRequirementsSchema>;

// Query params for GET /api/jobs
export const jobQuerySchema = z.object({
  search: z.string().optional(),
  status: jobStatusSchema.optional(),
  agency_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  position_category: positionCategorySchema.optional(),
  contract_type: contractTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "title",
      "start_date",
      "salary_min",
      "status",
    ])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type JobQuery = z.infer<typeof jobQuerySchema>;

// Create job schema
export const createJobSchema = z.object({
  // Core fields
  title: z.string().min(1, "Job title is required"),
  position_category: positionCategorySchema.optional().nullable(),

  // Client/Agency
  client_id: z.string().uuid().optional().nullable(),

  // External tracking
  external_id: z.string().optional().nullable(),
  external_source: z.string().optional().nullable(),

  // Vessel
  vessel_name: z.string().optional().nullable(),
  vessel_type: z.string().optional().nullable(),
  vessel_size_meters: z.number().int().min(0).optional().nullable(),

  // Contract
  contract_type: contractTypeSchema.optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  rotation_schedule: z.string().optional().nullable(),

  // Location
  primary_region: z.string().optional().nullable(),
  itinerary: z.string().optional().nullable(),

  // Compensation
  salary_min: z.number().int().min(0).optional().nullable(),
  salary_max: z.number().int().min(0).optional().nullable(),
  salary_currency: z.string().default("EUR"),
  salary_period: z.string().default("monthly"),
  benefits: z.string().optional().nullable(),

  // Requirements
  requirements: jobRequirementsSchema.default({}),
  requirements_text: z.string().optional().nullable(),

  // Status
  status: jobStatusSchema.default("draft"),
  visibility: jobVisibilitySchema.default("private"),

  // Fees
  fee_type: z.string().default("percentage"),
  fee_amount: z.number().min(0).optional().nullable(),
  fee_split_policy: z.string().optional().nullable(),

  // Urgency
  is_urgent: z.boolean().default(false),
  closes_at: z.string().datetime().optional().nullable(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// Update job schema (all fields optional)
export const updateJobSchema = createJobSchema.partial();

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// Application source enum
export const applicationSourceSchema = z.enum([
  "manual",
  "ai_match",
  "candidate_apply",
  "vincere_sync",
  "job_board",
]);

// Application query schema
export const applicationQuerySchema = z.object({
  stage: applicationStageSchema.optional(),
  source: applicationSourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["created_at", "stage_changed_at", "match_score", "stage", "applied_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ApplicationQuery = z.infer<typeof applicationQuerySchema>;

// Application match breakdown schema
export const matchBreakdownSchema = z.object({
  skills_match: z.number().optional(),
  experience_match: z.number().optional(),
  certification_match: z.number().optional(),
  availability_match: z.number().optional(),
  location_match: z.number().optional(),
  salary_match: z.number().optional(),
});

// Create application schema
export const createApplicationSchema = z.object({
  candidate_id: z.string().uuid("Invalid candidate ID"),
  stage: applicationStageSchema.default("applied"),
  source: z
    .enum(["manual", "ai_match", "candidate_apply", "vincere_sync"])
    .default("manual"),
  match_score: z.number().min(0).max(100).optional().nullable(),
  match_breakdown: matchBreakdownSchema.optional(),
  ai_assessment: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

// Update application schema
export const updateApplicationSchema = z.object({
  stage: applicationStageSchema.optional(),
  internal_notes: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

// Match request schema
export const matchRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  include_ai_assessment: z.boolean().default(false),
  verification_tiers: z.array(z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ])).optional(),
  exclude_candidate_ids: z.array(z.string().uuid()).optional(),
});

export type MatchRequest = z.infer<typeof matchRequestSchema>;

import { z } from "zod";

// Position categories for public jobs
export const positionCategorySchema = z.enum([
  "deck",
  "interior",
  "engineering",
  "galley",
  "captain",
  "medical",
  "childcare",
  "security",
  "management",
  "other",
]);

// Contract types
export const contractTypeSchema = z.enum([
  "permanent",
  "rotational",
  "seasonal",
  "temporary",
  "freelance",
]);

// Sort options for public job listings
export const publicJobSortSchema = z.enum([
  "newest",
  "oldest",
  "salary_high",
  "salary_low",
]);

// Query params for GET /api/public/jobs
export const publicJobQuerySchema = z.object({
  // Search
  search: z.string().optional(),

  // Filters
  position: positionCategorySchema.optional(),
  region: z.string().optional(),
  contract_type: contractTypeSchema.optional(),
  vessel_type: z.string().optional(),
  min_salary: z.coerce.number().int().min(0).optional(),
  max_salary: z.coerce.number().int().min(0).optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),

  // Sorting
  sort_by: publicJobSortSchema.default("newest"),
});

export type PublicJobQuery = z.infer<typeof publicJobQuerySchema>;

// Schema for authenticated candidate applying to a job
export const applyToJobSchema = z.object({
  cover_letter: z
    .string()
    .max(5000, "Cover letter must be less than 5000 characters")
    .optional(),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

// Schema for guest application (form data from public board)
export const guestApplicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(50),
  currentLocation: z.string().max(200).optional(),
  primaryPosition: z.string().min(1, "Position is required").max(100),
  yearsExperience: z.coerce.number().int().min(0).max(50).optional(),
  availableFrom: z.string().optional(), // ISO date string
  coverLetter: z
    .string()
    .max(5000, "Cover letter must be less than 5000 characters")
    .optional(),
});

export type GuestApplicationInput = z.infer<typeof guestApplicationSchema>;

// Response types
export interface PublicJobsResponse {
  data: PublicJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    positions: string[];
    regions: string[];
    vesselTypes: string[];
    contractTypes: string[];
  };
}

export interface PublicJobDetailResponse {
  data: PublicJob;
  similarJobs: PublicJobSummary[];
}

export interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  position_category: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  rotation_schedule: string | null;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  benefits: string | null;
  requirements: Record<string, unknown>;
  is_urgent: boolean;
  apply_deadline: string | null;
  applications_count: number;
  views_count: number;
  created_at: string;
  published_at: string | null;
  agency_name: string | null;
}

export interface PublicJobSummary {
  id: string;
  title: string;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  vessel_type: string | null;
  contract_type: string | null;
  created_at: string;
}

export interface ApplicationSuccessResponse {
  success: true;
  message: string;
  applicationId: string;
}

export interface FilterOptionsResponse {
  positions: string[];
  regions: string[];
}

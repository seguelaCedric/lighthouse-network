import { z } from "zod";

// Enums matching database types
export const availabilityStatusSchema = z.enum([
  "available",
  "notice_period",
  "not_looking",
  "on_contract",
  "unknown",
]);

export const verificationTierSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

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

export const contractTypeSchema = z.enum([
  "permanent",
  "rotational",
  "seasonal",
  "temporary",
  "freelance",
]);

// Query params for GET /api/candidates
export const candidateQuerySchema = z.object({
  search: z.string().optional(),
  position: z.string().optional(),
  availability: availabilityStatusSchema.optional(),
  verification: verificationTierSchema.optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "years_experience",
      "verification_tier",
    ])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CandidateQuery = z.infer<typeof candidateQuerySchema>;

// Create candidate schema
export const createCandidateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),

  // Demographics
  date_of_birth: z.string().datetime().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  second_nationality: z.string().optional().nullable(),

  // Location
  current_location: z.string().optional().nullable(),
  current_country: z.string().optional().nullable(),

  // Professional
  primary_position: z.string().optional().nullable(),
  secondary_position: z.string().optional().nullable(),
  secondary_positions: z.array(z.string()).optional().nullable(),
  position_category: positionCategorySchema.optional().nullable(),
  years_experience: z.number().int().min(0).optional().nullable(),

  // Yacht experience
  yacht_size_min: z.number().int().min(0).optional().nullable(),
  yacht_size_max: z.number().int().min(0).optional().nullable(),
  yacht_types: z.array(z.string()).optional().nullable(),

  // Yacht preferences
  preferred_yacht_types: z.array(z.string()).optional().nullable(),
  preferred_yacht_size_min: z.number().int().min(0).optional().nullable(),
  preferred_yacht_size_max: z.number().int().min(0).optional().nullable(),
  preferred_contract_types: z.array(contractTypeSchema).optional().nullable(),
  preferred_regions: z.array(z.string()).optional().nullable(),
  contract_preferences: z.array(z.string()).optional().nullable(),

  // Availability
  availability_status: availabilityStatusSchema.default("unknown"),
  available_from: z.string().datetime().optional().nullable(),
  current_contract_end: z.string().datetime().optional().nullable(),

  // Compensation
  desired_salary_min: z.number().int().min(0).optional().nullable(),
  desired_salary_max: z.number().int().min(0).optional().nullable(),
  salary_min: z.number().int().min(0).optional().nullable(),
  salary_max: z.number().int().min(0).optional().nullable(),
  salary_currency: z.string().default("EUR"),

  // Visas
  has_schengen: z.boolean().optional().nullable(),
  has_b1b2: z.boolean().optional().nullable(),
  has_c1d: z.boolean().optional().nullable(),
  other_visas: z.array(z.string()).optional().nullable(),
  passport_expiry: z.string().datetime().optional().nullable(),

  // Certifications (denormalized)
  has_stcw: z.boolean().default(false),
  stcw_expiry: z.string().datetime().optional().nullable(),
  has_eng1: z.boolean().default(false),
  eng1_expiry: z.string().datetime().optional().nullable(),
  highest_license: z.string().optional().nullable(),

  // Personal
  is_smoker: z.boolean().optional().nullable(),
  has_visible_tattoos: z.boolean().optional().nullable(),
  tattoo_description: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),

  // Couple
  is_couple: z.boolean().default(false),
  partner_name: z.string().optional().nullable(),
  partner_position: z.string().optional().nullable(),
  partner_candidate_id: z.string().uuid().optional().nullable(),
  couple_position: z.string().optional().nullable(),

  // Verification
  verification_tier: verificationTierSchema.default(0),

  // AI/Search
  profile_summary: z.string().optional().nullable(),
  ai_summary: z.string().optional().nullable(),
  search_keywords: z.array(z.string()).optional().nullable(),

  // Source
  source: z.string().optional().nullable(),
  referred_by: z.string().optional().nullable(),

  // Internal
  internal_notes: z.string().optional().nullable(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

// Update candidate schema (all fields optional)
export const updateCandidateSchema = createCandidateSchema.partial();

export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;

// Certification schemas
export const createCertificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  type: z.string().optional().nullable(),
  issuing_authority: z.string().optional().nullable(),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().datetime().optional().nullable(),
  expiry_date: z.string().datetime().optional().nullable(),
  is_verified: z.boolean().default(false),
  document_url: z.string().url().optional().nullable(),
});

export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;

// Reference schemas
export const createReferenceSchema = z.object({
  referee_name: z.string().min(1, "Referee name is required"),
  referee_position: z.string().optional().nullable(),
  referee_company: z.string().optional().nullable(),
  referee_email: z.string().email().optional().nullable(),
  referee_phone: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  worked_together_from: z.string().datetime().optional().nullable(),
  worked_together_to: z.string().datetime().optional().nullable(),
  is_verified: z.boolean().default(false),
  reference_text: z.string().optional().nullable(),
  reference_document_url: z.string().url().optional().nullable(),
  overall_rating: z.number().int().min(1).max(5).optional().nullable(),
  would_rehire: z.boolean().optional().nullable(),
});

export type CreateReferenceInput = z.infer<typeof createReferenceSchema>;

import { z } from "zod";

// Brief status enum
export const briefStatusSchema = z.enum([
  "new",
  "parsing",
  "parsed",
  "needs_clarification",
  "converted",
  "abandoned",
]);

// Communication channel enum
export const commChannelSchema = z.enum([
  "email",
  "whatsapp",
  "sms",
  "phone",
  "platform",
  "in_person",
]);

// Brief parsed data schema (matches BriefParsedData type)
export const briefParsedDataSchema = z.object({
  position: z.string(),
  positionCategory: z.enum([
    "deck",
    "interior",
    "galley",
    "engineering",
    "captain",
    "other",
  ]),
  vessel: z.object({
    name: z.string().nullable(),
    type: z.enum(["motor", "sailing", "catamaran", "explorer"]).nullable(),
    sizeMeters: z.number().nullable(),
  }),
  contract: z.object({
    type: z
      .enum(["permanent", "rotational", "seasonal", "temporary"])
      .nullable(),
    rotation: z.string().nullable(),
    startDate: z.string().nullable(),
  }),
  compensation: z.object({
    salaryMin: z.number().nullable(),
    salaryMax: z.number().nullable(),
    currency: z.string(),
  }),
  requirements: z.object({
    minExperience: z.number().nullable(),
    minYachtSize: z.number().nullable(),
    certifications: z.array(z.string()),
    languages: z.array(z.string()),
    other: z.array(z.string()),
  }),
  location: z.object({
    cruisingAreas: z.array(z.string()),
    base: z.string().nullable(),
  }),
  ambiguities: z.array(
    z.object({
      field: z.string(),
      issue: z.string(),
      suggestedQuestion: z.string(),
    })
  ),
  confidence: z.number().min(0).max(1),
});

export type BriefParsedData = z.infer<typeof briefParsedDataSchema>;

// Query params for GET /api/briefs
export const briefQuerySchema = z.object({
  search: z.string().optional(),
  status: briefStatusSchema.optional(),
  source: commChannelSchema.optional(),
  client_id: z.string().uuid().optional(),
  agency_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["created_at", "updated_at", "received_at", "status", "parsed_at"])
    .default("received_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type BriefQuery = z.infer<typeof briefQuerySchema>;

// Create brief schema
export const createBriefSchema = z.object({
  // Source info
  source: commChannelSchema,
  source_identifier: z.string().optional().nullable(),

  // Raw content (required)
  raw_content: z.string().min(1, "Brief content is required"),
  attachments: z.array(z.string().url()).optional().nullable(),

  // Client info
  client_id: z.string().uuid().optional().nullable(),
  client_user_id: z.string().uuid().optional().nullable(),

  // Assignment (auto-assigned to current agency if not specified)
  assigned_user_id: z.string().uuid().optional().nullable(),

  // Status
  status: briefStatusSchema.default("new"),

  // Timestamp
  received_at: z.string().datetime().optional(),
});

export type CreateBriefInput = z.infer<typeof createBriefSchema>;

// Update brief schema (for manual edits to parsed_data)
export const updateBriefSchema = z.object({
  // Can update status
  status: briefStatusSchema.optional(),

  // Can manually edit parsed data
  parsed_data: briefParsedDataSchema.partial().optional().nullable(),

  // Can update assignment
  assigned_user_id: z.string().uuid().optional().nullable(),

  // Can update client
  client_id: z.string().uuid().optional().nullable(),
});

export type UpdateBriefInput = z.infer<typeof updateBriefSchema>;

// Parse request schema (optional client context)
export const parseRequestSchema = z.object({
  // Optional client context for better parsing
  client_context: z
    .object({
      name: z.string().optional(),
      vessel_name: z.string().optional(),
      vessel_type: z.string().optional(),
      vessel_size: z.number().optional(),
      past_preferences: z
        .object({
          non_smoker: z.boolean().optional(),
          no_tattoos: z.boolean().optional(),
          nationality_preferences: z.array(z.string()).optional(),
        })
        .optional(),
      past_placements_count: z.number().optional(),
    })
    .optional(),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;

// Convert to job schema
export const convertToJobSchema = z.object({
  // Allow overriding any parsed values during conversion
  title: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "open"]).default("draft"),
  visibility: z.enum(["private", "network", "public"]).default("private"),
});

export type ConvertToJobInput = z.infer<typeof convertToJobSchema>;

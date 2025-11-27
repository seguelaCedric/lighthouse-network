import { z } from "zod";

// ----------------------------------------------------------------------------
// VERIFICATION TIERS
// ----------------------------------------------------------------------------

export const verificationTierSchema = z.enum([
  "unverified",
  "basic",
  "identity",
  "references",
  "verified",
  "premium",
]);

export type VerificationTierInput = z.infer<typeof verificationTierSchema>;

// ----------------------------------------------------------------------------
// REFERENCE SCHEMAS
// ----------------------------------------------------------------------------

export const referenceStatusSchema = z.enum([
  "pending",
  "contacted",
  "verified",
  "failed",
  "declined",
]);

export type ReferenceStatusInput = z.infer<typeof referenceStatusSchema>;

export const contactedViaSchema = z.enum(["email", "phone", "vapi"]);

export type ContactedViaInput = z.infer<typeof contactedViaSchema>;

// Create reference (candidate or recruiter adding)
export const createReferenceSchema = z.object({
  referee_name: z.string().min(1, "Reference name is required"),
  referee_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  referee_phone: z.string().optional().nullable(),
  referee_position: z.string().optional().nullable(),
  referee_company: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  company_vessel: z.string().optional().nullable(),
  dates_worked: z.string().optional().nullable(),
  worked_together_from: z.string().optional().nullable(),
  worked_together_to: z.string().optional().nullable(),
});

export type CreateReferenceInput = z.infer<typeof createReferenceSchema>;

// Update reference (partial update)
export const updateReferenceSchema = createReferenceSchema.partial().extend({
  reference_text: z.string().optional().nullable(),
  reference_document_url: z.string().url().optional().nullable(),
});

export type UpdateReferenceInput = z.infer<typeof updateReferenceSchema>;

// Verify reference (recruiter only)
export const verifyReferenceSchema = z.object({
  status: referenceStatusSchema,
  contacted_via: contactedViaSchema.optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  feedback: z.string().optional().nullable(),
  would_rehire: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type VerifyReferenceInput = z.infer<typeof verifyReferenceSchema>;

// Contact reference (mark as contacted)
export const contactReferenceSchema = z.object({
  contacted_via: contactedViaSchema,
  notes: z.string().optional().nullable(),
});

export type ContactReferenceInput = z.infer<typeof contactReferenceSchema>;

// ----------------------------------------------------------------------------
// ID VERIFICATION SCHEMAS
// ----------------------------------------------------------------------------

// Upload ID document
export const uploadIdDocumentSchema = z.object({
  document_url: z.string().url("Invalid document URL"),
});

export type UploadIdDocumentInput = z.infer<typeof uploadIdDocumentSchema>;

// Approve/reject ID verification (recruiter only)
export const reviewIdVerificationSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional().nullable(),
});

export type ReviewIdVerificationInput = z.infer<typeof reviewIdVerificationSchema>;

// ----------------------------------------------------------------------------
// VOICE VERIFICATION SCHEMAS
// ----------------------------------------------------------------------------

// Initiate voice verification
export const initiateVoiceVerificationSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
  scheduled_at: z.string().datetime().optional(),
});

export type InitiateVoiceVerificationInput = z.infer<typeof initiateVoiceVerificationSchema>;

// Complete voice verification (webhook from Vapi)
export const completeVoiceVerificationSchema = z.object({
  call_id: z.string().min(1, "Call ID is required"),
  status: z.enum(["completed", "failed", "no_answer"]),
  transcript: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  duration_seconds: z.number().int().optional(),
});

export type CompleteVoiceVerificationInput = z.infer<typeof completeVoiceVerificationSchema>;

// ----------------------------------------------------------------------------
// CV UPLOAD SCHEMA
// ----------------------------------------------------------------------------

export const uploadCvSchema = z.object({
  cv_url: z.string().url("Invalid CV URL"),
});

export type UploadCvInput = z.infer<typeof uploadCvSchema>;

// ----------------------------------------------------------------------------
// VERIFICATION EVENT TYPES
// ----------------------------------------------------------------------------

export const verificationEventTypeSchema = z.enum([
  "tier_changed",
  "email_verified",
  "cv_uploaded",
  "id_uploaded",
  "id_verified",
  "reference_added",
  "reference_contacted",
  "reference_verified",
  "voice_completed",
]);

export type VerificationEventTypeInput = z.infer<typeof verificationEventTypeSchema>;

// ----------------------------------------------------------------------------
// VERIFICATION STATUS RESPONSE TYPE
// ----------------------------------------------------------------------------

export interface VerificationStatusResponse {
  tier: VerificationTierInput;
  checklist: {
    email_verified: boolean;
    cv_uploaded: boolean;
    id_verified: boolean;
    id_pending: boolean;
    references_verified: number;
    references_total: number;
    voice_verified: boolean;
  };
  next_steps: string[];
  progress: number;
  references: Array<{
    id: string;
    name: string;
    status: ReferenceStatusInput;
    relationship: string | null;
    company_vessel: string | null;
  }>;
}

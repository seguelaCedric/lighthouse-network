import { z } from "zod";

// Document type enum
export const documentTypeSchema = z.enum([
  "cv",
  "certification",
  "passport",
  "visa",
  "medical",
  "reference",
  "contract",
  "photo",
  "other",
]);

export type DocumentType = z.infer<typeof documentTypeSchema>;

// Entity type enum
export const entityTypeSchema = z.enum(["candidate", "client", "job"]);

export type EntityType = z.infer<typeof entityTypeSchema>;

// Document status enum
export const documentStatusSchema = z.enum(["pending", "approved", "rejected"]);

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z.custom<File>(
    (val) => val instanceof File,
    "Invalid file"
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    "File size must be less than 10MB"
  ).refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type as any),
    "Only PDF, Word documents, and images (JPEG, PNG, WebP) are allowed"
  ),
});

// Document upload request schema
export const documentUploadSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
  documentType: documentTypeSchema,
  description: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  replaceDocumentId: z.string().uuid().optional(),
});

// Document approval schema
export const documentApprovalSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
});

// Document rejection schema
export const documentRejectionSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  reason: z.string().min(1, "Rejection reason is required").max(500, "Rejection reason is too long"),
});

// Rejection reason options
export const REJECTION_REASONS = [
  "Unclear or blurry",
  "Document expired",
  "Wrong document type",
  "Information incomplete",
  "Name does not match profile",
  "Invalid document format",
  "Other",
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number];

// Get document versions schema
export const getDocumentVersionsSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
  documentType: documentTypeSchema,
});

// Get entity documents schema
export const getEntityDocumentsSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
  documentType: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  latestOnly: z.boolean().optional(),
});

// Helper function to validate file on server
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "File type not allowed. Please upload PDF, Word, or image files.",
    };
  }

  return { valid: true };
}

// Helper to get file extension
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Helper to sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100);
}

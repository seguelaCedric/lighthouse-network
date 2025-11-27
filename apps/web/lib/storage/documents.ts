import { createClient } from "@/lib/supabase/server";

// Document types
export type DocumentType =
  | "cv"
  | "certification"
  | "passport"
  | "visa"
  | "medical"
  | "reference"
  | "contract"
  | "photo"
  | "other";

export interface DocumentMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  documentType: DocumentType;
  expiryDate?: string;
  description?: string;
}

export interface UploadedDocument {
  id: string;
  entityType: "candidate" | "client" | "job";
  entityId: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  metadata: DocumentMetadata;
  createdAt: Date;
}

// Storage bucket name
const BUCKET_NAME = "documents";

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Generate a unique file path for storage
 */
function generateFilePath(
  entityType: string,
  entityId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop() || "file";
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  return `${entityType}/${entityId}/${timestamp}-${sanitizedName}`;
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not allowed. Please upload PDF, Word, or image files.",
    };
  }

  return { valid: true };
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadDocument(
  file: File,
  entityType: "candidate" | "client" | "job",
  entityId: string,
  documentType: DocumentType,
  options?: {
    expiryDate?: string;
    description?: string;
  }
): Promise<{ success: boolean; document?: UploadedDocument; error?: string }> {
  try {
    const supabase = await createClient();

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Generate file path
    const filePath = generateFilePath(entityType, entityId, file.name);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // Create document metadata
    const metadata: DocumentMetadata = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      documentType,
      expiryDate: options?.expiryDate,
      description: options?.description,
    };

    // Save document record to database
    const { data: documentRecord, error: dbError } = await supabase
      .from("documents")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType,
        expiry_date: options?.expiryDate || null,
        description: options?.description || null,
        uploaded_by: userData.id,
        organization_id: userData.organization_id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to delete the uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      return { success: false, error: "Failed to save document record" };
    }

    return {
      success: true,
      document: {
        id: documentRecord.id,
        entityType,
        entityId,
        fileName: file.name,
        filePath,
        publicUrl,
        metadata,
        createdAt: new Date(documentRecord.created_at),
      },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get documents for an entity
 */
export async function getDocuments(
  entityType: "candidate" | "client" | "job",
  entityId: string
): Promise<UploadedDocument[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch documents:", error);
      return [];
    }

    return (data || []).map((doc) => ({
      id: doc.id,
      entityType: doc.entity_type as "candidate" | "client" | "job",
      entityId: doc.entity_id,
      fileName: doc.file_name,
      filePath: doc.file_path,
      publicUrl: doc.file_url,
      metadata: {
        originalName: doc.file_name,
        mimeType: doc.mime_type,
        size: doc.file_size,
        uploadedAt: doc.created_at,
        documentType: doc.document_type as DocumentType,
        expiryDate: doc.expiry_date,
        description: doc.description,
      },
      createdAt: new Date(doc.created_at),
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get document record
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, file_path")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: "Document not found" };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([doc.file_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue to soft delete the record even if storage fails
    }

    // Soft delete the record
    const { error: dbError } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", documentId);

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to delete document" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a signed URL for private document access
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Failed to create signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
}

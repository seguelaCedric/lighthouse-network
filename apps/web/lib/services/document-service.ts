/**
 * Document Service
 * Handles document operations with versioning, approval workflow, and audit logging
 */

import { createClient } from "@/lib/supabase/server";
import type { DocumentType } from "@/lib/storage/documents";

export type DocumentStatus = "pending" | "approved" | "rejected";

export interface Document {
  id: string;
  entityType: "candidate" | "client" | "job";
  entityId: string;
  documentType: DocumentType;
  name: string;
  description?: string;
  fileUrl: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  version: number;
  parentDocumentId?: string;
  isLatestVersion: boolean;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  expiryDate?: string;
  organizationId: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  isLatestVersion: boolean;
}

/**
 * Get document by ID
 */
export async function getDocumentById(
  documentId: string
): Promise<{ success: boolean; document?: Document; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      document: {
        id: data.id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        documentType: data.type,
        name: data.name || data.file_name,
        description: data.description,
        fileUrl: data.file_url,
        filePath: data.file_path,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        status: data.status || "pending",
        version: data.version || 1,
        parentDocumentId: data.parent_document_id,
        isLatestVersion: data.is_latest_version ?? true,
        uploadedBy: data.uploaded_by,
        uploadedAt: data.created_at,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        rejectedBy: data.rejected_by,
        rejectedAt: data.rejected_at,
        rejectionReason: data.rejection_reason,
        expiryDate: data.expiry_date,
        organizationId: data.organization_id,
      },
    };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { success: false, error: "Failed to fetch document" };
  }
}

/**
 * Get all documents for an entity
 */
export async function getEntityDocuments(
  entityType: "candidate" | "client" | "job",
  entityId: string,
  options?: {
    documentType?: DocumentType;
    status?: DocumentStatus;
    latestOnly?: boolean;
  }
): Promise<Document[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("documents")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("deleted_at", null);

    if (options?.documentType) {
      query = query.eq("type", options.documentType);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.latestOnly) {
      query = query.eq("is_latest_version", true);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch documents:", error);
      return [];
    }

    return (data || []).map((doc) => ({
      id: doc.id,
      entityType: doc.entity_type,
      entityId: doc.entity_id,
      documentType: doc.type,
      name: doc.name || doc.file_name,
      description: doc.description,
      fileUrl: doc.file_url,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      status: doc.status || "pending",
      version: doc.version || 1,
      parentDocumentId: doc.parent_document_id,
      isLatestVersion: doc.is_latest_version ?? true,
      uploadedBy: doc.uploaded_by,
      uploadedAt: doc.created_at,
      approvedBy: doc.approved_by,
      approvedAt: doc.approved_at,
      rejectedBy: doc.rejected_by,
      rejectedAt: doc.rejected_at,
      rejectionReason: doc.rejection_reason,
      expiryDate: doc.expiry_date,
      organizationId: doc.organization_id,
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

/**
 * Get document version history
 */
export async function getDocumentVersions(
  entityType: "candidate" | "client" | "job",
  entityId: string,
  documentType: DocumentType
): Promise<DocumentVersion[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_document_versions", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_document_type: documentType,
    });

    if (error) {
      console.error("Failed to fetch document versions:", error);
      return [];
    }

    return (data || []).map((v: any) => ({
      id: v.id,
      version: v.version,
      fileUrl: v.file_url,
      fileSize: v.file_size,
      status: v.status,
      uploadedBy: v.uploaded_by,
      uploadedAt: v.uploaded_at,
      approvedBy: v.approved_by,
      approvedAt: v.approved_at,
      rejectedBy: v.rejected_by,
      rejectedAt: v.rejected_at,
      rejectionReason: v.rejection_reason,
      isLatestVersion: v.is_latest_version,
    }));
  } catch (error) {
    console.error("Error fetching document versions:", error);
    return [];
  }
}

/**
 * Approve a document
 */
export async function approveDocument(
  documentId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("approve_document", {
      p_document_id: documentId,
      p_approved_by: approvedBy,
    });

    if (error) {
      console.error("Failed to approve document:", error);
      return { success: false, error: error.message || "Failed to approve document" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error approving document:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reject a document
 */
export async function rejectDocument(
  documentId: string,
  rejectedBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("reject_document", {
      p_document_id: documentId,
      p_rejected_by: rejectedBy,
      p_rejection_reason: reason,
    });

    if (error) {
      console.error("Failed to reject document:", error);
      return { success: false, error: error.message || "Failed to reject document" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error rejecting document:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a new version of an existing document
 */
export async function createDocumentVersion(
  parentDocumentId: string,
  newFileUrl: string,
  newFilePath: string,
  newFileSize: number,
  newMimeType: string,
  uploadedBy: string,
  organizationId: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_document_version", {
      p_parent_document_id: parentDocumentId,
      p_new_file_url: newFileUrl,
      p_new_file_path: newFilePath,
      p_new_file_size: newFileSize,
      p_new_mime_type: newMimeType,
      p_uploaded_by: uploadedBy,
      p_organization_id: organizationId,
    });

    if (error) {
      console.error("Failed to create document version:", error);
      return { success: false, error: error.message || "Failed to create document version" };
    }

    return { success: true, documentId: data };
  } catch (error) {
    console.error("Error creating document version:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all pending documents for an organization (for approval queue)
 */
export async function getPendingDocuments(
  organizationId: string,
  options?: {
    documentType?: DocumentType;
    limit?: number;
  }
): Promise<Document[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("documents")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .eq("is_latest_version", true)
      .is("deleted_at", null);

    if (options?.documentType) {
      query = query.eq("type", options.documentType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    query = query.order("created_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch pending documents:", error);
      return [];
    }

    return (data || []).map((doc) => ({
      id: doc.id,
      entityType: doc.entity_type,
      entityId: doc.entity_id,
      documentType: doc.type,
      name: doc.name || doc.file_name,
      description: doc.description,
      fileUrl: doc.file_url,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      status: doc.status,
      version: doc.version || 1,
      parentDocumentId: doc.parent_document_id,
      isLatestVersion: doc.is_latest_version ?? true,
      uploadedBy: doc.uploaded_by,
      uploadedAt: doc.created_at,
      approvedBy: doc.approved_by,
      approvedAt: doc.approved_at,
      rejectedBy: doc.rejected_by,
      rejectedAt: doc.rejected_at,
      rejectionReason: doc.rejection_reason,
      expiryDate: doc.expiry_date,
      organizationId: doc.organization_id,
    }));
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    return [];
  }
}

/**
 * Get latest approved document for an entity and type
 */
export async function getLatestApprovedDocument(
  entityType: "candidate" | "client" | "job",
  entityId: string,
  documentType: DocumentType
): Promise<Document | null> {
  try {
    const supabase = await createClient();

    const { data } = await supabase.rpc("get_latest_approved_document", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_document_type: documentType,
    });

    if (!data) {
      return null;
    }

    const result = await getDocumentById(data);
    return result.document || null;
  } catch (error) {
    console.error("Error fetching latest approved document:", error);
    return null;
  }
}

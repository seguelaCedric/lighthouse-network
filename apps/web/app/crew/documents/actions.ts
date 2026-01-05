"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Document data types
 */
export interface Document {
  id: string;
  name: string;
  type: string;
  documentType: string;
  fileUrl: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: "pending" | "approved" | "rejected";
  version: number;
  expiryDate: string | null;
  description: string | null;
  uploadedAt: string;
  rejectionReason: string | null;
}

export interface CertificationDocument {
  id: string;
  name: string;
  issuingAuthority: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  documentUrl: string | null;
  status: "valid" | "expiring_soon" | "expired" | "no_document";
  daysUntilExpiry: number | null;
}

export interface DocumentsPageData {
  candidateId: string;
  cv: Document | null;
  documents: Document[];
  certifications: CertificationDocument[];
}

/**
 * Get documents data for the authenticated candidate
 */
export async function getDocumentsData(): Promise<DocumentsPageData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) return null;

  // Get candidate
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, cv_url, cv_status, cv_document_id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) return null;

  // Get all documents for this candidate
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      id,
      name,
      type,
      file_url,
      file_path,
      file_size,
      mime_type,
      status,
      version,
      expiry_date,
      description,
      created_at,
      rejection_reason,
      is_latest_version
    `)
    .eq("entity_id", candidate.id)
    .eq("entity_type", "candidate")
    .is("deleted_at", null)
    .eq("is_latest_version", true)
    .order("created_at", { ascending: false });

  // Get certifications with their document status
  const { data: certifications } = await supabase
    .from("certifications")
    .select(`
      id,
      name,
      issuing_authority,
      certificate_number,
      issue_date,
      expiry_date,
      document_url
    `)
    .eq("candidate_id", candidate.id)
    .order("expiry_date", { ascending: true });

  // Find CV document
  const cvDoc = (documents || []).find(
    (doc) => doc.type === "cv" && doc.is_latest_version
  );

  // Calculate certification status
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const mappedCertifications: CertificationDocument[] = (certifications || []).map(
    (cert) => {
      let status: CertificationDocument["status"] = "no_document";
      let daysUntilExpiry: number | null = null;

      if (cert.expiry_date) {
        const expiryDate = new Date(cert.expiry_date);
        daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (expiryDate < now) {
          status = "expired";
        } else if (expiryDate < thirtyDaysFromNow) {
          status = "expiring_soon";
        } else if (cert.document_url) {
          status = "valid";
        }
      } else if (cert.document_url) {
        status = "valid";
      }

      return {
        id: cert.id,
        name: cert.name,
        issuingAuthority: cert.issuing_authority,
        certificateNumber: cert.certificate_number,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        documentUrl: cert.document_url,
        status,
        daysUntilExpiry,
      };
    }
  );

  // Filter out CV from general documents
  const otherDocuments = (documents || []).filter(
    (doc) => doc.type !== "cv"
  );

  return {
    candidateId: candidate.id,
    cv: cvDoc
      ? {
          id: cvDoc.id,
          name: cvDoc.name,
          type: cvDoc.type,
          documentType: cvDoc.type,
          fileUrl: cvDoc.file_url,
          filePath: cvDoc.file_path,
          fileSize: cvDoc.file_size || 0,
          mimeType: cvDoc.mime_type || "application/pdf",
          status: cvDoc.status || "pending",
          version: cvDoc.version || 1,
          expiryDate: cvDoc.expiry_date,
          description: cvDoc.description,
          uploadedAt: cvDoc.created_at,
          rejectionReason: cvDoc.rejection_reason,
        }
      : null,
    documents: otherDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      documentType: doc.type,
      fileUrl: doc.file_url,
      filePath: doc.file_path,
      fileSize: doc.file_size || 0,
      mimeType: doc.mime_type || "application/octet-stream",
      status: doc.status || "pending",
      version: doc.version || 1,
      expiryDate: doc.expiry_date,
      description: doc.description,
      uploadedAt: doc.created_at,
      rejectionReason: doc.rejection_reason,
    })),
    certifications: mappedCertifications,
  };
}

/**
 * Delete a document
 */
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  // Get candidate
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    return { success: false, error: "Candidate not found" };
  }

  // Verify document belongs to this candidate
  const { data: doc } = await supabase
    .from("documents")
    .select("id, entity_id, file_path")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return { success: false, error: "Document not found" };
  }

  if (doc.entity_id !== candidate.id) {
    return { success: false, error: "Not authorized to delete this document" };
  }

  // Delete from storage
  if (doc.file_path) {
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue with soft delete even if storage fails
    }
  }

  // Soft delete the document
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }

  revalidatePath("/crew/documents");
  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Upload a document for certification
 */
export async function uploadCertificationDocument(
  certificationId: string,
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  // Get candidate
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    return { success: false, error: "Candidate not found" };
  }

  // Verify certification belongs to this candidate
  const { data: cert } = await supabase
    .from("certifications")
    .select("id, candidate_id")
    .eq("id", certificationId)
    .single();

  if (!cert || cert.candidate_id !== candidate.id) {
    return { success: false, error: "Certification not found" };
  }

  // Update certification with document URL
  const { error } = await supabase
    .from("certifications")
    .update({
      document_url: fileUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", certificationId);

  if (error) {
    console.error("Error updating certification:", error);
    return { success: false, error: "Failed to update certification" };
  }

  revalidatePath("/crew/documents");
  revalidatePath("/crew/profile/edit");
  return { success: true };
}

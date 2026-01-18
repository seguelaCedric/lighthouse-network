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
  certificationDocuments: Document[];
}

const stripFileExtension = (name: string) => name.replace(/\.[^/.]+$/, "");

const normalizeCertificationName = (name: string) =>
  name.trim().toLowerCase();

const getCertificationStatus = (expiryDate: string | null) => {
  if (!expiryDate) {
    return { status: "valid" as const, daysUntilExpiry: null };
  }

  const now = new Date();
  const expiresAt = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (expiresAt < now) {
    return { status: "expired" as const, daysUntilExpiry };
  }

  if (daysUntilExpiry < 30) {
    return { status: "expiring_soon" as const, daysUntilExpiry };
  }

  return { status: "valid" as const, daysUntilExpiry };
};

/**
 * Get documents data for the authenticated candidate
 */
export async function getDocumentsData(): Promise<DocumentsPageData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const candidateFields = "id, cv_url, cv_status, cv_document_id";

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase
          .from("candidates")
          .select(candidateFields)
          .eq("email", user.email)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) return null;

  // PERFORMANCE: Run documents and certifications queries in parallel
  const [documentsResult, certificationsResult] = await Promise.all([
    supabase
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
      .order("created_at", { ascending: false }),
    supabase
      .from("candidate_certifications")
      .select(`
        id,
        certification_type,
        custom_name,
        expiry_date,
        has_certification
      `)
      .eq("candidate_id", candidate.id)
      .eq("has_certification", true)
      .order("expiry_date", { ascending: true }),
  ]);

  const documents = documentsResult.data;
  const certifications = certificationsResult.data;

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

      if (cert.has_certification) {
        status = "valid";
      }

      if (cert.expiry_date) {
        const expiryDate = new Date(cert.expiry_date);
        daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (expiryDate < now) {
          status = "expired";
        } else if (expiryDate < thirtyDaysFromNow) {
          status = "expiring_soon";
        }
      }

      return {
        id: cert.id,
        name: cert.custom_name || cert.certification_type,
        issuingAuthority: null,
        certificateNumber: null,
        issueDate: null,
        expiryDate: cert.expiry_date,
        documentUrl: null,
        status,
        daysUntilExpiry,
      };
    }
  );

  const certificationDocuments = (documents || []).filter(
    (doc) => doc.type === "certification" && doc.is_latest_version
  );

  const certificationDocsByName = new Map(
    certificationDocuments.map((doc) => [
      normalizeCertificationName(stripFileExtension(doc.name || "")),
      doc,
    ])
  );

  const matchedDocumentIds = new Set<string>();

  const certificationNames = new Set(
    mappedCertifications.map((cert) =>
      normalizeCertificationName(cert.name)
    )
  );

  const documentCertifications = certificationDocuments
    .map((doc): CertificationDocument | null => {
      const displayName = stripFileExtension(doc.name || "Certification");
      const normalizedName = normalizeCertificationName(displayName);
      if (normalizedName && certificationNames.has(normalizedName)) {
        return null;
      }

      const { status, daysUntilExpiry } = getCertificationStatus(doc.expiry_date);

      return {
        id: doc.id,
        name: displayName,
        issuingAuthority: null,
        certificateNumber: null,
        issueDate: null,
        expiryDate: doc.expiry_date,
        documentUrl: `/api/documents/${doc.id}/view`,
        status,
        daysUntilExpiry,
      };
    })
    .filter((cert): cert is CertificationDocument => cert !== null);

  const mappedCertificationsWithDocs: CertificationDocument[] = mappedCertifications.map(
    (cert) => {
      const normalizedName = normalizeCertificationName(cert.name);
      const matchingDoc = certificationDocsByName.get(normalizedName);
      if (matchingDoc) {
        matchedDocumentIds.add(matchingDoc.id);
        return {
          ...cert,
          documentUrl: `/api/documents/${matchingDoc.id}/view`,
        };
      }
      return cert;
    }
  );

  const filteredDocumentCertifications = documentCertifications.filter(
    (cert) => !matchedDocumentIds.has(cert.id)
  );

  // Filter out CV from general documents (keep certifications - they appear in both sections)
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
    certifications: [...mappedCertificationsWithDocs, ...filteredDocumentCertifications],
    certificationDocuments: certificationDocuments.map((doc) => ({
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

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("candidates").select("id").eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) {
    return { success: false, error: "Candidate not found" };
  }

  // Verify document belongs to this candidate
  const { data: doc } = await supabase
    .from("documents")
    .select("id, entity_id, file_path, type, is_latest_version")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return { success: false, error: "Document not found" };
  }

  if (doc.entity_id !== candidate.id) {
    return { success: false, error: "Not authorized to delete this document" };
  }

  if (doc.type === "cv") {
    const { error } = await supabase
      .from("documents")
      .update({ is_latest_version: false })
      .eq("id", documentId);

    if (error) {
      console.error("Error deleting CV:", error);
      return { success: false, error: "Failed to delete document" };
    }

    const { error: chunksError } = await supabase
      .from("cv_chunks")
      .delete()
      .eq("document_id", documentId);

    if (chunksError) {
      console.error("Error deleting CV embeddings:", chunksError);
    }

    const { error: queueError } = await supabase
      .from("embedding_queue")
      .delete()
      .eq("entity_type", "cv_document")
      .eq("entity_id", documentId);

    if (queueError) {
      console.error("Error deleting CV embedding queue item:", queueError);
    }

    if (doc.is_latest_version) {
      await supabase
        .from("candidates")
        .update({
          cv_status: "not_uploaded",
          cv_url: null,
          cv_document_id: null,
        })
        .eq("id", candidate.id);
    }
  } else {
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

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("candidates").select("id").eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) {
    return { success: false, error: "Candidate not found" };
  }

  // Verify certification belongs to this candidate
  const { data: cert } = await supabase
    .from("candidate_certifications")
    .select("id, candidate_id")
    .eq("id", certificationId)
    .single();

  if (!cert || cert.candidate_id !== candidate.id) {
    return { success: false, error: "Certification not found" };
  }

  // Update certification with document URL
  const { error } = await supabase
    .from("candidate_certifications")
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

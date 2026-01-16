import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createDocumentVersion } from "@/lib/services/document-service";
import { documentUploadSchema, validateFile, sanitizeFilename } from "@/lib/validations/documents";
import { logVerificationEvent, calculateVerificationTier } from "@/lib/verification";
import { syncDocumentUpload } from "@/lib/vincere/sync-service";
import { extractText, isExtractable } from "@/lib/services/text-extraction";
import { sendEmail, newCandidateRegistrationAdminEmail } from "@/lib/email";

const BUCKET_NAME = "documents";
const serviceSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!serviceSupabaseUrl || !serviceSupabaseKey) {
    return null;
  }

  return createServiceClient(serviceSupabaseUrl, serviceSupabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * POST /api/documents/upload
 * Upload a document with versioning support
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = getServiceClient();
    const storageClient = serviceClient ?? supabase;
    const dbClient = serviceClient ?? supabase;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, organization_id, user_type")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const documentType = formData.get("documentType") as string;
    const description = formData.get("description") as string | null;
    const expiryDate = formData.get("expiryDate") as string | null;
    const replaceDocumentId = formData.get("replaceDocumentId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate form data
    const validationResult = documentUploadSchema.safeParse({
      entityType,
      entityId,
      documentType,
      description: description || undefined,
      expiryDate: expiryDate || undefined,
      replaceDocumentId: replaceDocumentId || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Check permissions
    // Candidates can only upload to their own profile
    // Recruiters can upload to any entity
    if (userData.user_type === "candidate") {
      let candidateData: { id: string; user_id?: string | null } | null = null;

      // Get the candidate ID for this user
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select("id, user_id")
        .eq("user_id", userData.id)
        .maybeSingle();

      candidateData = candidateByUserId;

      // Fallback for Vincere-imported candidates linked by email
      if (!candidateData && user.email) {
        const { data: candidateByEmail } = await supabase
          .from("candidates")
          .select("id, user_id")
          .eq("email", user.email)
          .maybeSingle();

        if (candidateByEmail) {
          if (candidateByEmail.user_id && candidateByEmail.user_id !== userData.id) {
            return NextResponse.json(
              { error: "You can only upload documents to your own profile" },
              { status: 403 }
            );
          }

          if (!candidateByEmail.user_id) {
            const { error: linkError } = await supabase
              .from("candidates")
              .update({
                user_id: userData.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", candidateByEmail.id)
              .is("user_id", null);

            if (linkError) {
              console.error("Failed to link candidate to user:", linkError);
              return NextResponse.json(
                { error: "Failed to link candidate profile" },
                { status: 500 }
              );
            }
          }

          candidateData = { id: candidateByEmail.id, user_id: userData.id };
        }
      }

      if (!candidateData || entityType !== "candidate" || entityId !== candidateData.id) {
        return NextResponse.json(
          { error: "You can only upload documents to your own profile" },
          { status: 403 }
        );
      }
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.name);
    const filePath = `${entityType}/${entityId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await storageClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = storageClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    let documentId: string;
    let version: number = 1;

    // Check if this is a new version of an existing document
    if (replaceDocumentId) {
      let organizationId = userData.organization_id;

      if (!organizationId) {
        const { data: parentDoc } = await supabase
          .from("documents")
          .select("organization_id")
          .eq("id", replaceDocumentId)
          .maybeSingle();

        organizationId = parentDoc?.organization_id || null;
      }

      if (!organizationId) {
        console.warn("Document version upload without organization_id.", {
          userId: userData.id,
          documentId: replaceDocumentId,
        });
      }

      // Create new version using the database function
      const result = await createDocumentVersion(
        replaceDocumentId,
        publicUrl,
        filePath,
        file.size,
        file.type,
        userData.id,
        organizationId ?? null
      );

      if (!result.success || !result.documentId) {
        // Cleanup uploaded file
        await storageClient.storage.from(BUCKET_NAME).remove([filePath]);
        return NextResponse.json(
          { error: result.error || "Failed to create document version" },
          { status: 500 }
        );
      }

      documentId = result.documentId;

      // Get version number
      const { data: docData } = await supabase
        .from("documents")
        .select("version")
        .eq("id", documentId)
        .single();

      version = docData?.version || 1;
    } else {
      // Create new document
      if (!userData.organization_id) {
        console.warn("Document upload without organization_id for user:", userData.id);
      }

      const insertPayload: Record<string, unknown> = {
        entity_type: entityType,
        entity_id: entityId,
        type: documentType,
        name: file.name,
        description: description || null,
        file_url: publicUrl,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        expiry_date: expiryDate || null,
        uploaded_by: userData.id,
        status: "pending",
        version: 1,
        is_latest_version: true,
      };

      if (userData.organization_id) {
        insertPayload.organization_id = userData.organization_id;
      }

      const { data: documentRecord, error: dbError } = await dbClient
        .from("documents")
        .insert(insertPayload)
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        console.error("Database error details:", {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
        });
        // Cleanup uploaded file
        await storageClient.storage.from(BUCKET_NAME).remove([filePath]);
        return NextResponse.json(
          { error: "Failed to save document record" },
          { status: 500 }
        );
      }

      documentId = documentRecord.id;
    }

    // If this is a certification for a candidate, create a certification entry
    if (documentType === "certification" && entityType === "candidate" && !replaceDocumentId) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const certificationType = `custom_${documentId}`;

      const { error: certificationError } = await supabase
        .from("candidate_certifications")
        .insert({
          candidate_id: entityId,
          certification_type: certificationType,
          has_certification: true,
          custom_name: baseName,
          expiry_date: expiryDate || null,
        });

      if (certificationError) {
        console.error("Error creating certification:", certificationError);
      }
    }

    // If this is a CV for a candidate, extract text and update candidate status
    if (documentType === "cv" && entityType === "candidate") {
      // Update candidate CV status, url, and document reference
      await supabase
        .from("candidates")
        .update({
          cv_status: "pending",
          cv_url: publicUrl,
          cv_document_id: documentId,
        })
        .eq("id", entityId);

      // Extract text from CV if it's an extractable format (PDF, DOCX)
      // This populates extracted_text which triggers embedding generation via database triggers
      if (isExtractable(file.type, file.name)) {
        try {
          const fileBuffer = await file.arrayBuffer();
          const extractionResult = await extractText(fileBuffer, file.type, file.name);

          if (extractionResult.text) {
            // Update document with extracted text - this triggers:
            // 1. trg_queue_embedding_on_document -> queues candidate for embedding generation
            // 2. trigger_document_cv_extraction -> queues CV for AI structured extraction
            const { error: updateError } = await supabase
              .from("documents")
              .update({
                extracted_text: extractionResult.text,
                page_count: extractionResult.pageCount || null,
              })
              .eq("id", documentId);

            if (updateError) {
              console.error("Failed to update document with extracted text:", updateError);
              // Non-fatal - document was still uploaded successfully
            } else {
              console.log(`CV text extracted for document ${documentId}: ${extractionResult.text.length} chars`);
            }
          } else if (extractionResult.error) {
            console.warn(`Text extraction failed for document ${documentId}:`, extractionResult.error);
          }
        } catch (extractionError) {
          console.error("Text extraction error:", extractionError);
          // Non-fatal - document was still uploaded successfully
        }
      }

      // Log verification event
      await logVerificationEvent(entityId, "cv_uploaded", {
        newValue: publicUrl,
        performedBy: userData.id,
        metadata: {
          documentId,
          version,
        },
      });

      // Recalculate verification tier
      await calculateVerificationTier(entityId);

      // Send admin notification for new candidate registration with CV (fire-and-forget)
      // Only send for first CV upload (version 1) from self-registered candidates
      if (version === 1 && !replaceDocumentId) {
        // Get candidate details to include in admin email
        const { data: candidateData } = await supabase
          .from("candidates")
          .select("first_name, last_name, email, phone, primary_position, nationality, candidate_type, source")
          .eq("id", entityId)
          .single();

        if (candidateData && candidateData.source === "self_registration") {
          const adminEmail = newCandidateRegistrationAdminEmail({
            firstName: candidateData.first_name || "",
            lastName: candidateData.last_name || "",
            email: candidateData.email || "",
            phone: candidateData.phone || undefined,
            primaryPosition: candidateData.primary_position || undefined,
            nationality: candidateData.nationality || undefined,
            candidateType: candidateData.candidate_type || undefined,
            cvUrl: publicUrl,
          });

          // Get CV file buffer for attachment
          const fileBuffer = await file.arrayBuffer();
          const cvBuffer = Buffer.from(fileBuffer);

          sendEmail({
            to: "admin@lighthouse-careers.com",
            subject: adminEmail.subject,
            html: adminEmail.html,
            text: adminEmail.text,
            attachments: [
              {
                filename: file.name,
                content: cvBuffer,
                contentType: file.type,
              },
            ],
          }).catch((err) =>
            console.error("Failed to send admin notification email:", err)
          );
        }
      }
    }

    // Sync document to Vincere for candidate uploads (fire-and-forget)
    if (entityType === "candidate") {
      syncDocumentUpload(entityId, publicUrl, file.name, file.type, documentType).catch((err) =>
        console.error("Vincere sync failed for document upload:", err)
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        version,
        status: "pending",
        url: publicUrl,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

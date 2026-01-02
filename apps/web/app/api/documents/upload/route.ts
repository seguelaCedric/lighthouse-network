import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDocumentVersion } from "@/lib/services/document-service";
import { documentUploadSchema, validateFile, sanitizeFilename } from "@/lib/validations/documents";
import { logVerificationEvent, calculateVerificationTier } from "@/lib/verification";

const BUCKET_NAME = "documents";

/**
 * POST /api/documents/upload
 * Upload a document with versioning support
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
      if (entityType !== "candidate" || entityId !== userData.id) {
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
    const { error: uploadError } = await supabase.storage
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
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    let documentId: string;
    let version: number = 1;

    // Check if this is a new version of an existing document
    if (replaceDocumentId) {
      // Create new version using the database function
      const result = await createDocumentVersion(
        replaceDocumentId,
        publicUrl,
        filePath,
        file.size,
        file.type,
        userData.id,
        userData.organization_id
      );

      if (!result.success || !result.documentId) {
        // Cleanup uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
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
      const { data: documentRecord, error: dbError } = await supabase
        .from("documents")
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          name: file.name,
          description: description || null,
          file_url: publicUrl,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          expiry_date: expiryDate || null,
          uploaded_by: userData.id,
          organization_id: userData.organization_id,
          status: "pending",
          version: 1,
          is_latest_version: true,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Cleanup uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        return NextResponse.json(
          { error: "Failed to save document record" },
          { status: 500 }
        );
      }

      documentId = documentRecord.id;
    }

    // If this is a CV for a candidate, update candidate status and log event
    if (documentType === "cv" && entityType === "candidate") {
      // Update candidate CV status
      await supabase
        .from("candidates")
        .update({ cv_status: "pending" })
        .eq("id", entityId);

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

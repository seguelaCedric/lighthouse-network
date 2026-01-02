import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/services/document-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * MIME type detection based on file extension
 * This is needed because documents may be stored with generic "application/octet-stream"
 */
const MIME_TYPES: Record<string, string> = {
  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  rtf: "application/rtf",
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  // Other
  json: "application/json",
  xml: "application/xml",
};

function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * GET /api/documents/[id]/view
 * Stream document content with correct Content-Type header for inline viewing
 * This proxies the file through our server to set proper MIME type headers
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
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
      .select("id, user_type, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get document
    const result = await getDocumentById(documentId);
    if (!result.success || !result.document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = result.document;

    // Check permissions
    // Recruiters can access all documents from their organization
    // Candidates can only access their own documents
    if (userData.user_type === "candidate") {
      if (document.entityType !== "candidate" || document.entityId !== userData.id) {
        return NextResponse.json(
          { error: "You can only access your own documents" },
          { status: 403 }
        );
      }
    } else if (userData.user_type === "recruiter") {
      // Check if document is in user's organization or belongs to linked candidate
      const { data: relationship } = await supabase
        .from("candidate_agency_relationships")
        .select("id")
        .eq("candidate_id", document.entityId)
        .eq("agency_id", userData.organization_id)
        .single();

      const isOwnOrg = document.organizationId === userData.organization_id;
      const isLinkedCandidate = !!relationship;

      if (!isOwnOrg && !isLinkedCandidate) {
        return NextResponse.json(
          { error: "You can only access documents from your organization or linked candidates" },
          { status: 403 }
        );
      }
    }

    // Check if we have a file_path for Supabase storage
    if (!document.filePath) {
      // If no file_path, redirect to the external URL
      if (document.fileUrl) {
        return NextResponse.redirect(document.fileUrl);
      }
      return NextResponse.json(
        { error: "Document file not found" },
        { status: 404 }
      );
    }

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.filePath);

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError);
      return NextResponse.json(
        { error: "Failed to retrieve document" },
        { status: 500 }
      );
    }

    // Detect the correct MIME type from the filename
    const mimeType = getMimeTypeFromFilename(document.name);

    // Return the file with proper headers for inline viewing
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.name)}"`,
        "Content-Length": fileData.size.toString(),
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error viewing document:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

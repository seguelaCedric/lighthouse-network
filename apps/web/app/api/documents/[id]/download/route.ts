import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/services/document-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/documents/[id]/download
 * Generate a signed URL for document download/preview
 * Returns a temporary URL that expires in 1 hour
 *
 * Query params:
 * - preview=true: Generate URL for inline viewing (no Content-Disposition: attachment)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";
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

    // Get user data - use maybeSingle() to handle cases where user record doesn't exist
    let { data: userData } = await supabase
      .from("users")
      .select("id, user_type, organization_id")
      .eq("auth_id", user.id)
      .maybeSingle();

    // For candidates without a users record (e.g., Vincere/Bubble imports),
    // fall back to email-based candidate lookup
    let emailLookupCandidateId: string | null = null;

    if (!userData && user.email) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select("id, user_id")
        .eq("email", user.email)
        .maybeSingle();

      if (candidateByEmail) {
        emailLookupCandidateId = candidateByEmail.id;
        userData = {
          id: candidateByEmail.user_id || `candidate-${candidateByEmail.id}`,
          organization_id: null,
          user_type: "candidate" as const,
        };
      }
    }

    if (!userData) {
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
      // Get the candidate ID for this user
      let candidateId = emailLookupCandidateId;
      if (!candidateId) {
        const { data: candidateByUserId } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", userData.id)
          .maybeSingle();
        candidateId = candidateByUserId?.id || null;

        if (!candidateId && user.email) {
          const { data: candidateByEmail } = await supabase
            .from("candidates")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();
          candidateId = candidateByEmail?.id || null;
        }
      }

      if (!candidateId || document.entityType !== "candidate" || document.entityId !== candidateId) {
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
      // If no file_path, try to use the file_url directly (legacy/external URLs)
      return NextResponse.json({
        success: true,
        url: document.fileUrl,
        fileName: document.name,
        mimeType: document.mimeType,
        isExternal: true,
      });
    }

    // Generate signed URL from Supabase storage
    // The file_path format is: candidates/{candidateId}/{type}/{filename}
    // For preview mode, we omit the download option to allow inline viewing
    // For download mode, we set download to the filename to force download
    const { data: signedUrlData, error: signedUrlError } = isPreview
      ? await supabase.storage.from("documents").createSignedUrl(document.filePath, 3600)
      : await supabase.storage.from("documents").createSignedUrl(document.filePath, 3600, { download: document.name });

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error generating signed URL:", signedUrlError);

      // Fallback: try to use the file_url if it exists
      if (document.fileUrl) {
        return NextResponse.json({
          success: true,
          url: document.fileUrl,
          fileName: document.name,
          mimeType: document.mimeType,
          isExternal: true,
          warning: "Could not generate signed URL, using fallback",
        });
      }

      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      fileName: document.name,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      expiresIn: 3600, // seconds
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

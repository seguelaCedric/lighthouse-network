import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById, getDocumentVersions } from "@/lib/services/document-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/documents/[id]/versions
 * Get version history for a document
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

    // Get the document to find its entity details
    const docResult = await getDocumentById(documentId);
    if (!docResult.success || !docResult.document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = docResult.document;

    // Check permissions
    // Recruiters can see all documents from their organization
    // Candidates can only see their own documents
    if (userData.user_type === "candidate") {
      if (document.entityType !== "candidate" || document.entityId !== userData.id) {
        return NextResponse.json(
          { error: "You can only view your own documents" },
          { status: 403 }
        );
      }
    } else if (userData.user_type === "recruiter") {
      if (document.organizationId !== userData.organization_id) {
        return NextResponse.json(
          { error: "You can only view documents from your organization" },
          { status: 403 }
        );
      }
    }

    // Get version history
    const versions = await getDocumentVersions(
      document.entityType,
      document.entityId,
      document.documentType
    );

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

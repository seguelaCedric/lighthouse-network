import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveDocument, getDocumentById } from "@/lib/services/document-service";
import { logVerificationEvent, calculateVerificationTier } from "@/lib/verification";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/documents/[id]/approve
 * Approve a pending document (recruiter only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Only recruiters can approve documents
    if (userData.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can approve documents" },
        { status: 403 }
      );
    }

    // Get document details before approval
    const docResult = await getDocumentById(documentId);
    if (!docResult.success || !docResult.document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = docResult.document;

    // Check if document belongs to the same organization
    if (document.organizationId !== userData.organization_id) {
      return NextResponse.json(
        { error: "You can only approve documents from your organization" },
        { status: 403 }
      );
    }

    // Approve the document
    const result = await approveDocument(documentId, userData.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to approve document" },
        { status: 500 }
      );
    }

    // If this is a CV for a candidate, log verification event
    if (document.documentType === "cv" && document.entityType === "candidate") {
      await logVerificationEvent(document.entityId, "cv_approved", {
        performedBy: userData.id,
        metadata: {
          documentId,
          version: document.version,
          cvUrl: document.fileUrl,
        },
      });

      // Recalculate verification tier
      await calculateVerificationTier(document.entityId);
    }

    return NextResponse.json({
      success: true,
      message: "Document approved successfully",
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

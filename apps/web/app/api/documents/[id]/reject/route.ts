import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectDocument, getDocumentById } from "@/lib/services/document-service";
import { documentRejectionSchema } from "@/lib/validations/documents";
import { logVerificationEvent, calculateVerificationTier } from "@/lib/verification";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/documents/[id]/reject
 * Reject a pending document with a reason (recruiter only)
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

    // Only recruiters can reject documents
    if (userData.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can reject documents" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = documentRejectionSchema.safeParse({
      documentId,
      reason: body.reason,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Get document details before rejection
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
        { error: "You can only reject documents from your organization" },
        { status: 403 }
      );
    }

    // Reject the document
    const result = await rejectDocument(documentId, userData.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reject document" },
        { status: 500 }
      );
    }

    // If this is a CV for a candidate, log verification event
    if (document.documentType === "cv" && document.entityType === "candidate") {
      await logVerificationEvent(document.entityId, "cv_rejected", {
        performedBy: userData.id,
        notes: reason,
        metadata: {
          documentId,
          version: document.version,
        },
      });

      // Recalculate verification tier (CV rejection may lower tier)
      await calculateVerificationTier(document.entityId);
    }

    // TODO: Send notification to candidate about rejection
    // await sendDocumentRejectionNotification(document.entityId, document.documentType, reason);

    return NextResponse.json({
      success: true,
      message: "Document rejected successfully",
    });
  } catch (error) {
    console.error("Rejection error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

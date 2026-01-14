import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectDocument, getDocumentById } from "@/lib/services/document-service";
import { documentRejectionSchema } from "@/lib/validations/documents";
import { logVerificationEvent, calculateVerificationTier } from "@/lib/verification";
import { sendEmail, isResendConfigured } from "@/lib/email/client";
import { documentRejectionEmail } from "@/lib/email/templates";

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

    // Check permissions
    if (document.organizationId !== userData.organization_id) {
      // If it's a candidate document, check if the recruiter's agency is linked to the candidate
      if (document.entityType === "candidate" && userData.organization_id) {
        const { data: relationship } = await supabase
          .from("candidate_agency_relationships")
          .select("id")
          .eq("candidate_id", document.entityId)
          .eq("agency_id", userData.organization_id)
          .maybeSingle();

        if (!relationship) {
          return NextResponse.json(
            { error: "You don't have permission to reject this candidate's documents" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "You can only reject documents from your organization" },
          { status: 403 }
        );
      }
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

    // Send notification to candidate about rejection
    if (isResendConfigured() && document.entityType === "candidate") {
      try {
        // Get candidate details
        const { data: candidate } = await supabase
          .from("candidates")
          .select("user_id")
          .eq("id", document.entityId)
          .single();

        if (candidate?.user_id) {
          // Get user email
          const { data: candidateUser } = await supabase
            .from("users")
            .select("email, full_name")
            .eq("id", candidate.user_id)
            .single();

          if (candidateUser?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse-careers.com";
            const emailData = documentRejectionEmail({
              candidateName: candidateUser.full_name || "Candidate",
              documentType: document.documentType,
              documentName: document.name,
              rejectionReason: reason,
              dashboardLink: `${baseUrl}/candidate/documents`,
            });

            await sendEmail({
              to: candidateUser.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
          }
        }
      } catch (emailError) {
        // Log but don't fail the request
        console.error("Failed to send rejection notification:", emailError);
      }
    }

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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/services/document-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/documents/[id]
 * Get a single document by ID
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
    // Recruiters can see all documents from their organization
    // Candidates can only see their own documents
    if (userData.user_type === "candidate") {
      // Get the actual candidate ID for permission check
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

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Soft delete a document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    // Candidates can delete their own pending/rejected documents
    // Recruiters can delete any document from their organization
    if (userData.user_type === "candidate") {
      // Get the actual candidate ID for permission check
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
          { error: "You can only delete your own documents" },
          { status: 403 }
        );
      }
      if (document.status === "approved") {
        return NextResponse.json(
          { error: "You cannot delete approved documents" },
          { status: 403 }
        );
      }
    } else if (userData.user_type === "recruiter") {
      if (document.organizationId !== userData.organization_id) {
        return NextResponse.json(
          { error: "You can only delete documents from your organization" },
          { status: 403 }
        );
      }
    }

    // Soft delete the document
    const { error: deleteError } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", documentId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    // If this was a CV, update candidate status
    if (document.documentType === "cv" && document.entityType === "candidate" && document.isLatestVersion) {
      // Check if there are other CV versions
      const { data: otherCVs } = await supabase
        .from("documents")
        .select("id")
        .eq("entity_type", "candidate")
        .eq("entity_id", document.entityId)
        .eq("document_type", "cv")
        .is("deleted_at", null)
        .neq("id", documentId)
        .limit(1);

      if (!otherCVs || otherCVs.length === 0) {
        // No other CVs, reset candidate CV status
        await supabase
          .from("candidates")
          .update({
            cv_status: "not_uploaded",
            cv_url: null,
            cv_document_id: null,
          })
          .eq("id", document.entityId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

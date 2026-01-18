import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEntityDocuments } from "@/lib/services/document-service";
import type { DocumentType } from "@/lib/validations/documents";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/candidates/[id]/documents
 * Get all documents for a candidate
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("documentType") as DocumentType | null;
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | null;
    const latestOnly = searchParams.get("latestOnly") === "true";

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
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check permissions via candidate_agency_relationships
    // Recruiters can see documents from candidates linked to their organization
    if (userData.organization_id) {
      const { data: relationship } = await supabase
        .from("candidate_agency_relationships")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("agency_id", userData.organization_id)
        .maybeSingle();

      if (!relationship) {
        return NextResponse.json(
          { error: "You can only view documents from candidates in your organization" },
          { status: 403 }
        );
      }
    }

    // Get documents
    const documents = await getEntityDocuments("candidate", candidateId, {
      documentType: documentType || undefined,
      status: status || undefined,
      latestOnly,
    });

    // Group documents by type for easier consumption
    const groupedByType = documents.reduce((acc, doc) => {
      if (!acc[doc.documentType]) {
        acc[doc.documentType] = [];
      }
      acc[doc.documentType].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);

    return NextResponse.json({
      success: true,
      documents,
      groupedByType,
      totalCount: documents.length,
    });
  } catch (error) {
    console.error("Error fetching candidate documents:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

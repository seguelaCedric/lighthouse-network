import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationStatus } from "@/lib/verification";
import type { VerificationStatusResponse } from "@/lib/validations/verification";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]/verification
 * Get verification status for a candidate
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Get user info to check permissions
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, user_id, id_document_url")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check permissions: recruiters can view any, candidates can only view their own
    const isRecruiter = userData?.user_type === "recruiter";
    const isOwnProfile = candidate.user_id === userData?.id;

    if (!isRecruiter && !isOwnProfile) {
      return NextResponse.json(
        { error: "Not authorized to view this candidate's verification" },
        { status: 403 }
      );
    }

    // Get verification status using the service
    const status = await getVerificationStatus(candidateId);

    // Get references with limited info
    const { data: references } = await supabase
      .from("candidate_references")
      .select("id, referee_name, status, relationship, company_vessel")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    const response: VerificationStatusResponse = {
      tier: status.tier,
      checklist: {
        email_verified: status.checks.email_verified,
        cv_uploaded: status.checks.cv_uploaded,
        id_verified: status.checks.id_verified,
        id_pending: !!candidate.id_document_url && !status.checks.id_verified,
        references_verified: status.checks.verified_references_count,
        references_total: references?.length || 0,
        voice_verified: status.checks.voice_verified,
      },
      next_steps: status.nextSteps,
      progress: status.progress,
      references: (references || []).map((ref) => ({
        id: ref.id,
        name: ref.referee_name,
        status: ref.status || "pending",
        relationship: ref.relationship,
        company_vessel: ref.company_vessel,
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "candidates/[id]/verification", operation: "get" },
    });
    console.error("Error getting verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyReferenceSchema,
  contactReferenceSchema,
} from "@/lib/validations/verification";
import { updateReferenceStatus } from "@/lib/verification";

interface RouteParams {
  params: Promise<{ id: string; refId: string }>;
}

/**
 * POST /api/candidates/[id]/references/[refId]/verify
 * Recruiter marks reference as verified/contacted/failed
 * - Updates reference status
 * - Recalculates candidate verification tier
 * - Creates verification event audit log
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId, refId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID formats
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId) || !uuidRegex.test(refId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Get user info - must be a recruiter
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can verify references" },
        { status: 403 }
      );
    }

    // Check if candidate exists
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, verification_tier")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if reference exists
    const { data: existingRef } = await supabase
      .from("candidate_references")
      .select("id, referee_name, status")
      .eq("id", refId)
      .eq("candidate_id", candidateId)
      .single();

    if (!existingRef) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = verifyReferenceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, contacted_via, rating, feedback, would_rehire, notes } =
      parseResult.data;

    // Use the verification service to update status
    const success = await updateReferenceStatus(refId, status, {
      contactedVia: contacted_via,
      rating: rating ?? undefined,
      feedback: feedback ?? undefined,
      wouldRehire: would_rehire ?? undefined,
      notes: notes ?? undefined,
      performedBy: userData.id,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to verify reference" },
        { status: 500 }
      );
    }

    // Get updated reference and candidate tier
    const { data: updatedRef } = await supabase
      .from("candidate_references")
      .select("*")
      .eq("id", refId)
      .single();

    const { data: updatedCandidate } = await supabase
      .from("candidates")
      .select("verification_tier")
      .eq("id", candidateId)
      .single();

    return NextResponse.json({
      data: updatedRef,
      candidate_tier: updatedCandidate?.verification_tier,
      message:
        status === "verified"
          ? "Reference verified successfully"
          : `Reference marked as ${status}`,
    });
  } catch (error) {
    console.error("Error verifying reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/candidates/[id]/references/[refId]/verify
 * Mark reference as contacted (without full verification)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId, refId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID formats
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId) || !uuidRegex.test(refId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Get user info - must be a recruiter
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can update reference status" },
        { status: 403 }
      );
    }

    // Check if reference exists
    const { data: existingRef } = await supabase
      .from("candidate_references")
      .select("id, status")
      .eq("id", refId)
      .eq("candidate_id", candidateId)
      .single();

    if (!existingRef) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = contactReferenceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { contacted_via, notes } = parseResult.data;

    // Update to contacted status
    const success = await updateReferenceStatus(refId, "contacted", {
      contactedVia: contacted_via,
      notes: notes ?? undefined,
      performedBy: userData.id,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update reference" },
        { status: 500 }
      );
    }

    // Get updated reference
    const { data: updatedRef } = await supabase
      .from("candidate_references")
      .select("*")
      .eq("id", refId)
      .single();

    return NextResponse.json({
      data: updatedRef,
      message: "Reference marked as contacted",
    });
  } catch (error) {
    console.error("Error updating reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

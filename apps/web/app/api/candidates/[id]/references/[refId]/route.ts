import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateReferenceSchema } from "@/lib/validations/verification";

interface RouteParams {
  params: Promise<{ id: string; refId: string }>;
}

/**
 * GET /api/candidates/[id]/references/[refId]
 * Get a single reference
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Check if candidate exists and get user_id
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isRecruiter = userData?.user_type === "recruiter";
    const isOwnProfile = candidate.user_id === userData?.id;

    if (!isRecruiter && !isOwnProfile) {
      return NextResponse.json(
        { error: "Not authorized to view this reference" },
        { status: 403 }
      );
    }

    // Select fields based on user type
    const selectFields = isRecruiter
      ? "*"
      : `id, candidate_id, referee_name, referee_position, referee_company,
         referee_email, referee_phone, relationship, company_vessel, dates_worked,
         worked_together_from, worked_together_to, status, is_verified, verified_at,
         reference_text, reference_document_url, overall_rating, rating, would_rehire,
         voice_transcript, voice_summary, created_at, updated_at`;

    // Fetch reference
    const { data, error } = await supabase
      .from("candidate_references")
      .select(selectFields)
      .eq("id", refId)
      .eq("candidate_id", candidateId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error getting reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/candidates/[id]/references/[refId]
 * Update a reference
 * - Candidates can update basic fields on their own references
 * - Recruiters can update any fields
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

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Check if candidate exists
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, user_id")
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

    // Check permissions
    const isRecruiter = userData?.user_type === "recruiter";
    const isOwnProfile = candidate.user_id === userData?.id;

    if (!isRecruiter && !isOwnProfile) {
      return NextResponse.json(
        { error: "Not authorized to update this reference" },
        { status: 403 }
      );
    }

    // Candidates can't update already verified references
    if (!isRecruiter && existingRef.status === "verified") {
      return NextResponse.json(
        { error: "Cannot modify a verified reference" },
        { status: 403 }
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
    const parseResult = updateReferenceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      ...parseResult.data,
      updated_at: new Date().toISOString(),
    };

    // Update reference
    const { data, error } = await supabase
      .from("candidate_references")
      .update(updateData)
      .eq("id", refId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update reference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/candidates/[id]/references/[refId]
 * Delete a reference
 * - Candidates can delete their own unverified references
 * - Recruiters can delete any reference
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Check if candidate exists
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, user_id")
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
      .select("id, status, is_verified")
      .eq("id", refId)
      .eq("candidate_id", candidateId)
      .single();

    if (!existingRef) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isRecruiter = userData?.user_type === "recruiter";
    const isOwnProfile = candidate.user_id === userData?.id;

    if (!isRecruiter && !isOwnProfile) {
      return NextResponse.json(
        { error: "Not authorized to delete this reference" },
        { status: 403 }
      );
    }

    // Candidates can't delete verified references
    if (
      !isRecruiter &&
      (existingRef.status === "verified" || existingRef.is_verified)
    ) {
      return NextResponse.json(
        { error: "Cannot delete a verified reference" },
        { status: 403 }
      );
    }

    // Delete reference
    const { error } = await supabase
      .from("candidate_references")
      .delete()
      .eq("id", refId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete reference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Reference deleted" });
  } catch (error) {
    console.error("Error deleting reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

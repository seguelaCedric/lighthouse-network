import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReferenceSchema } from "@/lib/validations/verification";
import { addReference, logVerificationEvent } from "@/lib/verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]/references
 * List all references for a candidate
 * - Candidates see limited view (no internal notes)
 * - Recruiters see full view
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      .select("id, user_id")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
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
        { error: "Not authorized to view these references" },
        { status: 403 }
      );
    }

    // Select fields based on user type
    // Candidates don't see: notes, feedback (internal), verified_by
    const selectFields = isRecruiter
      ? "*"
      : `id, candidate_id, referee_name, referee_position, referee_company,
         referee_email, referee_phone, relationship, company_vessel, dates_worked,
         worked_together_from, worked_together_to, status, is_verified, verified_at,
         reference_text, reference_document_url, overall_rating, rating, would_rehire,
         voice_transcript, voice_summary, created_at, updated_at`;

    // Fetch references
    const { data, error } = await supabase
      .from("candidate_references")
      .select(selectFields)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch references" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/candidates/[id]/references
 * Add a new reference for a candidate
 * - Candidates can add their own references
 * - Recruiters can add references for any candidate
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      .select("id, user_id, first_name, last_name")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
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
        { error: "Not authorized to add references for this candidate" },
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
    const parseResult = createReferenceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Use the verification service to add reference
    const reference = await addReference({
      candidateId,
      refereeName: parseResult.data.referee_name,
      refereeEmail: parseResult.data.referee_email,
      refereePhone: parseResult.data.referee_phone,
      relationship: parseResult.data.relationship,
      companyVessel: parseResult.data.company_vessel,
      datesWorked: parseResult.data.dates_worked,
      performedBy: isRecruiter ? userData?.id : undefined,
    });

    if (!reference) {
      return NextResponse.json(
        { error: "Failed to create reference" },
        { status: 500 }
      );
    }

    // If additional fields were provided (from legacy schema), update them
    if (
      parseResult.data.referee_position ||
      parseResult.data.referee_company ||
      parseResult.data.worked_together_from ||
      parseResult.data.worked_together_to
    ) {
      await supabase
        .from("candidate_references")
        .update({
          referee_position: parseResult.data.referee_position,
          referee_company: parseResult.data.referee_company,
          worked_together_from: parseResult.data.worked_together_from,
          worked_together_to: parseResult.data.worked_together_to,
        })
        .eq("id", reference.id);
    }

    // Fetch the complete reference
    const { data: fullReference } = await supabase
      .from("candidate_references")
      .select("*")
      .eq("id", reference.id)
      .single();

    return NextResponse.json({ data: fullReference }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

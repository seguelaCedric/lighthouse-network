import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  initiateVoiceVerificationSchema,
  completeVoiceVerificationSchema,
} from "@/lib/validations/verification";
import { completeVoiceVerification, logVerificationEvent } from "@/lib/verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]/voice-verification
 * Get voice verification status for a candidate
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

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Get candidate voice verification data
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, user_id, voice_verified_at, voice_verification_id")
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
        { error: "Not authorized to view voice verification status" },
        { status: 403 }
      );
    }

    // Build response
    const response = {
      is_verified: !!candidate.voice_verified_at,
      verified_at: candidate.voice_verified_at,
      call_id: candidate.voice_verification_id,
      status: candidate.voice_verified_at
        ? "completed"
        : candidate.voice_verification_id
          ? "in_progress"
          : "not_started",
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error getting voice verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/candidates/[id]/voice-verification
 * Initiate a voice verification call via Vapi
 * - Recruiter initiates for a candidate
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

    // Get user info - must be a recruiter
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can initiate voice verification" },
        { status: 403 }
      );
    }

    // Get candidate
    const { data: candidate } = await supabase
      .from("candidates")
      .select(
        "id, first_name, last_name, phone, whatsapp, voice_verified_at"
      )
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (candidate.voice_verified_at) {
      return NextResponse.json(
        { error: "Candidate already has voice verification completed" },
        { status: 400 }
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
    const parseResult = initiateVoiceVerificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { phone_number } = parseResult.data;

    // TODO: Integrate with Vapi to initiate call
    // For now, we'll create a placeholder call_id
    // In production, this would call the Vapi API

    // Example Vapi integration (commented out):
    // const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     assistantId: process.env.VAPI_VERIFICATION_ASSISTANT_ID,
    //     phoneNumber: {
    //       number: phone_number,
    //     },
    //     metadata: {
    //       candidateId,
    //       candidateName: `${candidate.first_name} ${candidate.last_name}`,
    //       initiatedBy: userData.id,
    //     },
    //   }),
    // });

    // Placeholder: Generate a mock call_id
    const callId = `vapi_${Date.now()}_${candidateId.slice(0, 8)}`;

    // Store the call_id on the candidate (marks as in-progress)
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        voice_verification_id: callId,
        verification_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to initiate voice verification" },
        { status: 500 }
      );
    }

    // Log event
    await logVerificationEvent(candidateId, "voice_completed", {
      newValue: callId,
      performedBy: userData.id,
      notes: "Voice verification call initiated",
      metadata: { phone_number, status: "initiated" },
    });

    return NextResponse.json({
      message: "Voice verification call initiated",
      call_id: callId,
      status: "initiated",
      phone_number,
      note: "Vapi integration pending - call_id is a placeholder",
    });
  } catch (error) {
    console.error("Error initiating voice verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/candidates/[id]/voice-verification
 * Complete voice verification (called by webhook or manually)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Get user info - must be a recruiter or system
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can complete voice verification" },
        { status: 403 }
      );
    }

    // Get candidate
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, voice_verification_id, voice_verified_at")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
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
    const parseResult = completeVoiceVerificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { call_id, status, transcript, summary } = parseResult.data;

    if (status === "completed") {
      // Mark voice verification as complete
      const success = await completeVoiceVerification(
        candidateId,
        call_id,
        userData.id
      );

      if (!success) {
        return NextResponse.json(
          { error: "Failed to complete voice verification" },
          { status: 500 }
        );
      }

      // Get updated tier
      const { data: updated } = await supabase
        .from("candidates")
        .select("verification_tier")
        .eq("id", candidateId)
        .single();

      return NextResponse.json({
        message: "Voice verification completed successfully",
        status: "completed",
        candidate_tier: updated?.verification_tier,
      });
    } else {
      // Call failed or no answer - clear the call_id
      const { error } = await supabase
        .from("candidates")
        .update({
          voice_verification_id: null,
          verification_updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to update verification status" },
          { status: 500 }
        );
      }

      // Log the failed attempt
      await logVerificationEvent(candidateId, "voice_completed", {
        oldValue: candidate.voice_verification_id,
        newValue: null,
        performedBy: userData.id,
        notes: `Voice verification ${status}: ${summary || "No details"}`,
        metadata: { call_id, status, transcript },
      });

      return NextResponse.json({
        message: `Voice verification ${status}`,
        status,
      });
    }
  } catch (error) {
    console.error("Error completing voice verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadIdDocumentSchema,
  reviewIdVerificationSchema,
} from "@/lib/validations/verification";
import {
  uploadIdDocument,
  verifyId,
  logVerificationEvent,
} from "@/lib/verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]/id-verification
 * Get ID verification status for a candidate
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

    // Get candidate ID verification data
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(
        "id, user_id, id_document_url, id_verified_at, id_verification_notes"
      )
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
        { error: "Not authorized to view ID verification status" },
        { status: 403 }
      );
    }

    // Build response
    const response = {
      has_document: !!candidate.id_document_url,
      document_url: isRecruiter ? candidate.id_document_url : undefined, // Only recruiters see URL
      is_verified: !!candidate.id_verified_at,
      verified_at: candidate.id_verified_at,
      status: candidate.id_verified_at
        ? "verified"
        : candidate.id_document_url
          ? "pending_review"
          : "not_submitted",
      notes: isRecruiter ? candidate.id_verification_notes : undefined,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error getting ID verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/candidates/[id]/id-verification
 * Upload ID document for verification
 * - Candidates can upload their own ID
 * - Recruiters can upload for any candidate
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

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    // Get candidate
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
        { error: "Not authorized to upload ID for this candidate" },
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
    const parseResult = uploadIdDocumentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Upload ID document using verification service
    const success = await uploadIdDocument(
      candidateId,
      parseResult.data.document_url
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to upload ID document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "ID document uploaded successfully",
      status: "pending_review",
    });
  } catch (error) {
    console.error("Error uploading ID document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/candidates/[id]/id-verification
 * Recruiter approves or rejects ID verification
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

    // Get user info - must be a recruiter
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can approve ID verification" },
        { status: 403 }
      );
    }

    // Get candidate
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, id_document_url, verification_tier")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if ID document was uploaded
    if (!candidate.id_document_url) {
      return NextResponse.json(
        { error: "No ID document has been uploaded" },
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
    const parseResult = reviewIdVerificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { approved, notes } = parseResult.data;

    if (approved) {
      // Approve ID verification
      const success = await verifyId(candidateId, {
        notes: notes ?? undefined,
        performedBy: userData.id,
      });

      if (!success) {
        return NextResponse.json(
          { error: "Failed to verify ID" },
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
        message: "ID verified successfully",
        status: "verified",
        candidate_tier: updated?.verification_tier,
      });
    } else {
      // Reject ID - clear the document and add notes
      const { error } = await supabase
        .from("candidates")
        .update({
          id_document_url: null,
          id_verification_notes: notes,
          verification_updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to reject ID" },
          { status: 500 }
        );
      }

      // Log the rejection event
      await logVerificationEvent(candidateId, "id_uploaded", {
        oldValue: candidate.id_document_url,
        newValue: null,
        performedBy: userData.id,
        notes: `ID rejected: ${notes || "No reason provided"}`,
      });

      return NextResponse.json({
        message: "ID rejected",
        status: "rejected",
        notes,
      });
    }
  } catch (error) {
    console.error("Error reviewing ID verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

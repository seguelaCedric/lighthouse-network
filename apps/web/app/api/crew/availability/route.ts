import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema for updating availability
const updateAvailabilitySchema = z.object({
  availability_status: z.enum([
    "available",
    "actively_looking",
    "open_to_offers",
    "not_looking",
    "employed",
  ]),
  available_from: z.string().nullable().optional(),
});

/**
 * PATCH /api/crew/availability
 *
 * Quick toggle for candidate availability status.
 * This is a simplified endpoint for updating just availability.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to update your availability" },
        { status: 401 }
      );
    }

    // Get the user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get candidate linked to this user
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, first_name, last_name")
      .eq("user_id", userData.id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "No candidate profile found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = updateAvailabilitySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { availability_status, available_from } = parseResult.data;

    // Update candidate availability
    const { data: updatedCandidate, error: updateError } = await supabase
      .from("candidates")
      .update({
        availability_status,
        available_from: available_from || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id)
      .select("id, availability_status, available_from")
      .single();

    if (updateError) {
      console.error("Failed to update availability:", updateError);
      return NextResponse.json(
        { error: "Failed to update availability" },
        { status: 500 }
      );
    }

    // Log the activity (fire and forget)
    supabase
      .from("activity_logs")
      .insert({
        entity_type: "candidate",
        entity_id: candidate.id,
        action: "availability_updated",
        details: {
          new_status: availability_status,
          available_from,
        },
        performed_by: userData.id,
      })
      .then(() => {}, (err) => console.error("Failed to log activity:", err));

    return NextResponse.json({
      data: updatedCandidate,
      message: `Availability updated to ${availability_status}`,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crew/availability
 *
 * Get the authenticated candidate's current availability status.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to view your availability" },
        { status: 401 }
      );
    }

    // Get the user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get candidate linked to this user
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, availability_status, available_from")
      .eq("user_id", userData.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "No candidate profile found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        availability_status: candidate.availability_status,
        available_from: candidate.available_from,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

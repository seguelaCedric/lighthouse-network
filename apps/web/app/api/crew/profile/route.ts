import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema for updating profile
const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  nationality: z.string().max(50).optional(),
  date_of_birth: z.string().optional(),
  current_location: z.string().max(200).optional(),
  candidate_type: z.enum(["yacht_crew", "household_staff", "both", "other"]).optional(),
  primary_position: z.string().max(100).optional(),
  secondary_position: z.string().max(100).optional(),
  years_experience: z.number().int().min(0).max(50).optional(),
  bio: z.string().max(5000).optional(),
  preferred_yacht_types: z.array(z.string()).optional(),
  preferred_yacht_size_min: z.number().int().min(0).optional(),
  preferred_yacht_size_max: z.number().int().min(0).optional(),
  preferred_regions: z.array(z.string()).optional(),
  preferred_contract_types: z.array(z.string()).optional(),
  salary_expectation_min: z.number().int().min(0).optional(),
  salary_expectation_max: z.number().int().min(0).optional(),
  salary_currency: z.string().max(3).optional(),
  smoker: z.boolean().optional(),
  visible_tattoos: z.boolean().optional(),
  tattoo_description: z.string().max(500).optional(),
});

/**
 * GET /api/crew/profile
 *
 * Get the authenticated candidate's profile.
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
        { error: "You must be logged in to view your profile" },
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
      .select(
        `
        *,
        documents:documents!documents_entity_id_fkey (
          id,
          document_type,
          file_url,
          file_name,
          created_at
        ),
        certifications (
          id,
          certification_type,
          name,
          issuing_authority,
          certificate_number,
          issue_date,
          expiry_date,
          document_url
        )
      `
      )
      .eq("user_id", userData.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "No candidate profile found" },
        { status: 404 }
      );
    }

    // Filter documents to only show candidate documents
    const documents = candidate.documents?.filter(
      (doc: { id: string }) => doc.id
    ) || [];

    return NextResponse.json({
      data: {
        ...candidate,
        documents,
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

/**
 * PATCH /api/crew/profile
 *
 * Update the authenticated candidate's profile.
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
        { error: "You must be logged in to update your profile" },
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
      .select("id")
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
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // Update candidate profile
    const { data: updatedCandidate, error: updateError } = await supabase
      .from("candidates")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedCandidate,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

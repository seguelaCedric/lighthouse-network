import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCandidateSchema } from "@/lib/validations/candidate";
import type { CandidateWithRelations } from "@lighthouse/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Fetch candidate with certifications and references
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (candidateError) {
      if (candidateError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Candidate not found" },
          { status: 404 }
        );
      }
      console.error("Database error:", candidateError);
      return NextResponse.json(
        { error: "Failed to fetch candidate" },
        { status: 500 }
      );
    }

    // Fetch certifications
    const { data: certifications, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("candidate_id", id)
      .order("created_at", { ascending: false });

    if (certError) {
      console.error("Error fetching certifications:", certError);
    }

    // Fetch references
    const { data: references, error: refError } = await supabase
      .from("candidate_references")
      .select("*")
      .eq("candidate_id", id)
      .order("created_at", { ascending: false });

    if (refError) {
      console.error("Error fetching references:", refError);
    }

    const response: CandidateWithRelations = {
      ...candidate,
      certifications: certifications ?? [],
      references: references ?? [],
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate input
    const parseResult = updateCandidateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    // Check if candidate exists and not deleted
    const { data: existing, error: existsError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (existsError || !existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Update candidate
    const { data, error } = await supabase
      .from("candidates")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update candidate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Check query param for hard delete
    const hardDelete = request.nextUrl.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete - completely remove from database
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to delete candidate" },
          { status: 500 }
        );
      }
    } else {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from("candidates")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to archive candidate" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: hardDelete ? "Candidate deleted" : "Candidate archived" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

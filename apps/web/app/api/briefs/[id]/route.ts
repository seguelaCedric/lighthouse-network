import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateBriefSchema } from "@/lib/validations/brief";
import type { Brief } from "../../../../../../packages/database/types";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid brief ID format" },
        { status: 400 }
      );
    }

    // Fetch brief with all data including parsed_data
    const { data: brief, error: briefError } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .single();

    if (briefError) {
      if (briefError.code === "PGRST116") {
        return NextResponse.json({ error: "Brief not found" }, { status: 404 });
      }
      console.error("Database error:", briefError);
      return NextResponse.json(
        { error: "Failed to fetch brief" },
        { status: 500 }
      );
    }

    // Optionally fetch client info if client_id exists
    let client = null;
    if (brief.client_id) {
      const { data: clientData } = await supabase
        .from("organizations")
        .select("id, name, vessel_name, vessel_type, vessel_size_meters")
        .eq("id", brief.client_id)
        .single();
      client = clientData;
    }

    // Optionally fetch converted job if exists
    let convertedJob = null;
    if (brief.converted_to_job_id) {
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, status")
        .eq("id", brief.converted_to_job_id)
        .single();
      convertedJob = jobData;
    }

    const response: Brief & { client?: typeof client; converted_job?: typeof convertedJob } = {
      ...brief,
      client,
      converted_job: convertedJob,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid brief ID format" },
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
    const parseResult = updateBriefSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    // Check if brief exists
    const { data: existing, error: existsError } = await supabase
      .from("briefs")
      .select("id, parsed_data")
      .eq("id", id)
      .single();

    if (existsError || !existing) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    // If updating parsed_data, merge with existing
    let finalParsedData = existing.parsed_data;
    if (updateData.parsed_data) {
      finalParsedData = {
        ...existing.parsed_data,
        ...updateData.parsed_data,
      };
    }

    // Update brief
    const { data, error } = await supabase
      .from("briefs")
      .update({
        ...updateData,
        parsed_data: finalParsedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update brief" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid brief ID format" },
        { status: 400 }
      );
    }

    // Delete brief
    const { error } = await supabase.from("briefs").delete().eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Brief deleted" }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

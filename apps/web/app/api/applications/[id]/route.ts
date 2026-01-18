import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for updating an application
const updateApplicationSchema = z.object({
  stage: z
    .enum([
      "shortlisted",
      "submitted",
      "reviewing",
      "interview",
      "offer",
      "placed",
      "rejected",
      "withdrawn",
    ])
    .optional(),
  client_feedback: z.string().optional(),
  internal_notes: z.string().optional(),
  rejection_reason: z.string().optional(),
  interview_date: z.string().datetime().optional(),
  submitted_at: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    // Fetch application with candidate and job details
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          photo_url,
          primary_position,
          verification_tier
        ),
        job:jobs (
          id,
          title,
          vessel_name,
          client:organizations!jobs_client_id_fkey (
            id,
            name
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "applications/[id]", operation: "get" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
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
    const parseResult = updateApplicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    // Check if application exists
    const { data: existing, error: fetchError } = await supabase
      .from("applications")
      .select("id, stage")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // If stage is changing to 'submitted' and no submitted_at, set it
    if (
      updateData.stage === "submitted" &&
      existing.stage !== "submitted" &&
      !updateData.submitted_at
    ) {
      updates.submitted_at = new Date().toISOString();
    }

    // Update application
    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          primary_position,
          verification_tier
        )
      `
      )
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "applications/[id]", operation: "update" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    // Delete application
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete application" },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "applications/[id]", operation: "delete" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

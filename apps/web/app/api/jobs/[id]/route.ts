import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateJobSchema } from "@/lib/validations/job";
import type { JobWithStats, ApplicationStage } from "@lighthouse/database";

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
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      console.error("Database error:", jobError);
      return NextResponse.json(
        { error: "Failed to fetch job" },
        { status: 500 }
      );
    }

    // Get application counts by stage
    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("stage")
      .eq("job_id", id);

    if (appError) {
      console.error("Error fetching applications:", appError);
    }

    // Count applications by stage
    const stageCounts: Record<ApplicationStage, number> = {
      applied: 0,
      screening: 0,
      shortlisted: 0,
      submitted: 0,
      interview: 0,
      offer: 0,
      placed: 0,
      rejected: 0,
    };

    let total = 0;
    if (applications) {
      for (const app of applications) {
        const stage = app.stage as ApplicationStage;
        if (stage in stageCounts) {
          stageCounts[stage]++;
          total++;
        }
      }
    }

    const response: JobWithStats = {
      ...job,
      application_counts: {
        total,
        by_stage: stageCounts,
      },
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
        { error: "Invalid job ID format" },
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
    const parseResult = updateJobSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    // Check if job exists and not deleted
    const { data: existing, error: existsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (existsError || !existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update job
    const { data, error } = await supabase
      .from("jobs")
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
        { error: "Failed to update job" },
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
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Check query param for hard delete
    const hardDelete = request.nextUrl.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete - completely remove from database
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to delete job" },
          { status: 500 }
        );
      }
    } else {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from("jobs")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to archive job" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: hardDelete ? "Job deleted" : "Job archived" },
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

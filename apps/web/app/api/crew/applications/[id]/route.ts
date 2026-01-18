import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for withdrawing an application
const withdrawSchema = z.object({
  reason: z
    .string()
    .max(1000, "Reason must be less than 1000 characters")
    .optional(),
});

/**
 * GET /api/crew/applications/[id]
 *
 * Get details of a specific application for the authenticated candidate.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to view this application" },
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
        { status: 403 }
      );
    }

    // Fetch the application (ensuring it belongs to this candidate)
    const { data: application, error } = await supabase
      .from("applications")
      .select(
        `
        id,
        stage,
        source,
        match_score,
        match_breakdown,
        ai_assessment,
        applied_at,
        created_at,
        interview_requested_at,
        interview_scheduled_at,
        interview_notes,
        placed_at,
        rejection_reason,
        withdrawn_reason,
        job:jobs (
          id,
          title,
          vessel_type,
          vessel_size_meters,
          primary_region,
          contract_type,
          rotation_schedule,
          salary_min,
          salary_max,
          salary_currency,
          salary_period,
          benefits,
          requirements,
          requirements_text,
          start_date,
          end_date,
          status,
          is_public,
          is_urgent,
          created_by_agency:organizations!jobs_created_by_agency_id_fkey (
            id,
            name
          )
        )
      `
      )
      .eq("id", id)
      .eq("candidate_id", candidate.id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/applications/[id]", operation: "get" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crew/applications/[id]
 *
 * Withdraw an application. Candidates can only withdraw applications
 * that are still in early stages (not yet interviewing or later).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to withdraw an application" },
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
        { status: 403 }
      );
    }

    // Parse request body for withdrawal reason
    let reason: string | undefined;
    try {
      const body = await request.json();
      const parseResult = withdrawSchema.safeParse(body);
      if (parseResult.success) {
        reason = parseResult.data.reason;
      }
    } catch {
      // No body is fine
    }

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, stage, job_id, agency_id, job:jobs(title)")
      .eq("id", id)
      .eq("candidate_id", candidate.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can be withdrawn
    const nonWithdrawableStages = ["interview", "offer", "placed", "rejected"];
    if (nonWithdrawableStages.includes(application.stage)) {
      return NextResponse.json(
        {
          error: `Cannot withdraw application in '${application.stage}' stage. Please contact the agency directly.`,
        },
        { status: 400 }
      );
    }

    // Update the application to withdrawn status
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        stage: "rejected", // Using rejected as there's no "withdrawn" stage
        withdrawn_reason: reason || "Withdrawn by candidate",
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to withdraw application:", updateError);
      return NextResponse.json(
        { error: "Failed to withdraw application" },
        { status: 500 }
      );
    }

    // Notify the agency (fire and forget)
    const jobTitle = (application.job as unknown as { title: string } | null)?.title || "Unknown Position";
    supabase
      .from("alerts")
      .insert({
        organization_id: application.agency_id,
        type: "application_withdrawn",
        title: "Application Withdrawn",
        message: `${candidate.first_name} ${candidate.last_name} withdrew their application for ${jobTitle}`,
        entity_type: "application",
        entity_id: application.id,
        action_url: `/jobs/${application.job_id}/applications`,
        priority: "normal",
      })
      .then(() => {}, (err) => console.error("Failed to create alert:", err));

    return NextResponse.json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/applications/[id]", operation: "withdraw" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

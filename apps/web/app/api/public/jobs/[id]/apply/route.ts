import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyToJobSchema } from "@/lib/validations/public-job";

/**
 * POST /api/public/jobs/[id]/apply
 *
 * Apply to a job as an authenticated candidate.
 * Requires candidate to be logged in (has user account linked to candidate profile).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Check authentication - candidate must be logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to apply for jobs" },
        { status: 401 }
      );
    }

    // Get the candidate profile linked to this user
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
      .select("id, first_name, last_name, email")
      .eq("user_id", userData.id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "You must have a candidate profile to apply for jobs. Please complete your profile first." },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {}; // Empty body is fine, cover letter is optional
    }

    const parseResult = applyToJobSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { cover_letter } = parseResult.data;

    // Verify job exists, is public, and is open
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, created_by_agency_id, is_public, status, apply_deadline")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.is_public) {
      return NextResponse.json(
        { error: "This job is not open for public applications" },
        { status: 403 }
      );
    }

    if (job.status !== "open") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    if (job.apply_deadline && new Date(job.apply_deadline) < new Date()) {
      return NextResponse.json(
        { error: "The application deadline has passed" },
        { status: 400 }
      );
    }

    // Check for duplicate application (same job, same candidate)
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidate.id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        {
          error: "You have already applied for this position",
          application_id: existingApplication.id
        },
        { status: 409 }
      );
    }

    // Create the application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidate.id,
        agency_id: job.created_by_agency_id,
        source: "job_board",
        stage: "applied",
        internal_notes: cover_letter || null,
        created_by: userData.id,
        applied_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (appError || !application) {
      console.error("Failed to create application:", appError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Increment applications_count on job (fire and forget)
    supabase
      .from("jobs")
      .update({ applications_count: (job as { applications_count?: number }).applications_count ?? 0 + 1 })
      .eq("id", jobId)
      .then(() => {}, (err) => console.error("Failed to increment applications count:", err));

    // Create alert/notification for agency recruiters
    const { data: agencyUsers } = await supabase
      .from("users")
      .select("id")
      .eq("organization_id", job.created_by_agency_id)
      .in("role", ["owner", "admin", "recruiter"])
      .limit(10);

    if (agencyUsers && agencyUsers.length > 0) {
      const alerts = agencyUsers.map((u) => ({
        user_id: u.id,
        organization_id: job.created_by_agency_id,
        type: "new_application",
        title: "New Job Application",
        message: `${candidate.first_name} ${candidate.last_name} applied for ${job.title}`,
        entity_type: "application",
        entity_id: application.id,
        action_url: `/jobs/${jobId}/applications`,
        priority: "normal",
      }));

      supabase
        .from("alerts")
        .insert(alerts)
        .then(() => {}, (err) => console.error("Failed to create alerts:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        application_id: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

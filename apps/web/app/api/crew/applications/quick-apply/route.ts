// ============================================================================
// QUICK APPLY API - 1-Click Job Application for Candidates
// ============================================================================
// Allows authenticated candidates with complete profiles to apply to jobs
// with a single click, auto-submitting their existing profile data.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkProfileCompleteness } from "@lighthouse/ai/matcher";

// ----------------------------------------------------------------------------
// REQUEST SCHEMA
// ----------------------------------------------------------------------------

const requestSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

// ----------------------------------------------------------------------------
// POST HANDLER
// ----------------------------------------------------------------------------

/**
 * POST /api/crew/applications/quick-apply
 *
 * Creates a job application for the authenticated candidate.
 * Requires:
 * - User to be logged in with a candidate profile
 * - Profile to be at least 70% complete
 * - Job to be open and accepting applications
 * - No existing application for this job
 *
 * Body: { jobId: "uuid" }
 *
 * Returns:
 * - Success: { success: true, applicationId: "uuid" }
 * - Profile incomplete: { error: "profile_incomplete", missingFields: [...], completeness: 65 }
 * - Already applied: { error: "already_applied", applicationId: "uuid" }
 * - Job not found/closed: { error: "job_not_available" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
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

    // Candidate select fields
    const candidateSelectFields = `
      id, first_name, last_name, email, phone,
      primary_position, yacht_primary_position, household_primary_position,
      secondary_positions, years_experience,
      preferred_yacht_types, preferred_yacht_size_min, preferred_yacht_size_max,
      preferred_regions, preferred_contract_types,
      household_locations, living_arrangement,
      desired_salary_min, desired_salary_max, salary_currency,
      availability_status, available_from,
      has_stcw, stcw_expiry, has_eng1, eng1_expiry, highest_license,
      has_schengen, has_b1b2, has_c1d,
      nationality, second_nationality,
      is_smoker, has_visible_tattoos, is_couple, partner_position,
      verification_tier, embedding, bio
    `;

    // Get user record (auth_id -> user_id mapping)
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    let candidate = null;
    let userId = userData?.id;

    // Try to find candidate by user_id if user record exists
    if (userData) {
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("user_id", userData.id)
        .single();

      candidate = candidateByUserId;
    }

    // Fallback: Try to find candidate by email (for Vincere-imported candidates)
    if (!candidate && user.email) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("email", user.email)
        .single();

      candidate = candidateByEmail;

      // If found by email, get/create the user_id link
      if (candidateByEmail?.id && !userId) {
        // Use candidate ID as fallback for userId in application
        userId = candidateByEmail.id;
      }
    }

    if (!candidate) {
      return NextResponse.json(
        {
          error: "profile_incomplete",
          message: "No candidate profile found. Please complete your profile first.",
          missingFields: ["profile"],
          completeness: 0,
        },
        { status: 403 }
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

    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { jobId } = parseResult.data;

    // Check profile completeness (minimum 70% required)
    const profileStatus = checkProfileCompleteness(candidate);

    if (!profileStatus.canQuickApply) {
      return NextResponse.json(
        {
          error: "profile_incomplete",
          message: `Your profile is ${profileStatus.completeness}% complete. You need at least 70% to quick apply.`,
          missingFields: profileStatus.missingFields,
          completeness: profileStatus.completeness,
        },
        { status: 403 }
      );
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, status, created_by_agency_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      // Also check public_jobs table
      const { data: publicJob, error: publicJobError } = await supabase
        .from("public_jobs")
        .select("id, title, status, created_by_agency_id")
        .eq("id", jobId)
        .single();

      if (publicJobError || !publicJob) {
        return NextResponse.json(
          { error: "job_not_available", message: "Job not found" },
          { status: 404 }
        );
      }

      // Use public job data
      if (publicJob.status !== "open" && publicJob.status !== "active") {
        return NextResponse.json(
          {
            error: "job_not_available",
            message: "This job is no longer accepting applications",
          },
          { status: 400 }
        );
      }

      // Continue with public job
      return await createApplication(
        supabase,
        candidate,
        publicJob,
        userId!
      );
    }

    // Check job status
    if (job.status !== "open" && job.status !== "active") {
      return NextResponse.json(
        {
          error: "job_not_available",
          message: "This job is no longer accepting applications",
        },
        { status: 400 }
      );
    }

    return await createApplication(supabase, candidate, job, userId!);
  } catch (error) {
    console.error("Quick apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

async function createApplication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  candidate: { id: string },
  job: { id: string; title: string; created_by_agency_id: string | null },
  userId: string
) {
  // Check for existing application
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id, stage, applied_at")
    .eq("candidate_id", candidate.id)
    .eq("job_id", job.id)
    .single();

  if (existingApplication) {
    return NextResponse.json(
      {
        error: "already_applied",
        message: "You have already applied to this job",
        applicationId: existingApplication.id,
        appliedAt: existingApplication.applied_at,
        stage: existingApplication.stage,
      },
      { status: 409 }
    );
  }

  // Determine the agency_id (use job's agency or default)
  // For public jobs without agency, we need a default agency
  const agencyId = job.created_by_agency_id || await getDefaultAgencyId(supabase);

  if (!agencyId) {
    return NextResponse.json(
      { error: "Unable to process application - no agency configured" },
      { status: 500 }
    );
  }

  // Create the application
  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      candidate_id: candidate.id,
      job_id: job.id,
      agency_id: agencyId,
      stage: "applied",
      source: "quick_apply",
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, stage, applied_at")
    .single();

  if (insertError) {
    console.error("Failed to create application:", insertError);

    // Check if it's a duplicate key error
    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          error: "already_applied",
          message: "You have already applied to this job",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    applicationId: application.id,
    jobTitle: job.title,
    appliedAt: application.applied_at,
    stage: application.stage,
    message: "Application submitted successfully!",
  });
}

async function getDefaultAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  // Get the first/default agency (typically the main agency)
  const { data: agency } = await supabase
    .from("organizations")
    .select("id")
    .eq("type", "agency")
    .limit(1)
    .single();

  return agency?.id || null;
}

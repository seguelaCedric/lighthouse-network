// ============================================================================
// QUICK APPLY API - 1-Click Job Application for Candidates
// ============================================================================
// Allows authenticated candidates with complete profiles to apply to jobs
// with a single click, auto-submitting their existing profile data.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { syncJobApplication } from "@/lib/vincere/sync-service";

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
    const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";
    const isDev = process.env.NODE_ENV !== "production";

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
    if (!user.email) {
      return NextResponse.json(
        { error: "missing_email", message: "Please add an email to your account before applying." },
        { status: 400 }
      );
    }

    // Candidate select fields
    const candidateSelectFields = `
      id, user_id, first_name, last_name, email, phone,
      date_of_birth, nationality, current_location,
      candidate_type, primary_position, yacht_primary_position, household_primary_position,
      secondary_positions, years_experience,
      preferred_yacht_types, preferred_yacht_size_min, preferred_yacht_size_max,
      preferred_regions, preferred_contract_types,
      household_locations, living_arrangement,
      desired_salary_min, desired_salary_max, salary_currency,
      availability_status, available_from,
      has_stcw, stcw_expiry, has_eng1, eng1_expiry, highest_license,
      has_schengen, has_b1b2, has_c1d,
      industry_preference, second_nationality,
      is_smoker, has_visible_tattoos, is_couple, partner_position,
      verification_tier, avatar_url, embedding,
      vincere_id, created_at
    `;

    // Get user record (auth_id -> user_id mapping)
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, user_type")
      .eq("auth_id", user.id)
      .maybeSingle();

    let candidate = null;
    let userId = userData?.id;
    let candidateSource: "user_id" | "email" | "created" | "none" = "none";
    let userUpserted = false;
    let candidateByUserIdError: unknown = null;
    let candidateByEmailError: unknown = null;
    let candidateByAuthIdError: unknown = null;
    let createCandidateError: unknown = null;
    const userMetadata = (user.user_metadata || {}) as Record<string, unknown>;
    const email = user.email.toLowerCase();
    const metaFirst = typeof userMetadata.first_name === "string" ? userMetadata.first_name : null;
    const metaLast = typeof userMetadata.last_name === "string" ? userMetadata.last_name : null;
    const metaFull = typeof userMetadata.full_name === "string" ? userMetadata.full_name : null;
    const emailLocalPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, " ").trim();
    const nameParts = emailLocalPart ? emailLocalPart.split(" ").filter(Boolean) : [];
    const derivedFirst = metaFirst || nameParts[0] || "Candidate";
    const derivedLast = metaLast || nameParts.slice(1).join(" ") || "Profile";

    if (!userId) {
      const { data: createdUser, error: createUserError } = await supabase
        .from("users")
        .upsert(
          {
            auth_id: user.id,
            email,
            first_name: derivedFirst,
            last_name: derivedLast,
            phone: (userMetadata.phone as string) || null,
            user_type: "candidate",
            organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
            is_active: true,
          },
          { onConflict: "auth_id" }
        )
        .select("id")
        .single();

      if (!createUserError && createdUser?.id) {
        userId = createdUser.id;
        userUpserted = true;
      } else if (createUserError) {
        console.error("Quick apply user upsert failed:", createUserError);
      }
    }

    // Try to find candidate by user_id if user record exists
    if (userId) {
      const { data: candidateByUserId, error } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("user_id", userId)
        .single();

      candidate = candidateByUserId;
      candidateByUserIdError = error;
      if (candidate) {
        candidateSource = "user_id";
      }
    }

    // Fallback: Try to find candidate by email (for Vincere-imported candidates)
    if (!candidate && user.email) {
      const { data: candidateByEmail, error } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .ilike("email", email)
        .single();

      candidate = candidateByEmail;
      candidateByEmailError = error;
      if (candidate) {
        candidateSource = "email";
      }

      // If found by email, link user_id when possible
      if (candidateByEmail?.id && userId) {
        if (!candidateByEmail.user_id) {
          await supabase
            .from("candidates")
            .update({ user_id: userId })
            .eq("id", candidateByEmail.id);
        }
      } else if (candidateByEmail?.id && !userId) {
        userId = candidateByEmail.id;
      }
    }

    if (!candidate) {
      const { data: candidateByAuthId, error } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("user_id", user.id)
        .single();

      candidate = candidateByAuthId;
      candidateByAuthIdError = error;
      if (candidate) {
        candidateSource = "user_id";
        if (userId && candidate.user_id !== userId) {
          await supabase
            .from("candidates")
            .update({ user_id: userId })
            .eq("id", candidate.id);
        }
      }
    }

    if (!candidate && user.email) {
      const parsedYears =
        userMetadata.years_experience !== undefined && userMetadata.years_experience !== null
          ? parseInt(String(userMetadata.years_experience), 10)
          : null;
      const yearsExperience = Number.isNaN(parsedYears) ? null : parsedYears;
      const { data: newCandidate, error } = await supabase
        .from("candidates")
        .insert({
          user_id: userId || null,
          first_name: derivedFirst,
          last_name: derivedLast,
          email,
          phone: (userMetadata.phone as string) || null,
          whatsapp: (userMetadata.phone as string) || null,
          nationality: (userMetadata.nationality as string) || null,
          candidate_type: (userMetadata.candidate_type as string) || null,
          primary_position: (userMetadata.primary_position as string) || null,
          years_experience: yearsExperience,
          availability_status: "looking",
          source: "self_registration",
        })
        .select(candidateSelectFields)
        .single();

      createCandidateError = error;
      if (error) {
        console.error("Quick apply candidate creation failed:", error);
        if (error.code === "23505") {
          const { data: existingByEmail } = await supabase
            .from("candidates")
            .select(candidateSelectFields)
            .ilike("email", email)
            .single();
          candidate = existingByEmail;
          if (candidate) {
            candidateSource = "email";
          }
        }
      } else {
        candidate = newCandidate;
        if (candidate) {
          candidateSource = "created";
        }
      }
    }

    if (!candidate) {
      const payload: Record<string, unknown> = {
        error: "profile_incomplete",
        message: "Please complete your profile before applying.",
        missingFields: ["profile"],
        completeness: 0,
      };
      if (isDev) {
        payload.debug = {
          candidateSource,
          authEmail: user.email,
          userEmail: userData?.email,
          userType: userData?.user_type,
          userId,
          userUpserted,
          candidateByUserIdError,
          candidateByEmailError,
          candidateByAuthIdError,
          createCandidateError,
        };
      }
      return NextResponse.json(payload, { status: 403 });
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

    // Check if candidate has a CV (required for applications)
    const hasCV = await candidateHasCV(supabase, candidate.id);
    if (!hasCV) {
      return NextResponse.json(
        {
          error: "cv_required",
          message: "You must upload a CV before applying to jobs. Please upload your CV in the Documents section.",
        },
        { status: 403 }
      );
    }

    let cvDocuments: Array<{ type?: string | null; document_type?: string | null }> = [];
    const { data: docsByType, error: docsByTypeError } = await supabase
      .from("documents")
      .select("type")
      .eq("entity_type", "candidate")
      .eq("entity_id", candidate.id)
      .eq("type", "cv")
      .limit(1);
    if (!docsByTypeError && docsByType) {
      cvDocuments = docsByType;
    } else {
      const { data: docsByDocumentType, error: docsByDocumentTypeError } = await supabase
        .from("documents")
        .select("document_type")
        .eq("entity_type", "candidate")
        .eq("entity_id", candidate.id)
        .eq("document_type", "cv")
        .limit(1);
      if (!docsByDocumentTypeError && docsByDocumentType) {
        cvDocuments = docsByDocumentType;
      }
    }

    const profileStatus = calculateProfileCompletion({
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      dateOfBirth: candidate.date_of_birth,
      nationality: candidate.nationality,
      currentLocation: candidate.current_location,
      candidateType: candidate.candidate_type,
      primaryPosition: candidate.primary_position,
      avatarUrl: candidate.avatar_url,
      hasStcw: candidate.has_stcw,
      hasEng1: candidate.has_eng1,
      industryPreference: candidate.industry_preference,
      verificationTier: candidate.verification_tier,
      documents: (cvDocuments || []).map((doc) => ({
        type: doc.type || doc.document_type || "",
      })),
    });

    if (profileStatus.score < 70) {
      const payload: Record<string, unknown> = {
        error: "profile_incomplete",
        message: `Your profile is ${profileStatus.score}% complete. You need at least 70% to quick apply.`,
        missingFields: profileStatus.actions.filter((action) => !action.completed).map((action) => action.id),
        completeness: profileStatus.score,
      };
      if (isDev) {
        payload.debug = {
          candidateId: candidate.id,
          candidateSource,
          userId,
          userUpserted,
        };
      }
      return NextResponse.json(payload, { status: 403 });
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, status, created_by_agency_id, external_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      // Also check public_jobs table
      const { data: publicJob, error: publicJobError } = await supabase
        .from("public_jobs")
        .select("id, title, status, created_by_agency_id, external_id")
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
  _userId: string
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

  // Sync application to Vincere (fire and forget)
  // This will create the candidate in Vincere if they don't exist yet
  syncJobApplication(candidate.id, job.id)
    .then((result) => {
      if (result.success) {
        console.log(`[Vincere] Synced application for candidate ${candidate.id} to job ${job.id}`);
      } else if (result.error) {
        console.error(`[Vincere] Failed to sync application: ${result.error}`);
      }
    })
    .catch((err: Error) => {
      console.error(`[Vincere] Failed to sync application for candidate ${candidate.id}:`, err);
    });

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

// ============================================================================
// CREW JOB MATCHES API - AI-Powered Job Matching for Logged-In Candidates
// ============================================================================
// Returns AI-matched jobs for the authenticated candidate based on their
// complete profile, preferences, and qualifications.
// Supports BOTH yacht crew AND household/land-based positions.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  matchJobsForCandidate,
  checkProfileCompleteness,
  type JobIndustry,
} from "@lighthouse/ai/matcher";

// ----------------------------------------------------------------------------
// QUERY PARAMS SCHEMA
// ----------------------------------------------------------------------------

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  minScore: z.coerce.number().int().min(0).max(100).default(30),
  industry: z.enum(["yacht", "household", "both"]).default("both"),
  includeAISummary: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

// ----------------------------------------------------------------------------
// GET HANDLER
// ----------------------------------------------------------------------------

/**
 * GET /api/crew/job-matches
 *
 * Returns AI-matched jobs for the authenticated candidate.
 * Requires the user to be logged in and have a candidate profile.
 *
 * Query params:
 * - limit: number of results (default: 10, max: 50)
 * - minScore: minimum match score to include (default: 30)
 * - industry: filter by job type - "yacht", "household", or "both" (default: "both")
 * - includeAISummary: include AI-generated summaries (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "You must be logged in to view job matches",
        },
        { status: 401 }
      );
    }

    // Candidate select fields
    const candidateSelectFields = `
      id, first_name, last_name, email,
      primary_position, yacht_primary_position, yacht_secondary_positions,
      household_primary_position, household_secondary_positions, secondary_positions,
      years_experience,
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

    console.log(`[Job Matches] Auth user: ${user.id}, email: ${user.email}`);

    // Get user record (auth_id -> user_id mapping)
    const { data: userData, error: userLookupError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    console.log(`[Job Matches] User lookup: userData=${JSON.stringify(userData)}, error=${userLookupError?.message}`);

    let candidate = null;

    // Try to find candidate by user_id if user record exists
    if (userData) {
      const { data: candidateByUserId, error: candidateUserIdError } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("user_id", userData.id)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      console.log(`[Job Matches] Candidate by user_id: found=${!!candidateByUserId}, error=${candidateUserIdError?.message}`);

      if (!candidateUserIdError && candidateByUserId) {
        candidate = candidateByUserId;
      }
    }

    // Fallback: Try to find candidate by email (for Vincere-imported candidates)
    if (!candidate && user.email) {
      const { data: candidateByEmail, error: candidateEmailError } = await supabase
        .from("candidates")
        .select(candidateSelectFields)
        .eq("email", user.email)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      console.log(`[Job Matches] Candidate by email: found=${!!candidateByEmail}, error=${candidateEmailError?.message}`);

      if (!candidateEmailError && candidateByEmail) {
        candidate = candidateByEmail;
      }
    }

    console.log(`[Job Matches] Final candidate: ${candidate ? candidate.id : 'NOT FOUND'}`);

    if (!candidate) {
      console.log(`[Job Matches] No candidate found for auth user: ${user.id}, email: ${user.email}`);
      console.log(`[Job Matches] Tried user_id: ${userData?.id}, email: ${user.email}`);

      return NextResponse.json(
        {
          authenticated: true,
          error: "No candidate profile found. Please complete your profile first.",
          hasProfile: false,
          debug: {
            authUserId: user.id,
            email: user.email,
            hasUserRecord: !!userData,
            userId: userData?.id,
          }
        },
        { status: 403 }
      );
    }

    // Check profile completeness
    const profileStatus = checkProfileCompleteness(candidate);

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { limit, minScore, industry, includeAISummary } = parseResult.data;

    // Run the AI matcher
    const { matches, metadata } = await matchJobsForCandidate(supabase, {
      candidateId: candidate.id,
      limit,
      minScore,
      industry: industry as JobIndustry | "both",
      includeAISummary,
    });

    // Add profile completeness to results and validate quick apply
    const matchesWithQuickApply = matches.map((match) => ({
      ...match,
      canQuickApply: profileStatus.canQuickApply && !match.hasApplied,
    }));

    return NextResponse.json({
      authenticated: true,
      candidateId: candidate.id,
      profile: {
        completeness: profileStatus.completeness,
        canQuickApply: profileStatus.canQuickApply,
        missingFields: profileStatus.missingFields,
      },
      matches: matchesWithQuickApply,
      metadata: {
        ...metadata,
        industry,
        limit,
        minScore,
      },
    });
  } catch (error) {
    console.error("Job matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

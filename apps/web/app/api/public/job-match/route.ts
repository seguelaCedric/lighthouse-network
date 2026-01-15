// ============================================================================
// PUBLIC JOB MATCH API - Relevance Tier Matching for Candidates
// ============================================================================
// This endpoint calculates relevance tiers between a logged-in candidate
// and public job listings. Uses position and department matching.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePosition } from "@/lib/utils/position-normalization";
import { POSITION_MAPPING } from "@/lib/vincere/constants";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CandidateProfile {
  id: string;
  primary_position: string | null;
  secondary_positions: string[] | null;
  yacht_primary_position?: string | null;
  yacht_secondary_positions?: string[] | null;
  household_primary_position?: string | null;
  household_secondary_positions?: string[] | null;
}

// ----------------------------------------------------------------------------
// MATCHING LOGIC
// ----------------------------------------------------------------------------

/**
 * Get the department/category for a position using the comprehensive POSITION_MAPPING
 */
function getPositionDepartment(position: string): string | null {
  if (!position) return null;

  // Normalize the position: lowercase, replace underscores with spaces
  const posLower = position.toLowerCase().replace(/_/g, " ").trim();

  // Direct lookup in POSITION_MAPPING
  const mapping = POSITION_MAPPING[posLower];
  if (mapping) {
    return mapping.category;
  }

  // Try partial matching for positions with extra words
  for (const [key, value] of Object.entries(POSITION_MAPPING)) {
    if (posLower.includes(key) || key.includes(posLower)) {
      return value.category;
    }
  }

  return null;
}

/**
 * Check if job title matches any of the candidate's sought positions
 */
function getPositionMatchLevel(
  jobTitle: string,
  candidateSoughtPositions: string[]
): "match" | "none" {
  const normalizedJob = normalizePosition(jobTitle);

  for (const position of candidateSoughtPositions) {
    const normalizedPos = normalizePosition(position);
    if (!normalizedPos || normalizedPos === "other") continue;

    if (normalizedJob === normalizedPos) {
      return "match";
    }

    // Check if one contains the other
    if (normalizedJob.includes(normalizedPos) || normalizedPos.includes(normalizedJob)) {
      return "match";
    }
  }

  return "none";
}

/**
 * Calculate relevance tier between a candidate and a job
 * Tier 1: Exact position match
 * Tier 2: Same department
 * Tier 3: Other jobs
 */
function calculateRelevanceTier(
  candidateSoughtPositions: string[],
  jobTitle: string
): 1 | 2 | 3 {
  // Tier 1: Check for direct position match
  const matchLevel = getPositionMatchLevel(jobTitle, candidateSoughtPositions);
  if (matchLevel === "match") {
    return 1;
  }

  // Tier 2: Check if same department
  const jobDepartment = getPositionDepartment(jobTitle);
  if (jobDepartment) {
    for (const pos of candidateSoughtPositions) {
      if (getPositionDepartment(pos) === jobDepartment) {
        return 2;
      }
    }
  }

  // Tier 3: Everything else
  return 3;
}

/**
 * Build the list of positions a candidate is seeking
 */
function buildCandidateSoughtPositions(candidate: CandidateProfile): string[] {
  const positions: string[] = [];

  // Preference positions first (what they WANT)
  if ((candidate as any).yacht_primary_position) {
    positions.push((candidate as any).yacht_primary_position);
  }
  if ((candidate as any).household_primary_position) {
    positions.push((candidate as any).household_primary_position);
  }
  if (Array.isArray((candidate as any).yacht_secondary_positions)) {
    positions.push(...(candidate as any).yacht_secondary_positions);
  }
  if (Array.isArray((candidate as any).household_secondary_positions)) {
    positions.push(...(candidate as any).household_secondary_positions);
  }

  // Profile positions (what they DO)
  if (candidate.primary_position) {
    positions.push(candidate.primary_position);
  }
  if (Array.isArray(candidate.secondary_positions)) {
    positions.push(...candidate.secondary_positions);
  }

  return positions.filter(Boolean);
}

// ----------------------------------------------------------------------------
// API HANDLER
// ----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, message: "Sign in to see personalized job ordering" },
        { status: 200 }
      );
    }

    // Get the user record (auth_id -> user_id mapping)
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    console.log("[job-match] Auth user ID:", user.id);
    console.log("[job-match] User record found:", !!userData, userData?.id);

    if (!userData) {
      return NextResponse.json(
        { authenticated: false, message: "User profile not found" },
        { status: 200 }
      );
    }

    // Check if user is a candidate (not agency/admin)
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(
        `
        id,
        primary_position,
        yacht_primary_position,
        household_primary_position,
        secondary_positions,
        yacht_secondary_positions,
        household_secondary_positions
      `
      )
      .eq("user_id", userData.id)
      .single();

    console.log("[job-match] Candidate found:", !!candidate, candidate?.id);
    console.log("[job-match] Candidate error:", candidateError);

    if (candidateError || !candidate) {
      console.log("[job-match] ERROR - No candidate found for user_id:", userData.id);
      return NextResponse.json(
        { authenticated: false, message: "No candidate profile found" },
        { status: 200 }
      );
    }

    // Fetch public jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("public_jobs")
      .select(`id, title`)
      .limit(200);

    if (jobsError || !jobs) {
      console.error("Error fetching jobs:", jobsError);
      return NextResponse.json(
        { authenticated: true, tiers: {} },
        { status: 200 }
      );
    }

    // Build candidate's sought positions list
    const candidateSoughtPositions = buildCandidateSoughtPositions(candidate as CandidateProfile);

    // Calculate relevance tier for each job
    const tiers: Record<string, { tier: 1 | 2 | 3 }> = {};

    for (const job of jobs) {
      const tier = calculateRelevanceTier(candidateSoughtPositions, job.title || "");
      tiers[job.id] = { tier };
    }

    return NextResponse.json(
      {
        authenticated: true,
        candidateId: candidate.id,
        tiers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Job match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUBLIC JOB MATCH API - AI-Powered Job Matching for Candidates
// ============================================================================
// This endpoint calculates match scores between a logged-in candidate
// and public job listings. Uses vector similarity and structured matching.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CandidateProfile {
  id: string;
  primary_position: string | null;
  secondary_positions: string[] | null;
  years_experience: number | null;
  preferred_yacht_types: string[] | null;
  preferred_yacht_size_min: number | null;
  preferred_yacht_size_max: number | null;
  preferred_regions: string[] | null;
  preferred_contract_types: string[] | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  availability_status: string | null;
  embedding: number[] | null;
  has_stcw: boolean;
  has_eng1: boolean;
  highest_license: string | null;
}

interface PublicJob {
  id: string;
  title: string;
  position_category: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  contract_type: string | null;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  requirements: string[] | null;
}

// ----------------------------------------------------------------------------
// MATCHING LOGIC
// ----------------------------------------------------------------------------

/**
 * Calculate match score between a candidate and a job (0-100)
 * Returns both score and isRelevant flag (true if position matches)
 */
function calculateMatchScore(candidate: CandidateProfile, job: PublicJob): { score: number; isRelevant: boolean } {
  let score = 50; // Base score
  let totalFactors = 0;
  let positiveFactors = 0;
  let isRelevant = false; // Track if position is relevant

  // Position match (most important - +20 points)
  // Use yacht_primary_position or household_primary_position if primary_position is null
  const primaryPosition = (candidate as any).yacht_primary_position || (candidate as any).household_primary_position || candidate.primary_position;

  totalFactors++;
  if (primaryPosition) {
    const candidatePos = normalizePosition(primaryPosition);
    const jobPos = normalizePosition(job.position_category || job.title);

    if (candidatePos === jobPos) {
      score += 20;
      positiveFactors++;
      isRelevant = true; // Exact match = relevant
    } else if (
      candidate.secondary_positions?.some(
        (pos) => normalizePosition(pos) === jobPos
      )
    ) {
      score += 12;
      positiveFactors += 0.6;
      isRelevant = true; // Secondary position match = relevant
    } else if (isSameDepartment(candidatePos, jobPos)) {
      score += 8;
      positiveFactors += 0.4;
      isRelevant = true; // Same department = relevant
    }
    // If none of the above, isRelevant remains false (different department = not relevant)
  }

  // Vessel type preference (+10 points)
  if (job.vessel_type && candidate.preferred_yacht_types?.length) {
    totalFactors++;
    const jobVessel = job.vessel_type.toLowerCase();
    if (
      candidate.preferred_yacht_types.some(
        (v) => v.toLowerCase().includes(jobVessel) || jobVessel.includes(v.toLowerCase())
      )
    ) {
      score += 10;
      positiveFactors++;
    }
  }

  // Vessel size preference (+8 points)
  if (job.vessel_size_meters) {
    totalFactors++;
    const size = job.vessel_size_meters;
    const minPref = candidate.preferred_yacht_size_min || 0;
    const maxPref = candidate.preferred_yacht_size_max || 999;

    if (size >= minPref && size <= maxPref) {
      score += 8;
      positiveFactors++;
    } else if (size >= minPref - 10 && size <= maxPref + 10) {
      score += 4;
      positiveFactors += 0.5;
    }
  }

  // Region preference (+8 points)
  if (job.primary_region && candidate.preferred_regions?.length) {
    totalFactors++;
    const jobRegion = job.primary_region.toLowerCase();
    if (
      candidate.preferred_regions.some(
        (r) => r.toLowerCase().includes(jobRegion) || jobRegion.includes(r.toLowerCase())
      )
    ) {
      score += 8;
      positiveFactors++;
    }
  }

  // Contract type preference (+6 points)
  if (job.contract_type && candidate.preferred_contract_types?.length) {
    totalFactors++;
    const jobContract = job.contract_type.toLowerCase();
    if (
      candidate.preferred_contract_types.some((c) => c.toLowerCase() === jobContract)
    ) {
      score += 6;
      positiveFactors++;
    }
  }

  // Salary alignment (+8 points)
  if (job.salary_min || job.salary_max) {
    totalFactors++;
    const jobMin = job.salary_min || 0;
    const jobMax = job.salary_max || Infinity;
    const candMin = candidate.desired_salary_min || 0;
    const candMax = candidate.desired_salary_max || Infinity;

    // Check if salary ranges overlap
    if (jobMax >= candMin && jobMin <= candMax) {
      score += 8;
      positiveFactors++;
    } else if (jobMax >= candMin * 0.9) {
      // Close enough
      score += 4;
      positiveFactors += 0.5;
    }
  }

  // Experience level (+5 points)
  if (candidate.years_experience) {
    totalFactors++;
    // More experienced candidates get slight boost
    const expBonus = Math.min(5, Math.floor(candidate.years_experience / 2));
    score += expBonus;
    positiveFactors += expBonus / 5;
  }

  // Availability bonus (+5 points for available candidates)
  if (candidate.availability_status === "available" || candidate.availability_status === "looking") {
    score += 5;
  }

  // Cap score at 100 and floor at 0
  score = Math.min(100, Math.max(0, Math.round(score)));

  return { score, isRelevant };
}

/**
 * Normalize position names for comparison
 */
function normalizePosition(position: string): string {
  return position
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Check if two positions are in the same department
 */
function isSameDepartment(pos1: string, pos2: string): boolean {
  const deckPositions = ["captain", "officer", "mate", "bosun", "deckhand", "deck"];
  const interiorPositions = ["stew", "steward", "purser", "chief_stew", "interior"];
  const enginePositions = ["engineer", "eto", "engine"];
  const galleyPositions = ["chef", "cook", "galley"];

  const pos1Lower = pos1.toLowerCase();
  const pos2Lower = pos2.toLowerCase();

  if (deckPositions.some((d) => pos1Lower.includes(d)) && deckPositions.some((d) => pos2Lower.includes(d))) {
    return true;
  }
  if (
    interiorPositions.some((d) => pos1Lower.includes(d)) &&
    interiorPositions.some((d) => pos2Lower.includes(d))
  ) {
    return true;
  }
  if (
    enginePositions.some((d) => pos1Lower.includes(d)) &&
    enginePositions.some((d) => pos2Lower.includes(d))
  ) {
    return true;
  }
  if (
    galleyPositions.some((d) => pos1Lower.includes(d)) &&
    galleyPositions.some((d) => pos2Lower.includes(d))
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate vector similarity if embeddings are available
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
        { authenticated: false, message: "Sign in to see your match scores" },
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
        years_experience,
        preferred_yacht_types,
        preferred_yacht_size_min,
        preferred_yacht_size_max,
        preferred_regions,
        preferred_contract_types,
        desired_salary_min,
        desired_salary_max,
        availability_status,
        embedding,
        has_stcw,
        has_eng1,
        highest_license
      `
      )
      .eq("user_id", userData.id)
      .single();

    console.log("[job-match] Candidate found:", !!candidate, candidate?.id);
    console.log("[job-match] Candidate error:", candidateError);
    console.log("[job-match] Positions:", {
      primary: candidate?.primary_position,
      yacht: (candidate as any)?.yacht_primary_position,
      household: (candidate as any)?.household_primary_position
    });

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
      .select(
        `
        id,
        title,
        position_category,
        vessel_type,
        vessel_size_meters,
        contract_type,
        primary_region,
        salary_min,
        salary_max,
        requirements
      `
      )
      .limit(100);

    if (jobsError || !jobs) {
      console.error("Error fetching jobs:", jobsError);
      return NextResponse.json(
        { authenticated: true, scores: {} },
        { status: 200 }
      );
    }

    // Calculate match scores for each job
    const scores: Record<string, { score: number; isRelevant: boolean }> = {};

    for (const job of jobs) {
      scores[job.id] = calculateMatchScore(candidate as CandidateProfile, job as PublicJob);
    }

    return NextResponse.json(
      {
        authenticated: true,
        candidateId: candidate.id,
        scores,
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

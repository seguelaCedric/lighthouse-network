"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncJobApplication } from "@/lib/vincere/sync-service";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import { REGION_GROUPS } from "@/lib/utils/job-helpers";
import { candidateHasCV } from "@/lib/utils/candidate-cv";

/**
 * Job listing for crew portal
 */
export interface JobListing {
  id: string;
  title: string;
  vesselName: string | null;
  vesselType: string | null;
  vesselSize: number | null;
  location: string | null;
  contractType: string | null;
  rotationSchedule: string | null;
  startDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryPeriod: string;
  holidayDays: number | null;
  benefits: string | null;
  description: string | null;
  requirements: Record<string, unknown> | null;
  isUrgent: boolean;
  applyDeadline: string | null;
  applicationsCount: number;
  viewsCount: number;
  publishedAt: string | null;
  createdAt: string;
  // Match info
  matchScore: number | null;
  matchType: "match" | "none";
  hasApplied: boolean;
  isSaved: boolean;
}

/**
 * Filter options for jobs
 */
export interface JobFilters {
  position?: string;
  region?: string;
  contractType?: string;
  minSalary?: number;
  maxSalary?: number;
  vesselType?: string;
  jobType?: "yacht" | "land-based" | "all";
}

/**
 * Jobs page data
 */
export interface JobsPageData {
  candidateId: string;
  candidatePosition: string | null;
  candidateSoughtPositions: string[];  // Positions they're looking for (from positions_held + primary)
  candidatePreferredRegions: string[] | null;
  jobs: JobListing[];
  totalCount: number;
  appliedJobIds: string[];
  savedJobIds: string[];
}

/**
 * Normalize a position string for comparison
 */
function normalizePosition(position: string): string {
  return position.toLowerCase().trim()
    .replace(/stewardess/g, "stew")
    .replace(/chief stew/g, "chief stew")
    .replace(/\s+/g, " ");
}

/**
 * Check if a job title matches any of the candidate's sought positions
 * SIMPLE LOGIC: Does the job title contain the position they're looking for?
 * (Strict containment only; no related-role matching.)
 */
function getPositionMatchLevel(
  jobTitle: string,
  candidateSoughtPositions: string[]
): "match" | "none" {
  const normalizedJob = normalizePosition(jobTitle);

  // Simple check: does the job title contain any position they're seeking?
  for (const position of candidateSoughtPositions) {
    const normalizedPos = normalizePosition(position);

    // Skip empty or "other"
    if (!normalizedPos || normalizedPos === "other") continue;

    // Direct containment check only (job title must include sought position)
    if (normalizedJob.includes(normalizedPos)) {
      return "match";
    }
  }

  return "none";
}

/**
 * Build the list of positions a candidate is seeking
 * This combines their explicit job preferences with their current profile
 *
 * Priority order:
 * 1. Preference positions (what they WANT) - yacht_primary_position, household_primary_position, etc.
 * 2. Profile positions (what they DO) - primary_position, secondary_positions
 *
 * Note: positions_held (historical) is intentionally excluded - we only match
 * against what they're actively looking for, not their entire work history.
 */
function resolveIndustryPreference(candidate: {
  industry_preference?: string | null;
  candidate_type?: string | null;
}): "yacht" | "household" | "both" | null {
  if (candidate.industry_preference === "yacht" || candidate.industry_preference === "household" || candidate.industry_preference === "both") {
    return candidate.industry_preference;
  }
  if (candidate.candidate_type === "yacht_crew") return "yacht";
  if (candidate.candidate_type === "household_staff") return "household";
  if (candidate.candidate_type === "both") return "both";
  return null;
}

function buildSoughtPositions(
  candidate: {
  primary_position: string | null;
  secondary_positions: string[] | null;
  // Job preference positions (from preferences wizard)
  yacht_primary_position?: string | null;
  yacht_secondary_positions?: string[] | null;
  household_primary_position?: string | null;
  household_secondary_positions?: string[] | null;
  industry_preference?: string | null;
  candidate_type?: string | null;
  },
  options?: { includeSecondary?: boolean }
): string[] {
  const positions = new Set<string>();
  const includeSecondary = options?.includeSecondary ?? true;
  const industryPreference = resolveIndustryPreference(candidate);
  const includeYacht = industryPreference === "yacht" || industryPreference === "both";
  const includeHousehold = industryPreference === "household" || industryPreference === "both";

  // Priority 1: Preference positions (what they WANT)
  if (includeYacht && candidate.yacht_primary_position) {
    positions.add(candidate.yacht_primary_position);
  }
  if (includeHousehold && candidate.household_primary_position) {
    positions.add(candidate.household_primary_position);
  }
  if (includeSecondary && includeYacht && candidate.yacht_secondary_positions?.length) {
    candidate.yacht_secondary_positions.forEach(p => positions.add(p));
  }
  if (includeSecondary && includeHousehold && candidate.household_secondary_positions?.length) {
    candidate.household_secondary_positions.forEach(p => positions.add(p));
  }

  // Priority 2: Profile positions (what they DO)
  if (positions.size === 0) {
    if (candidate.primary_position) {
      positions.add(candidate.primary_position);
    }
    if (includeSecondary && candidate.secondary_positions?.length) {
      candidate.secondary_positions.forEach(p => positions.add(p));
    }
  }

  // Format all position names for display (snake_case -> Title Case)
  return Array.from(positions)
    .filter(Boolean)
    .map(p => getPositionDisplayName(p));
}

/**
 * Calculate a match score based on candidate profile and job
 *
 * Scoring breakdown:
 * - Role match is the PRIMARY factor (50 points if job title contains sought position)
 * - Region match: 25 points
 * - Contract type: 15 points
 * - Salary fit: 10 points
 */
function calculateMatchScore(
  job: {
    title: string;
    primary_region: string | null;
    contract_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    requirements: Record<string, unknown> | null;
  },
  candidate: {
    primary_position: string | null;
    secondary_positions: string[] | null;
    preferred_regions: string[] | null;
    preferred_contract_types: string[] | null;
    desired_salary_min: number | null;
    desired_salary_max: number | null;
    // Preference positions from wizard
    yacht_primary_position?: string | null;
    yacht_secondary_positions?: string[] | null;
    household_primary_position?: string | null;
    household_secondary_positions?: string[] | null;
    industry_preference?: string | null;
    candidate_type?: string | null;
  }
): { score: number; matchType: "match" | "none" } {
  let score = 0;

  // Build the list of positions they're seeking
  const soughtPositions = buildSoughtPositions(candidate, { includeSecondary: false });

  // Position match - simple check: does job title contain sought position?
  const matchType = getPositionMatchLevel(job.title, soughtPositions);

  if (matchType === "match") {
    score += 50;
  }
  // No match = 0 points

  // Region match (25 points)
  if (candidate.preferred_regions && job.primary_region) {
    const jobRegion = job.primary_region.toLowerCase();
    const matchesRegion = candidate.preferred_regions.some(
      (r) =>
        r.toLowerCase().includes(jobRegion) ||
        jobRegion.includes(r.toLowerCase())
    );
    if (matchesRegion) {
      score += 25;
    }
  }

  // Contract type match (15 points)
  if (candidate.preferred_contract_types && job.contract_type) {
    if (candidate.preferred_contract_types.includes(job.contract_type)) {
      score += 15;
    }
  }

  // Salary expectations match (10 points)
  if (candidate.desired_salary_min && job.salary_max) {
    if (job.salary_max >= candidate.desired_salary_min) {
      score += 10;
    }
  }

  // Cap at 100
  return { score: Math.min(score, 100), matchType };
}

/**
 * Get jobs data for the crew portal
 */
export async function getJobsData(
  filters?: JobFilters,
  page: number = 1,
  limit: number = 20
): Promise<JobsPageData | null> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(
        `
        id,
        primary_position,
        secondary_position,
        secondary_positions,
        positions_held,
        position_category,
        preferred_regions,
        preferred_contract_types,
        desired_salary_min,
        desired_salary_max,
        years_experience,
        has_stcw,
        has_eng1,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions,
        industry_preference,
        candidate_type
      `
      )
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(
        `
        id,
        primary_position,
        secondary_position,
        secondary_positions,
        positions_held,
        position_category,
        preferred_regions,
        preferred_contract_types,
        desired_salary_min,
        desired_salary_max,
        years_experience,
        has_stcw,
        has_eng1,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions,
        industry_preference,
        candidate_type
      `
      )
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) return null;

  // Build the list of positions this candidate is seeking
  const soughtPositions = buildSoughtPositions({
    primary_position: candidate.primary_position,
    secondary_positions: candidate.secondary_positions,
    yacht_primary_position: candidate.yacht_primary_position,
    yacht_secondary_positions: candidate.yacht_secondary_positions,
    household_primary_position: candidate.household_primary_position,
    household_secondary_positions: candidate.household_secondary_positions,
    industry_preference: candidate.industry_preference,
    candidate_type: candidate.candidate_type,
  });

  // Get candidate's applied job IDs
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id")
    .eq("candidate_id", candidate.id);

  const appliedJobIds = (applications || []).map((a) => a.job_id);

  // Get candidate's saved job IDs
  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("candidate_id", candidate.id);

  const savedJobIds = (savedJobs || []).map((s) => s.job_id);

  // Build jobs query
  let query = supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      vessel_name,
      vessel_type,
      vessel_size_meters,
      primary_region,
      contract_type,
      rotation_schedule,
      start_date,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      holiday_days,
      benefits,
      requirements_text,
      requirements,
      is_urgent,
      apply_deadline,
      applications_count,
      views_count,
      published_at,
      created_at
    `,
      { count: "exact" }
    )
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null);

  // Apply filters
  if (filters?.position) {
    query = query.ilike("title", `%${filters.position}%`);
  }
  if (filters?.region) {
    // If it's a normalized region key, search for any matching keywords
    const regionGroup = REGION_GROUPS[filters.region];
    if (regionGroup) {
      // Build an OR filter for all keywords in this region group
      const keywordFilters = regionGroup.keywords.map(kw => `primary_region.ilike.%${kw}%`);
      query = query.or(keywordFilters.join(","));
    } else {
      // Fallback to direct search for raw region values
      query = query.ilike("primary_region", `%${filters.region}%`);
    }
  }
  if (filters?.contractType) {
    query = query.eq("contract_type", filters.contractType);
  }
  if (filters?.minSalary) {
    query = query.gte("salary_max", filters.minSalary);
  }
  if (filters?.maxSalary) {
    query = query.lte("salary_min", filters.maxSalary);
  }
  if (filters?.vesselType) {
    query = query.ilike("vessel_type", `%${filters.vesselType}%`);
  }

  // Order by urgency first, then by created date
  query = query
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: jobs, count } = await query;

  // Map jobs with match scores and match types
  const mappedJobs: JobListing[] = (jobs || []).map((job) => {
    // Calculate match score - now returns both score and matchType
    const { score: matchScore, matchType } = calculateMatchScore(job as any, candidate as any);

    return {
      id: job.id,
      title: job.title,
      vesselName: job.vessel_name,
      vesselType: job.vessel_type,
      vesselSize: job.vessel_size_meters,
      location: job.primary_region,
      contractType: job.contract_type,
      rotationSchedule: job.rotation_schedule,
      startDate: job.start_date,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: job.salary_currency || "EUR",
      salaryPeriod: job.salary_period || "month",
      holidayDays: job.holiday_days,
      benefits: job.benefits,
      description: job.requirements_text,
      requirements: job.requirements as Record<string, unknown> | null,
      isUrgent: job.is_urgent || false,
      applyDeadline: job.apply_deadline,
      applicationsCount: job.applications_count || 0,
      viewsCount: job.views_count || 0,
      publishedAt: job.published_at,
      createdAt: job.created_at,
      // Only set matchScore if position is relevant (not "none")
      matchScore: matchType !== "none" ? matchScore : null,
      matchType,
      hasApplied: appliedJobIds.includes(job.id),
      isSaved: savedJobIds.includes(job.id),
    };
  });

  // Sort by match score (descending) as secondary sort
  mappedJobs.sort((a, b) => {
    // Urgent jobs first
    if (a.isUrgent !== b.isUrgent) {
      return a.isUrgent ? -1 : 1;
    }
    // Then by match score
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  return {
    candidateId: candidate.id,
    candidatePosition: getPositionDisplayName(candidate.primary_position),
    candidateSoughtPositions: soughtPositions,
    candidatePreferredRegions: candidate.preferred_regions,
    jobs: mappedJobs,
    totalCount: count || 0,
    appliedJobIds,
    savedJobIds,
  };
}

/**
 * Get a single job by ID
 */
export async function getJobById(
  jobId: string
): Promise<JobListing | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(
        `
        id,
        primary_position,
        secondary_position,
        secondary_positions,
        positions_held,
        position_category,
        preferred_regions,
        preferred_contract_types,
        desired_salary_min,
        desired_salary_max,
        years_experience,
        has_stcw,
        has_eng1,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions
      `
      )
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(
        `
        id,
        primary_position,
        secondary_position,
        secondary_positions,
        positions_held,
        position_category,
        preferred_regions,
        preferred_contract_types,
        desired_salary_min,
        desired_salary_max,
        years_experience,
        has_stcw,
        has_eng1,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions
      `
      )
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) return null;

  // Get job
  const { data: job } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      vessel_name,
      vessel_type,
      vessel_size_meters,
      primary_region,
      contract_type,
      rotation_schedule,
      start_date,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      holiday_days,
      benefits,
      requirements_text,
      requirements,
      is_urgent,
      apply_deadline,
      applications_count,
      views_count,
      published_at,
      created_at
    `
    )
    .eq("id", jobId)
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null)
    .single();

  if (!job) return null;

  // Check if applied
  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId)
    .maybeSingle();

  // Check if saved
  const { data: savedJob } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId)
    .maybeSingle();

  // Increment view count
  await supabase.rpc("increment_job_views", { p_job_id: jobId });

  // Calculate match score - now returns both score and matchType
  const { score: matchScore, matchType } = calculateMatchScore(job as any, candidate as any);

  return {
    id: job.id,
    title: job.title,
    vesselName: job.vessel_name,
    vesselType: job.vessel_type,
    vesselSize: job.vessel_size_meters,
    location: job.primary_region,
    contractType: job.contract_type,
    rotationSchedule: job.rotation_schedule,
    startDate: job.start_date,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    currency: job.salary_currency || "EUR",
    salaryPeriod: job.salary_period || "month",
    holidayDays: job.holiday_days,
    benefits: job.benefits,
    description: job.requirements_text,
    requirements: job.requirements as Record<string, unknown> | null,
    isUrgent: job.is_urgent || false,
    applyDeadline: job.apply_deadline,
    applicationsCount: job.applications_count || 0,
    viewsCount: job.views_count || 0,
    publishedAt: job.published_at,
    createdAt: job.created_at,
    // Only set matchScore if position is relevant (not "none")
    matchScore: matchType !== "none" ? matchScore : null,
    matchType,
    hasApplied: !!application,
    isSaved: !!savedJob,
  };
}

/**
 * Apply to a job
 */
export async function applyToJob(
  jobId: string,
  coverNote?: string
): Promise<{ success: boolean; error?: string; applicationId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    return { success: false, error: "Candidate profile not found" };
  }

  // Check if candidate has a CV
  const hasCV = await candidateHasCV(supabase, candidate.id);
  if (!hasCV) {
    return {
      success: false,
      error: "You must upload a CV before applying to jobs. Please upload your CV in the Documents section.",
    };
  }

  // Check job exists and is open
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, is_public, apply_deadline, created_by_agency_id")
    .eq("id", jobId)
    .single();

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  if (job.status !== "open" || !job.is_public) {
    return { success: false, error: "Job is no longer accepting applications" };
  }

  if (job.apply_deadline) {
    const deadline = new Date(job.apply_deadline);
    if (deadline < new Date()) {
      return { success: false, error: "Application deadline has passed" };
    }
  }

  // Check if already applied
  const { data: existingApp } = await supabase
    .from("applications")
    .select("id")
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existingApp) {
    return { success: false, error: "You have already applied to this job" };
  }

  // Use job's agency or fall back to default Lighthouse Careers org
  // This handles jobs imported from Vincere that may not have an agency set
  const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";
  const agencyId = job.created_by_agency_id || DEFAULT_LIGHTHOUSE_ORG_ID;

  // Create application
  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      candidate_id: candidate.id,
      job_id: jobId,
      agency_id: agencyId,
      stage: "applied",
      source: "job_board",
      internal_notes: coverNote || null,
      applied_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating application:", error);
    return { success: false, error: "Failed to submit application" };
  }

  // Sync job application to Vincere (fire-and-forget)
  syncJobApplication(candidate.id, jobId).catch((err) =>
    console.error("Vincere sync failed for job application:", err)
  );

  revalidatePath("/crew/jobs");
  revalidatePath("/crew/dashboard");

  return { success: true, applicationId: application.id };
}

/**
 * Withdraw an application
 */
export async function withdrawApplication(
  jobId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    return { success: false, error: "Candidate profile not found" };
  }

  // Find and update the application
  const { error } = await supabase
    .from("applications")
    .update({
      stage: "withdrawn",
      withdrawn_reason: reason || "Withdrawn by candidate",
      updated_at: new Date().toISOString(),
    })
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId);

  if (error) {
    console.error("Error withdrawing application:", error);
    return { success: false, error: "Failed to withdraw application" };
  }

  revalidatePath("/crew/jobs");
  revalidatePath("/crew/dashboard");

  return { success: true };
}

/**
 * Save (bookmark) a job for later
 */
export async function saveJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    return { success: false, error: "Candidate profile not found" };
  }

  // Save the job
  const { error } = await supabase
    .from("saved_jobs")
    .insert({
      candidate_id: candidate.id,
      job_id: jobId,
    });

  if (error) {
    // Check for duplicate
    if (error.code === "23505") {
      return { success: true }; // Already saved, treat as success
    }
    console.error("Error saving job:", error);
    return { success: false, error: "Failed to save job" };
  }

  return { success: true };
}

/**
 * Unsave (remove bookmark from) a job
 */
export async function unsaveJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    return { success: false, error: "Candidate profile not found" };
  }

  // Remove the saved job
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId);

  if (error) {
    console.error("Error unsaving job:", error);
    return { success: false, error: "Failed to unsave job" };
  }

  return { success: true };
}

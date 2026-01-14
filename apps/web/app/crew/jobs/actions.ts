"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncJobApplication } from "@/lib/vincere/sync-service";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import { REGION_GROUPS } from "@/lib/utils/job-helpers";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { matchJobsForCandidate } from "@lighthouse/ai/matcher";
import type { JobIndustry, JobMatchResult } from "@lighthouse/ai/matcher";

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
  hasJobPreferences: boolean;  // Whether user has set job preferences (industry + position)
  jobs: JobListing[];
  totalCount: number;
  appliedJobIds: string[];
  savedJobIds: string[];
}

import { normalizePosition as normalizePositionUtil } from "@/lib/utils/position-normalization";

/**
 * Normalize a position string for comparison
 * Uses shared normalization utility, but converts to space-separated format for this context
 */
function normalizePosition(position: string): string {
  const normalized = normalizePositionUtil(position);
  // Convert underscores to spaces for this matching context
  return normalized.replace(/_/g, " ");
}

/**
 * Check if a job title matches any of the candidate's sought positions
 * Uses normalized canonical forms for accurate matching
 */
function getPositionMatchLevel(
  jobTitle: string,
  candidateSoughtPositions: string[]
): "match" | "none" {
  // Normalize the job title to its canonical form
  const normalizedJob = normalizePosition(jobTitle);

  // Check against each candidate position
  for (const position of candidateSoughtPositions) {
    const normalizedPos = normalizePosition(position);

    // Skip empty or "other"
    if (!normalizedPos || normalizedPos === "other") continue;

    // Check if they match exactly (both normalize to same canonical form)
    if (normalizedJob === normalizedPos) {
      return "match";
    }

    // Also check if one contains the other (for cases like "Chief Stew" in "Chief Stew for 55m yacht")
    // This handles job titles with additional text
    if (normalizedJob.includes(normalizedPos) || normalizedPos.includes(normalizedJob)) {
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

/**
 * Check if candidate has set job preferences
 * Requires: industry preference AND at least one primary position
 */
function hasJobPreferences(candidate: {
  industry_preference?: string | null;
  yacht_primary_position?: string | null;
  household_primary_position?: string | null;
}): boolean {
  // Must have industry preference
  if (!candidate.industry_preference || 
      (candidate.industry_preference !== "yacht" && 
       candidate.industry_preference !== "household" && 
       candidate.industry_preference !== "both")) {
    return false;
  }

  // Must have at least one primary position matching their industry preference
  if (candidate.industry_preference === "yacht") {
    return !!candidate.yacht_primary_position;
  }
  if (candidate.industry_preference === "household") {
    return !!candidate.household_primary_position;
  }
  if (candidate.industry_preference === "both") {
    return !!(candidate.yacht_primary_position || candidate.household_primary_position);
  }

  return false;
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
 * Build sought positions for matching (returns raw values, not display names)
 * This is used for position matching logic where we need the actual position values
 */
function buildSoughtPositionsForMatching(
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

  // Return raw position values (not display names) for matching
  return Array.from(positions).filter(Boolean);
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

  // Build the list of positions they're seeking (use raw values, not display names)
  const soughtPositions = buildSoughtPositionsForMatching(candidate, { includeSecondary: false });

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

  // PERFORMANCE: Define candidate fields once
  const candidateFields = `
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
  `;

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    supabase
      .from("candidates")
      .select(candidateFields)
      .eq("email", user.email)
      .maybeSingle(),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) return null;

  // Check if candidate has set job preferences
  const hasPreferences = hasJobPreferences({
    industry_preference: candidate.industry_preference,
    yacht_primary_position: candidate.yacht_primary_position,
    household_primary_position: candidate.household_primary_position,
  });

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

  // PERFORMANCE: Run applications and saved_jobs queries in parallel
  const [applicationsResult, savedJobsResult] = await Promise.all([
    supabase
      .from("applications")
      .select("job_id")
      .eq("candidate_id", candidate.id),
    supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("candidate_id", candidate.id),
  ]);

  const appliedJobIds = (applicationsResult.data || []).map((a) => a.job_id);
  const savedJobIds = (savedJobsResult.data || []).map((s) => s.job_id);

  // Determine industry preference for matching
  const industryPreference = candidate.industry_preference === "yacht" || candidate.industry_preference === "household" || candidate.industry_preference === "both"
    ? candidate.industry_preference as JobIndustry | "both"
    : "both";

  // Use AI matcher to get jobs with match scores
  // Use higher limit (100) and minScore 0 to get all jobs with scores
  // Filters will be applied client-side
  let matches: JobMatchResult[];
  try {
    const matchResult = await matchJobsForCandidate(supabase, {
      candidateId: candidate.id,
      limit: 100, // Higher limit to get comprehensive results
      minScore: 0, // Get all jobs with scores, not just good matches
      includeAISummary: false, // Skip AI summaries for performance
      industry: industryPreference,
    });
    matches = matchResult.matches;
  } catch (error) {
    console.error("Error using AI matcher, falling back to empty results:", error);
    matches = [];
  }

  // Map JobMatchResult[] to JobListing[] format
  // The PublicJob from the matcher should have all fields from public_jobs view
  const mappedJobs: JobListing[] = matches.map((match) => {
    const job = match.job as any; // Access all fields from public_jobs view
    
    // Determine matchType: "match" if score > 0, "none" if score is 0 or null
    const matchType: "match" | "none" = match.matchScore > 0 ? "match" : "none";

    return {
      id: job.id,
      title: job.title || "",
      vesselName: job.vessel_name || null,
      vesselType: job.vessel_type || null,
      vesselSize: job.vessel_size_meters || null,
      location: job.primary_region || null,
      contractType: job.contract_type || null,
      rotationSchedule: job.rotation_schedule || job.rotation || null,
      startDate: job.start_date || null,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      currency: job.salary_currency || "EUR",
      salaryPeriod: job.salary_period || "month",
      holidayDays: job.holiday_days || null,
      benefits: job.benefits || null,
      description: job.description || job.requirements_text || null,
      requirements: job.requirements as Record<string, unknown> | null || null,
      isUrgent: job.is_urgent || false,
      applyDeadline: job.apply_deadline || null,
      applicationsCount: job.applications_count || 0,
      viewsCount: job.views_count || 0,
      publishedAt: job.published_at || null,
      createdAt: job.created_at || new Date().toISOString(),
      // Use match score from AI matcher
      matchScore: matchType !== "none" ? match.matchScore : null,
      matchType,
      hasApplied: appliedJobIds.includes(job.id),
      isSaved: savedJobIds.includes(job.id),
    };
  });

  // Apply filters
  let filteredJobs = mappedJobs;

  if (filters?.position) {
    const searchTerm = filters.position.toLowerCase();
    filteredJobs = filteredJobs.filter((job) => {
      const titleMatch = job.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = job.description?.toLowerCase().includes(searchTerm);
      return titleMatch || descriptionMatch;
    });
  }

  if (filters?.region) {
    filteredJobs = filteredJobs.filter((job) => job.location === filters.region);
  }

  if (filters?.contractType) {
    filteredJobs = filteredJobs.filter((job) => job.contractType === filters.contractType);
  }

  if (filters?.minSalary) {
    filteredJobs = filteredJobs.filter((job) => (job.salaryMax ?? 0) >= filters.minSalary!);
  }

  if (filters?.maxSalary) {
    filteredJobs = filteredJobs.filter((job) => (job.salaryMin ?? Infinity) <= filters.maxSalary!);
  }

  if (filters?.vesselType) {
    filteredJobs = filteredJobs.filter((job) => job.vesselType === filters.vesselType);
  }

  // Sort by match score (highest first) as primary sort, then by date posted
  filteredJobs.sort((a, b) => {
    // Primary: Match score (highest first, nulls last)
    const scoreA = a.matchScore ?? -1;
    const scoreB = b.matchScore ?? -1;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    
    // Secondary: Date posted (newest first)
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  return {
    candidateId: candidate.id,
    candidatePosition: getPositionDisplayName(candidate.primary_position),
    candidateSoughtPositions: soughtPositions,
    candidatePreferredRegions: candidate.preferred_regions,
    hasJobPreferences: hasPreferences,
    jobs: filteredJobs,
    totalCount: filteredJobs.length,
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

  // PERFORMANCE: Define candidate fields once
  const candidateFields = `
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
  `;

  // PERFORMANCE: Run user, candidate-by-email, and job lookups in parallel
  const [userResult, candidateByEmailResult, jobResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    supabase
      .from("candidates")
      .select(candidateFields)
      .eq("email", user.email)
      .maybeSingle(),
    supabase
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
      .single(),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) return null;

  const job = jobResult.data;
  if (!job) return null;

  // PERFORMANCE: Run application check, saved check, and view increment in parallel
  const [applicationResult, savedJobResult] = await Promise.all([
    supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", candidate.id)
      .eq("job_id", jobId)
      .maybeSingle(),
    supabase
      .from("saved_jobs")
      .select("id")
      .eq("candidate_id", candidate.id)
      .eq("job_id", jobId)
      .maybeSingle(),
    // Fire-and-forget view increment (don't await result)
    supabase.rpc("increment_job_views", { p_job_id: jobId }),
  ]);

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
    hasApplied: !!applicationResult.data,
    isSaved: !!savedJobResult.data,
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

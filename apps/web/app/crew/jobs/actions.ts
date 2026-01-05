"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncJobApplication } from "@/lib/vincere/sync-service";
import { getPositionDisplayName } from "@/lib/utils/format-position";

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
  matchType: "exact" | "related" | "none";
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
  vesselType?: string;
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
 * Role categories and related positions for better matching
 * Crew members often look for roles in their category or adjacent roles
 */
const ROLE_CATEGORIES: Record<string, string[]> = {
  // Interior/Service department
  interior: [
    "chief stew", "chief stewardess", "head stew",
    "second stew", "third stew", "stew", "stewardess",
    "purser", "interior manager",
    "housekeeper", "head of house", "house manager",
    "butler", "service stew"
  ],
  // Deck department
  deck: [
    "captain", "master",
    "chief officer", "first officer", "mate",
    "second officer", "third officer",
    "bosun", "lead deckhand", "senior deckhand",
    "deckhand", "deck stew"
  ],
  // Engineering department
  engineering: [
    "chief engineer", "first engineer",
    "second engineer", "third engineer",
    "eto", "electro-technical officer",
    "engineer"
  ],
  // Galley/Culinary
  galley: [
    "head chef", "executive chef", "chef",
    "sous chef", "crew chef",
    "cook"
  ],
  // Specialty roles
  specialty: [
    "spa manager", "masseuse", "beautician",
    "nurse", "nanny", "tutor",
    "personal assistant", "pa"
  ],
};

/**
 * Get related roles for a given position
 */
function getRelatedRoles(position: string): string[] {
  const normalizedPos = position.toLowerCase().trim();

  for (const [_category, roles] of Object.entries(ROLE_CATEGORIES)) {
    if (roles.some(role => normalizedPos.includes(role) || role.includes(normalizedPos))) {
      return roles;
    }
  }

  return [];
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
 *
 * This uses the candidate's explicit job preferences:
 * - positions_held: What roles they've done before (and can do again)
 * - primary_position: Their current/main role
 * - secondary_positions: Other roles they're actively looking for
 *
 * Match levels:
 * - "exact": Job matches their primary position or explicitly sought positions
 * - "related": Job is in their department (same position_category)
 * - "none": Different department entirely
 */
function getPositionMatchLevel(
  jobTitle: string,
  candidateSoughtPositions: string[],
  candidatePrimaryPosition: string | null,
  candidatePositionCategory: string | null
): "exact" | "related" | "none" {
  const normalizedJob = normalizePosition(jobTitle);

  // Check for exact matches against positions the candidate is looking for
  for (const position of candidateSoughtPositions) {
    const normalizedPos = normalizePosition(position);

    // Check if job title contains this position or vice versa
    if (normalizedJob.includes(normalizedPos) || normalizedPos.includes(normalizedJob)) {
      return "exact";
    }

    // Check word-level matching for partial matches
    // e.g., "Second Stew" matches "2nd Stewardess"
    const posWords = normalizedPos.split(" ");
    const jobWords = normalizedJob.split(" ");

    // If key role word matches (stew, chef, engineer, deckhand, etc.)
    const roleWords = ["stew", "chef", "cook", "engineer", "deckhand", "officer", "captain", "bosun", "purser", "nanny", "nurse"];
    const matchingRoleWord = roleWords.find(rw =>
      posWords.some(pw => pw.includes(rw)) && jobWords.some(jw => jw.includes(rw))
    );

    if (matchingRoleWord) {
      // Check if seniority level matches too
      const seniorityWords = ["chief", "head", "lead", "senior", "first", "second", "third", "junior", "trainee"];
      const posSeniority = seniorityWords.find(sw => posWords.some(pw => pw.includes(sw)));
      const jobSeniority = seniorityWords.find(sw => jobWords.some(jw => jw.includes(sw)));

      // If seniority matches or neither has explicit seniority, it's exact
      if (posSeniority === jobSeniority || (!posSeniority && !jobSeniority)) {
        return "exact";
      }
      // Same role type but different seniority = related (they might be interested)
      return "related";
    }
  }

  // If no exact match, check if job is in the same department category
  if (candidatePositionCategory) {
    const categoryRoles = ROLE_CATEGORIES[candidatePositionCategory];
    if (categoryRoles) {
      const jobMatchesCategory = categoryRoles.some(role =>
        normalizedJob.includes(role)
      );
      if (jobMatchesCategory) {
        return "related";
      }
    }
  }

  return "none";
}

/**
 * Build the list of positions a candidate is seeking
 * This combines their explicit preferences with their experience
 */
function buildSoughtPositions(candidate: {
  primary_position: string | null;
  secondary_positions: string[] | null;
  positions_held: string[] | null;
}): string[] {
  const positions = new Set<string>();

  // Primary position is always included
  if (candidate.primary_position) {
    positions.add(candidate.primary_position);
  }

  // Secondary positions are explicitly what they're looking for
  if (candidate.secondary_positions?.length) {
    candidate.secondary_positions.forEach(p => positions.add(p));
  }

  // Positions they've held indicate roles they can fill
  // Deduplicate and limit to unique roles
  if (candidate.positions_held?.length) {
    const uniqueHeld = [...new Set(candidate.positions_held)];
    uniqueHeld.forEach(p => positions.add(p));
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
 * - Role match is the PRIMARY factor (0-50 points)
 *   - Exact role match (job matches a position they're seeking): 50 points
 *   - Related role (same department but different role): 35 points
 *   - No role match: 0 points (different department = not a good match)
 * - Region match: 25 points
 * - Contract type: 15 points
 * - Salary fit: 10 points
 *
 * The key insight: match against what they're LOOKING FOR, not just their current role
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
    positions_held: string[] | null;
    position_category: string | null;
    preferred_regions: string[] | null;
    preferred_contract_types: string[] | null;
    desired_salary_min: number | null;
    desired_salary_max: number | null;
    years_experience: number | null;
    has_stcw: boolean;
    has_eng1: boolean;
  }
): { score: number; matchType: "exact" | "related" | "none" } {
  let score = 0;

  // Build the list of positions they're seeking
  const soughtPositions = buildSoughtPositions(candidate);

  // Position match is the most important factor (50 points max)
  const matchType = getPositionMatchLevel(
    job.title,
    soughtPositions,
    candidate.primary_position,
    candidate.position_category
  );

  if (matchType === "exact") {
    score += 50;
  } else if (matchType === "related") {
    score += 35;
  }
  // No match = 0 points - different department jobs shouldn't score high

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

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) return null;

  // Get candidate with all position-related fields
  const { data: candidate } = await supabase
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
      has_eng1
    `
    )
    .eq("user_id", userData.id)
    .single();

  if (!candidate) return null;

  // Build the list of positions this candidate is seeking
  const soughtPositions = buildSoughtPositions({
    primary_position: candidate.primary_position,
    secondary_positions: candidate.secondary_positions,
    positions_held: candidate.positions_held,
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
    query = query.ilike("primary_region", `%${filters.region}%`);
  }
  if (filters?.contractType) {
    query = query.eq("contract_type", filters.contractType);
  }
  if (filters?.minSalary) {
    query = query.gte("salary_max", filters.minSalary);
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
      matchScore,
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

  // Get user and candidate
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) return null;

  const { data: candidate } = await supabase
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
      has_eng1
    `
    )
    .eq("user_id", userData.id)
    .single();

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
    .single();

  // Check if saved
  const { data: savedJob } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("candidate_id", candidate.id)
    .eq("job_id", jobId)
    .single();

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
    matchScore,
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

  // Get user and candidate
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    return { success: false, error: "Candidate profile not found" };
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
    .single();

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

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

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

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

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

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

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

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncJobApplication } from "@/lib/vincere/sync-service";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import { REGION_GROUPS } from "@/lib/utils/job-helpers";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { POSITION_MAPPING } from "@/lib/vincere/constants";

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
  // Relevance info (replaces AI matching)
  relevanceTier: 1 | 2 | 3;  // 1 = exact position match, 2 = same department, 3 = other
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
 * Get the department/category for a position using the comprehensive POSITION_MAPPING
 * from vincere/constants.ts which contains 100+ positions mapped to categories
 *
 * Categories: deck, interior, engineering, galley, childcare, medical, security,
 *             management, villa, other
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

  // Try partial matching for positions with extra words (e.g., "Chief Stew for 55m yacht")
  for (const [key, value] of Object.entries(POSITION_MAPPING)) {
    if (posLower.includes(key) || key.includes(posLower)) {
      return value.category;
    }
  }

  return null;
}

/**
 * Calculate relevance tier for a job based on candidate's sought positions
 * Tier 1: Exact position match (job title matches candidate's sought positions)
 * Tier 2: Same department (e.g., job is for "Deckhand" and candidate seeks "Bosun")
 * Tier 3: Other jobs (different department or no match)
 */
function calculateRelevanceTier(
  jobTitle: string,
  candidateSoughtPositions: string[]
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

  // Fetch all public jobs directly from the database
  // Note: public_jobs is a view that excludes vessel_name for confidentiality
  const { data: jobs, error: jobsError } = await supabase
    .from("public_jobs")
    .select(`
      id,
      title,
      description,
      position_category,
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
      benefits,
      requirements,
      is_urgent,
      apply_deadline,
      applications_count,
      views_count,
      published_at,
      created_at
    `)
    .limit(200);

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError);
    return null;
  }

  // Build the list of positions for matching (using raw position values)
  const soughtPositionsForMatching = buildSoughtPositionsForMatching({
    primary_position: candidate.primary_position,
    secondary_positions: candidate.secondary_positions,
    yacht_primary_position: candidate.yacht_primary_position,
    yacht_secondary_positions: candidate.yacht_secondary_positions,
    household_primary_position: candidate.household_primary_position,
    household_secondary_positions: candidate.household_secondary_positions,
    industry_preference: candidate.industry_preference,
    candidate_type: candidate.candidate_type,
  });

  // Map jobs to JobListing[] format with relevance tiers
  // Note: public_jobs view doesn't include vessel_name (confidential) or holiday_days
  const mappedJobs: JobListing[] = (jobs || []).map((job) => {
    // Calculate relevance tier based on position matching
    const relevanceTier = calculateRelevanceTier(job.title || "", soughtPositionsForMatching);

    return {
      id: job.id,
      title: job.title || "",
      vesselName: null, // Not exposed in public_jobs view for confidentiality
      vesselType: job.vessel_type || null,
      vesselSize: job.vessel_size_meters || null,
      location: job.primary_region || null,
      contractType: job.contract_type || null,
      rotationSchedule: job.rotation_schedule || null,
      startDate: job.start_date || null,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      currency: job.salary_currency || "EUR",
      salaryPeriod: job.salary_period || "month",
      holidayDays: null, // Not exposed in public_jobs view
      benefits: job.benefits || null,
      description: job.description || null,
      requirements: job.requirements as Record<string, unknown> | null || null,
      isUrgent: job.is_urgent || false,
      applyDeadline: job.apply_deadline || null,
      applicationsCount: job.applications_count || 0,
      viewsCount: job.views_count || 0,
      publishedAt: job.published_at || null,
      createdAt: job.created_at || new Date().toISOString(),
      // Relevance tier instead of match score
      relevanceTier,
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

  // Sort by: relevance tier first, then date posted (newest first)
  // Tier 1 = exact position match, Tier 2 = same department, Tier 3 = other
  filteredJobs.sort((a, b) => {
    // Primary: Relevance tier (exact match first, then same department, then other)
    if (a.relevanceTier !== b.relevanceTier) {
      return a.relevanceTier - b.relevanceTier;
    }

    // Secondary: Date posted (newest first within each tier)
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
    household_secondary_positions,
    industry_preference,
    candidate_type
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

  // Build candidate's sought positions list for relevance calculation
  const candidateSoughtPositions: string[] = [];
  if (candidate.yacht_primary_position) candidateSoughtPositions.push(candidate.yacht_primary_position);
  if (candidate.household_primary_position) candidateSoughtPositions.push(candidate.household_primary_position);
  if (Array.isArray(candidate.yacht_secondary_positions)) {
    candidateSoughtPositions.push(...candidate.yacht_secondary_positions);
  }
  if (Array.isArray(candidate.household_secondary_positions)) {
    candidateSoughtPositions.push(...candidate.household_secondary_positions);
  }
  if (candidate.primary_position) candidateSoughtPositions.push(candidate.primary_position);
  if (Array.isArray(candidate.secondary_positions)) {
    candidateSoughtPositions.push(...candidate.secondary_positions);
  }

  // Calculate relevance tier (replaces AI match score)
  const relevanceTier = calculateRelevanceTier(job.title, candidateSoughtPositions);

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
    relevanceTier,
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

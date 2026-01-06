"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import {
  calculateProfileCompletion,
  type ProfileCompletionAction,
} from "@/lib/profile-completion";

/**
 * Dashboard data types
 */
export interface DashboardCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryPosition: string | null;
  profilePhotoUrl: string | null;
  availabilityStatus: "available" | "looking" | "employed" | "unavailable";
  availableFrom: string | null;
  // Profile completeness fields
  hasPhoto: boolean;
  hasCv: boolean;
  hasStcw: boolean;
  hasEng1: boolean;
  yearsExperience: number | null;
  preferredYachtTypes: string[] | null;
  preferredRegions: string[] | null;
}

export type ProfileAction = ProfileCompletionAction;

export interface MatchedJob {
  id: string;
  position: string;
  vesselName: string | null;
  vesselSize: number | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  matchPercentage?: number; // Optional - only set when position is relevant
  postedDays: number;
  urgent: boolean;
  contractType: string | null;
}

export interface CandidateApplication {
  id: string;
  jobId: string | null;
  position: string;
  vesselName: string | null;
  appliedDate: string;
  status: "applied" | "in_progress"; // Simplified per PRD
}

export interface Alert {
  id: string;
  type: "certification" | "message" | "application";
  title: string;
  description: string;
  date: string;
  urgent: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export interface JobPreferences {
  industryPreference: "yacht" | "household" | "both" | null;
  yachtPrimaryPosition: string | null;
  householdPrimaryPosition: string | null;
  regions: string[];
  householdLocations: string[];
  availabilityStatus: string | null;
  preferencesCompletedAt: string | null;
}

export interface DashboardData {
  candidate: DashboardCandidate;
  profileCompleteness: number;
  profileActions: ProfileAction[];
  matchedJobs: MatchedJob[];
  applications: CandidateApplication[];
  alerts: Alert[];
  preferences: JobPreferences;
  isIdentityVerified: boolean;
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
 * Priority: Preference positions (WANT) > Profile positions (DO)
 * Note: Historical positions (positions_held) are intentionally excluded
 * to ensure job matching only considers current/desired roles.
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

  // Note: We intentionally do NOT include positions_held (historical positions)
  // for job matching. A Captain who previously worked as a Stewardess shouldn't
  // see interior jobs in their "Jobs For You" - only current/desired positions matter.

  // Format all position names for display
  return Array.from(positions)
    .filter(Boolean)
    .map(p => getPositionDisplayName(p));
}

/**
 * Calculate a match score based on candidate profile and job
 */
function calculateMatchScore(
  job: {
    title: string;
    primary_region: string | null;
    contract_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
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
    // Preference positions (what they WANT to do)
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

  // Position match is the most important factor (50 points max)
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
 * Fetch dashboard data for the authenticated candidate
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // Get user record (may not exist for new signups)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const candidateFields = `
    id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    nationality,
    current_location,
    candidate_type,
    primary_position,
    secondary_positions,
    positions_held,
    position_category,
    years_experience,
    avatar_url,
    availability_status,
    available_from,
    preferred_yacht_types,
    preferred_regions,
    preferred_contract_types,
    desired_salary_min,
    desired_salary_max,
    has_stcw,
    stcw_expiry,
    has_eng1,
    eng1_expiry,
    verification_tier,
    industry_preference,
    yacht_primary_position,
    yacht_secondary_positions,
    household_primary_position,
    household_secondary_positions,
    household_locations,
    preferences_completed_at,
    user_id
  `;

  // Try to get candidate by user_id first (if user record exists)
  let candidate = null;
  let candidateError = null;

  if (userData) {
    const result = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userData.id)
      .single();
    candidate = result.data;
    candidateError = result.error;
  }

  // If no candidate found by user_id, try by email (for Vincere-imported candidates)
  if (!candidate) {
    const result = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("email", user.email)
      .single();
    candidate = result.data;
    candidateError = result.error;

    // If found by email and we have a user record, link them
    if (candidate && userData && !candidate.user_id) {
      await supabase
        .from("candidates")
        .update({ user_id: userData.id })
        .eq("id", candidate.id);
      candidate.user_id = userData.id;
    }
  }

  if (candidateError && candidateError.code && candidateError.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error, just no candidate found)
    console.error("Error fetching candidate:", candidateError);
    return null;
  }

  if (!candidate) {
    // No candidate record exists - user needs to create their profile
    // Return null to show onboarding/profile creation flow
    return null;
  }

  // Get documents separately (no FK constraint exists for entity_id)
  const { data: documents } = await supabase
    .from("documents")
    .select("id, type, name")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidate.id);

  // Attach documents to candidate for profile completeness calculation
  const candidateWithDocs = {
    ...candidate,
    documents: documents || [],
  };

  // Calculate profile completeness
  const { score, actions } = calculateProfileCompletion({
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
    documents: candidateWithDocs.documents,
  });

  // Get more jobs to find the most relevant matches
  // Fetch 30 recent jobs, then sort by relevance and return top 4
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      vessel_name,
      vessel_size_meters,
      primary_region,
      salary_min,
      salary_max,
      salary_currency,
      contract_type,
      is_urgent,
      created_at
    `
    )
    .eq("status", "open")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  // Calculate match scores for all jobs and sort by relevance
  const jobsWithScores = (jobs || []).map((job) => {
    // Calculate days difference server-side to ensure consistent SSR/client rendering
    const createdAt = new Date(job.created_at);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate match score using proper matching logic
    const { score, matchType } = calculateMatchScore(
      {
        title: job.title,
        primary_region: job.primary_region,
        contract_type: job.contract_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
      },
      {
        primary_position: candidate.primary_position,
        secondary_positions: candidate.secondary_positions || null,
        positions_held: candidate.positions_held || null,
        position_category: candidate.position_category || null,
        preferred_regions: candidate.preferred_regions || null,
        preferred_contract_types: candidate.preferred_contract_types || null,
        desired_salary_min: candidate.desired_salary_min || null,
        desired_salary_max: candidate.desired_salary_max || null,
        // Preference positions (what they WANT to do)
        yacht_primary_position: candidate.yacht_primary_position || null,
        yacht_secondary_positions: candidate.yacht_secondary_positions || null,
        household_primary_position: candidate.household_primary_position || null,
        household_secondary_positions: candidate.household_secondary_positions || null,
        industry_preference: candidate.industry_preference || null,
        candidate_type: candidate.candidate_type || null,
      }
    );

    return {
      job,
      score,
      matchType,
      diffDays,
    };
  });

  // Sort by match score (highest first), then by recency for ties
  // Jobs with "none" match type get score 0 for sorting purposes
  jobsWithScores.sort((a, b) => {
    // First, prioritize jobs with any match over "none" matches
    const aHasMatch = a.matchType !== "none";
    const bHasMatch = b.matchType !== "none";
    if (aHasMatch && !bHasMatch) return -1;
    if (!aHasMatch && bHasMatch) return 1;

    // Then sort by score (higher is better)
    if (b.score !== a.score) return b.score - a.score;

    // For same score, prefer more recent jobs
    return a.diffDays - b.diffDays;
  });

  // Filter out jobs with no position match - only show relevant jobs
  const relevantJobs = jobsWithScores.filter(j => j.matchType !== "none");

  // Take the top 4 most relevant jobs (may be fewer if not enough matches)
  const topJobs = relevantJobs.slice(0, 4);

  // Map to MatchedJob format
  const matchedJobs: MatchedJob[] = topJobs.map(({ job, score, matchType, diffDays }) => {
    // Only include matchPercentage if position is relevant (not "none")
    const jobData: MatchedJob = {
      id: job.id,
      position: job.title,
      vesselName: job.vessel_name,
      vesselSize: job.vessel_size_meters,
      location: job.primary_region,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: job.salary_currency || "EUR",
      postedDays: diffDays,
      urgent: job.is_urgent || false,
      contractType: job.contract_type,
    };

    // Only set matchPercentage if position is relevant
    if (matchType !== "none") {
      jobData.matchPercentage = score;
    }

    return jobData;
  });

  // Get candidate's applications (simplified status per PRD)
  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      stage,
      applied_at,
      job:jobs (
        id,
        title,
        vessel_name
      )
    `
    )
    .eq("candidate_id", candidate.id)
    .order("applied_at", { ascending: false })
    .limit(10);

  // Map applications with simplified status
  const mappedApplications: CandidateApplication[] = (applications || []).map(
    (app) => {
      // Per PRD: candidates only see "Applied" or "In Progress"
      // applied/screening = "applied"
      // shortlisted/submitted/interview/offer = "in_progress"
      // rejected/placed are filtered out or shown differently
      const simpleStatus: "applied" | "in_progress" =
        app.stage === "applied" || app.stage === "screening"
          ? "applied"
          : "in_progress";

      return {
        id: app.id,
        jobId: (app.job as any)?.id || null,
        position: (app.job as any)?.title || "Unknown Position",
        vesselName: (app.job as any)?.vessel_name || null,
        appliedDate: app.applied_at,
        status: simpleStatus,
      };
    }
  );

  // Build alerts
  const alerts: Alert[] = [];

  // Check certificate expiry alerts
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Helper to format date consistently (avoid toLocaleDateString for hydration)
  const formatExpiryDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (candidate.stcw_expiry) {
    const stcwExpiry = new Date(candidate.stcw_expiry);
    if (stcwExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: "stcw-expiry",
        type: "certification",
        title: "STCW Expiring Soon",
        description: `Your STCW certificate expires on ${formatExpiryDate(stcwExpiry)}. Renew now to avoid gaps.`,
        date: now.toISOString(),
        urgent: stcwExpiry <= thirtyDaysFromNow,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
      });
    } else if (stcwExpiry <= ninetyDaysFromNow) {
      alerts.push({
        id: "stcw-expiry",
        type: "certification",
        title: "STCW Expiring in 90 Days",
        description: `Your STCW certificate expires on ${formatExpiryDate(stcwExpiry)}. Consider renewing soon.`,
        date: now.toISOString(),
        urgent: false,
        actionLabel: "View Details",
        actionHref: "/crew/documents#certificates",
      });
    }
  }

  if (candidate.eng1_expiry) {
    const eng1Expiry = new Date(candidate.eng1_expiry);
    if (eng1Expiry <= thirtyDaysFromNow) {
      alerts.push({
        id: "eng1-expiry",
        type: "certification",
        title: "ENG1 Expiring Soon",
        description: `Your ENG1 medical certificate expires on ${formatExpiryDate(eng1Expiry)}.`,
        date: now.toISOString(),
        urgent: eng1Expiry <= thirtyDaysFromNow,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
      });
    }
  }

  // Get certifications from candidate_certifications for expiry alerts
  const { data: certifications } = await supabase
    .from("candidate_certifications")
    .select("id, certification_type, custom_name, expiry_date")
    .eq("candidate_id", candidate.id)
    .eq("has_certification", true)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  for (const cert of certifications || []) {
    if (cert.expiry_date) {
      const expiryDate = new Date(cert.expiry_date);
      const isUrgent = expiryDate <= thirtyDaysFromNow;

      // Avoid duplicate alerts for STCW/ENG1
      const certName = cert.custom_name || cert.certification_type;
      if (
        certName.toLowerCase().includes("stcw") ||
        certName.toLowerCase().includes("eng1")
      ) {
        continue;
      }

      alerts.push({
        id: `cert-${cert.id}`,
        type: "certification",
        title: `${certName} Expiring`,
        description: `Your ${certName} expires on ${formatExpiryDate(expiryDate)}.`,
        date: now.toISOString(),
        urgent: isUrgent,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
      });
    }
  }

  // Transform candidate data
  const dashboardCandidate: DashboardCandidate = {
    id: candidate.id,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email || "",
    primaryPosition: candidate.primary_position,
    profilePhotoUrl: candidate.avatar_url,
    availabilityStatus: candidate.availability_status || "looking",
    availableFrom: candidate.available_from,
    hasPhoto: !!candidate.avatar_url,
    hasCv: (candidateWithDocs.documents as any[]).some((d) => d.type === "cv"),
    hasStcw: candidate.has_stcw || false,
    hasEng1: candidate.has_eng1 || false,
    yearsExperience: candidate.years_experience,
    preferredYachtTypes: candidate.preferred_yacht_types,
    preferredRegions: candidate.preferred_regions,
  };

  // Build preferences object using new preference fields
  const preferences: JobPreferences = {
    industryPreference: candidate.industry_preference as "yacht" | "household" | "both" | null,
    yachtPrimaryPosition: candidate.yacht_primary_position,
    householdPrimaryPosition: candidate.household_primary_position,
    regions: candidate.preferred_regions || [],
    householdLocations: candidate.household_locations || [],
    availabilityStatus: candidate.availability_status,
    preferencesCompletedAt: candidate.preferences_completed_at,
  };

  // Check if candidate has identity verification (identity, verified, or premium tier)
  const identityVerifiedTiers = new Set(["identity", "verified", "premium"]);
  const isIdentityVerified = identityVerifiedTiers.has(candidate.verification_tier || "");

  return {
    candidate: dashboardCandidate,
    profileCompleteness: score,
    profileActions: actions,
    matchedJobs,
    applications: mappedApplications,
    alerts,
    preferences,
    isIdentityVerified,
  };
}

/**
 * Update candidate availability status
 */
export async function updateAvailability(
  status: "available" | "looking" | "employed" | "unavailable",
  availableFrom?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const updateData: Record<string, unknown> = {
    availability_status: status,
    updated_at: new Date().toISOString(),
  };

  if (availableFrom) {
    updateData.available_from = availableFrom;
  }

  // Try update by user_id first, then by email
  let error = null;

  if (userData) {
    const result = await supabase
      .from("candidates")
      .update(updateData)
      .eq("user_id", userData.id);
    error = result.error;

    // Check if any rows were updated
    if (!error) {
      revalidatePath("/crew/dashboard");
      return { success: true };
    }
  }

  // Fallback to email-based update (for Vincere-imported candidates)
  const emailResult = await supabase
    .from("candidates")
    .update(updateData)
    .eq("email", user.email);

  if (emailResult.error) {
    console.error("Error updating availability:", emailResult.error);
    return { success: false, error: "Failed to update availability" };
  }

  revalidatePath("/crew/dashboard");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkProfileCompleteness } from "@lighthouse/ai/matcher";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { syncCandidateUpdate } from "@/lib/vincere/sync-service";
import { POSITION_MAPPING } from "@/lib/vincere/constants";
import { normalizePosition } from "@/lib/utils/position-normalization";
import { processInitialJobMatches } from "@/lib/services/job-alert-service";

export interface JobPreferencesData {
  industryPreference: "yacht" | "household" | "both" | null;
  // Yacht preferences
  yachtPrimaryPosition: string | null;
  yachtSecondaryPositions: string[];
  yachtSizeMin: number | null;
  yachtSizeMax: number | null;
  yachtTypes: string[]; // "motor" | "sailing"
  contractTypes: string[];
  regions: string[];
  leavePackage: string | null;
  // Salary & Availability (shared)
  salaryCurrency: string;
  salaryMin: number | null;
  salaryMax: number | null;
  availabilityStatus: "available" | "looking" | "employed" | "unavailable";
  availableFrom: string | null;
  // Household preferences
  householdPrimaryPosition: string | null;
  householdSecondaryPositions: string[];
  householdLocations: string[];
  livingArrangement: "live_in" | "live_out" | "flexible" | null;
  // Couple info
  isCouple: boolean;
  partnerName: string | null;
  partnerPosition: string | null;
}

export async function updateJobPreferences(
  candidateId: string,
  data: Partial<JobPreferencesData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.industryPreference !== undefined) {
    updateData.industry_preference = data.industryPreference;
  }

  // Yacht preferences
  if (data.yachtPrimaryPosition !== undefined) {
    updateData.yacht_primary_position = data.yachtPrimaryPosition;
  }
  if (data.yachtSecondaryPositions !== undefined) {
    updateData.yacht_secondary_positions = data.yachtSecondaryPositions;
  }
  if (data.yachtSizeMin !== undefined) {
    updateData.preferred_yacht_size_min = data.yachtSizeMin;
  }
  if (data.yachtSizeMax !== undefined) {
    updateData.preferred_yacht_size_max = data.yachtSizeMax;
  }
  if (data.yachtTypes !== undefined) {
    updateData.preferred_yacht_types = data.yachtTypes;
  }
  if (data.contractTypes !== undefined) {
    updateData.preferred_contract_types = data.contractTypes;
  }
  if (data.regions !== undefined) {
    updateData.preferred_regions = data.regions;
  }
  if (data.leavePackage !== undefined) {
    updateData.leave_package = data.leavePackage;
  }

  // Salary & Availability
  if (data.salaryCurrency !== undefined) {
    updateData.salary_currency = data.salaryCurrency;
  }
  if (data.salaryMin !== undefined) {
    updateData.desired_salary_min = data.salaryMin;
  }
  if (data.salaryMax !== undefined) {
    updateData.desired_salary_max = data.salaryMax;
  }
  if (data.availabilityStatus !== undefined) {
    updateData.availability_status = data.availabilityStatus;
  }
  if (data.availableFrom !== undefined) {
    updateData.available_from = data.availableFrom;
  }

  // Household preferences
  if (data.householdPrimaryPosition !== undefined) {
    updateData.household_primary_position = data.householdPrimaryPosition;
  }
  if (data.householdSecondaryPositions !== undefined) {
    updateData.household_secondary_positions = data.householdSecondaryPositions;
  }
  if (data.householdLocations !== undefined) {
    updateData.household_locations = data.householdLocations;
  }
  if (data.livingArrangement !== undefined) {
    updateData.living_arrangement = data.livingArrangement;
  }

  // Couple info
  if (data.isCouple !== undefined) {
    updateData.is_couple = data.isCouple;
  }
  if (data.partnerName !== undefined) {
    updateData.partner_name = data.partnerName;
  }
  if (data.partnerPosition !== undefined) {
    updateData.partner_position = data.partnerPosition;
  }

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("[updateJobPreferences] Error:", error);
    return { success: false, error: error.message };
  }

  // Fire-and-forget sync to Vincere for job preference fields
  // The sync fetches fresh candidate data from the database and maps all preference fields:
  // desiredSalary, yachtSize, yachtType, contractType, startDate, desiredLocation, couple info
  syncCandidateUpdate(candidateId).catch((err) => {
    // Log but don't fail the local update
    console.error("[updateJobPreferences] Vincere sync error:", err);
  });

  revalidatePath("/crew/preferences");
  revalidatePath("/crew/dashboard");

  return { success: true };
}

export async function markPreferencesComplete(
  candidateId: string
): Promise<{ success: boolean; error?: string; jobMatchResult?: { totalMatches: number; notificationsCreated: number; emailSent: boolean } }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("candidates")
    .update({
      preferences_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("[markPreferencesComplete] Error:", error);
    return { success: false, error: error.message };
  }

  // Process initial job matches - find all open jobs matching the candidate's preferences
  // and send notifications + summary email
  let jobMatchResult: { totalMatches: number; notificationsCreated: number; emailSent: boolean } | undefined;
  try {
    jobMatchResult = await processInitialJobMatches(candidateId);
    console.log("[markPreferencesComplete] Initial job matches processed:", jobMatchResult);
  } catch (err) {
    // Log but don't fail the preferences completion
    console.error("[markPreferencesComplete] Error processing initial job matches:", err);
  }

  revalidatePath("/crew/preferences");
  revalidatePath("/crew/dashboard");
  revalidatePath("/crew/notifications");

  return { success: true, jobMatchResult };
}

// ----------------------------------------------------------------------------
// JOB MATCHES - Direct Supabase query with relevance tiers (no AI)
// ----------------------------------------------------------------------------

export interface ProfileStatus {
  completeness: number;
  canQuickApply: boolean;
  missingFields: string[];
  hasCV: boolean;
  candidateId: string;
}

export interface JobMatchesOptions {
  limit?: number;
  industry?: "yacht" | "household" | "both";
}

// Simplified job match result (no AI scores)
export interface SimpleJobMatch {
  job: {
    id: string;
    title: string;
    vesselName: string | null;
    vesselType: string | null;
    vesselSize: number | null;
    location: string | null;
    contractType: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    startDate: string | null;
    isUrgent: boolean;
    publishedAt: string | null;
  };
  relevanceTier: 1 | 2 | 3;
  hasApplied: boolean;
  canQuickApply: boolean;
}

export interface JobMatchesResult {
  success: boolean;
  error?: string;
  matches?: SimpleJobMatch[];
  profile?: ProfileStatus;
  metadata?: {
    totalJobsAnalyzed: number;
    candidateId: string;
    industry: string;
    limit: number;
  };
}

// ----------------------------------------------------------------------------
// RELEVANCE TIER HELPERS
// ----------------------------------------------------------------------------

function getPositionDepartment(position: string): string | null {
  if (!position) return null;
  const posLower = position.toLowerCase().replace(/_/g, " ").trim();

  const mapping = POSITION_MAPPING[posLower];
  if (mapping) {
    return mapping.category;
  }

  for (const [key, value] of Object.entries(POSITION_MAPPING)) {
    if (posLower.includes(key) || key.includes(posLower)) {
      return value.category;
    }
  }

  return null;
}

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

    if (normalizedJob.includes(normalizedPos) || normalizedPos.includes(normalizedJob)) {
      return "match";
    }
  }

  return "none";
}

function calculateRelevanceTier(
  jobTitle: string,
  candidateSoughtPositions: string[]
): 1 | 2 | 3 {
  const matchLevel = getPositionMatchLevel(jobTitle, candidateSoughtPositions);
  if (matchLevel === "match") {
    return 1;
  }

  const jobDepartment = getPositionDepartment(jobTitle);
  if (jobDepartment) {
    for (const pos of candidateSoughtPositions) {
      if (getPositionDepartment(pos) === jobDepartment) {
        return 2;
      }
    }
  }

  return 3;
}

export async function loadJobMatches(
  candidateId: string,
  options: JobMatchesOptions = {}
): Promise<JobMatchesResult> {
  console.log("[loadJobMatches] Entry:", { candidateId, options });
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[loadJobMatches] Not authenticated");
    return { success: false, error: "Not authenticated" };
  }

  const { limit = 10, industry = "both" } = options;

  const candidateSelectFields = `
    id, first_name, last_name, email, phone,
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
    verification_tier
  `;

  // PERFORMANCE: Run user, candidate-by-email, and candidate-by-id lookups in parallel
  const [userResult, candidateByEmailResult, candidateByIdResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("candidates").select(candidateSelectFields).eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    candidateId
      ? supabase.from("candidates").select(candidateSelectFields).eq("id", candidateId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Priority: email > candidateId > user_id
  let candidate = candidateByEmailResult.data || candidateByIdResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) {
    console.error("[loadJobMatches] Candidate fetch error: No candidate found for user", user.id);
    return { success: false, error: "Could not load candidate profile" };
  }

  // Check profile completeness
  const profileStatus = checkProfileCompleteness(candidate);

  // Check if candidate has CV uploaded
  const hasCV = await candidateHasCV(supabase, candidate.id);

  // Build candidate's sought positions list
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

  // Fetch public jobs
  const { data: jobs, error: jobsError } = await supabase
    .from("public_jobs")
    .select(`
      id,
      title,
      vessel_name,
      vessel_type,
      vessel_size_meters,
      primary_region,
      contract_type,
      salary_min,
      salary_max,
      salary_currency,
      start_date,
      is_urgent,
      published_at
    `)
    .limit(100);

  if (jobsError || !jobs) {
    console.error("[loadJobMatches] Error fetching jobs:", jobsError);
    return { success: false, error: "Could not load jobs" };
  }

  // Fetch applied job IDs
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id")
    .eq("candidate_id", candidate.id);

  const appliedJobIds = new Set((applications || []).map((a) => a.job_id));

  // Quick apply requires both profile completeness AND CV
  const canQuickApply = profileStatus.canQuickApply && hasCV;

  // Calculate relevance tiers and build matches
  const allMatches: SimpleJobMatch[] = jobs.map((job) => {
    const relevanceTier = calculateRelevanceTier(job.title || "", candidateSoughtPositions);
    const hasApplied = appliedJobIds.has(job.id);

    return {
      job: {
        id: job.id,
        title: job.title || "",
        vesselName: job.vessel_name || null,
        vesselType: job.vessel_type || null,
        vesselSize: job.vessel_size_meters || null,
        location: job.primary_region || null,
        contractType: job.contract_type || null,
        salaryMin: job.salary_min || null,
        salaryMax: job.salary_max || null,
        currency: job.salary_currency || "EUR",
        startDate: job.start_date || null,
        isUrgent: job.is_urgent || false,
        publishedAt: job.published_at || null,
      },
      relevanceTier,
      hasApplied,
      canQuickApply: canQuickApply && !hasApplied,
    };
  });

  // Sort by: relevance tier first, then date posted (newest first)
  // Tier 1 = exact position match, Tier 2 = same department, Tier 3 = other
  allMatches.sort((a, b) => {
    // Primary: Relevance tier (exact match first, then same department, then other)
    if (a.relevanceTier !== b.relevanceTier) {
      return a.relevanceTier - b.relevanceTier;
    }

    // Secondary: Date posted (newest first within each tier)
    const dateA = a.job.publishedAt ? new Date(a.job.publishedAt).getTime() : 0;
    const dateB = b.job.publishedAt ? new Date(b.job.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Only return tier 1 and 2 matches (relevant jobs)
  const relevantMatches = allMatches.filter((m) => m.relevanceTier <= 2).slice(0, limit);

  return {
    success: true,
    matches: relevantMatches,
    profile: {
      completeness: profileStatus.completeness,
      canQuickApply,
      missingFields: profileStatus.missingFields,
      hasCV,
      candidateId: candidate.id,
    },
    metadata: {
      totalJobsAnalyzed: jobs.length,
      candidateId: candidate.id,
      industry,
      limit,
    },
  };
}

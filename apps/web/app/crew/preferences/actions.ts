"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  matchJobsForCandidate,
  checkProfileCompleteness,
  type JobIndustry,
  type JobMatchResult,
} from "@lighthouse/ai/matcher";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { syncCandidateUpdate } from "@/lib/vincere/sync-service";

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
  // Maps to Vincere custom fields: desiredSalary, yachtSize, yachtType, contractType, startDate, desiredLocation
  syncCandidateUpdate(candidateId, {
    // Salary preferences → Vincere "Desired Monthly Salary" custom field
    desired_salary_min: data.salaryMin ?? undefined,
    desired_salary_max: data.salaryMax ?? undefined,
    salary_currency: data.salaryCurrency ?? undefined,
    // Yacht size preferences → Vincere "Preferred Yacht Size" custom field
    preferred_yacht_size_min: data.yachtSizeMin ?? undefined,
    preferred_yacht_size_max: data.yachtSizeMax ?? undefined,
    // Yacht type preferences → Vincere "Yacht Type" custom field
    preferred_yacht_types: data.yachtTypes ?? undefined,
    // Contract type preferences → Vincere "Contract Type" custom field
    preferred_contract_types: data.contractTypes as ("permanent" | "rotational" | "seasonal" | "freelance")[] | undefined,
    // Availability → Vincere "Start Date" custom field
    available_from: data.availableFrom ?? undefined,
    // Preferred regions → Vincere "Desired Location" custom field
    preferred_regions: data.regions ?? undefined,
    // Couple info → Vincere couple custom fields
    is_couple: data.isCouple ?? undefined,
    partner_name: data.partnerName ?? undefined,
    partner_position: data.partnerPosition ?? undefined,
  }).catch((err) => {
    // Log but don't fail the local update
    console.error("[updateJobPreferences] Vincere sync error:", err);
  });

  revalidatePath("/crew/preferences");
  revalidatePath("/crew/dashboard");

  return { success: true };
}

export async function markPreferencesComplete(
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
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

  revalidatePath("/crew/preferences");
  revalidatePath("/crew/dashboard");

  return { success: true };
}

// ----------------------------------------------------------------------------
// JOB MATCHES - Direct Supabase query (no API route needed)
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
  minScore?: number;
  industry?: JobIndustry | "both";
  includeAISummary?: boolean;
}

export interface JobMatchesResult {
  success: boolean;
  error?: string;
  matches?: (JobMatchResult & { canQuickApply: boolean })[];
  profile?: ProfileStatus;
  metadata?: {
    totalJobsAnalyzed: number;
    processingTimeMs: number;
    candidateId: string;
    industry: string;
    limit: number;
    minScore: number;
  };
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

  console.log("[loadJobMatches] Auth result:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    authError: authError?.message
  });

  if (!user) {
    console.log("[loadJobMatches] Not authenticated");
    return { success: false, error: "Not authenticated" };
  }

  const {
    limit = 10,
    minScore = 30,
    industry = "both",
    includeAISummary = true,
  } = options;

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
    verification_tier, embedding
  `;

  // Get user record (auth_id -> user_id mapping)
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  console.log("[loadJobMatches] Users table lookup:", {
    hasUserData: !!userData,
    userDataId: userData?.id,
    hasError: !!userDataError,
    error: userDataError?.message,
  });

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId, error: candidateByUserIdError } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("user_id", userData.id)
      .maybeSingle();

    console.log("[loadJobMatches] Candidate lookup by user_id:", {
      hasCandidate: !!candidateByUserId,
      candidateId: candidateByUserId?.id,
      hasError: !!candidateByUserIdError,
      error: candidateByUserIdError?.message,
    });

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail, error: candidateByEmailError } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("email", user.email)
      .maybeSingle();

    console.log("[loadJobMatches] Candidate lookup by email:", {
      hasCandidate: !!candidateByEmail,
      candidateId: candidateByEmail?.id,
      hasError: !!candidateByEmailError,
      error: candidateByEmailError?.message,
      userEmail: user.email,
    });

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  // Last resort: Try the provided candidateId directly (for server-side calls)
  if (!candidate && candidateId) {
    const { data: candidateById, error: candidateByIdError } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("id", candidateId)
      .maybeSingle();

    console.log("[loadJobMatches] Candidate lookup by candidateId:", {
      hasCandidate: !!candidateById,
      candidateId: candidateById?.id,
      hasError: !!candidateByIdError,
      error: candidateByIdError?.message,
      providedCandidateId: candidateId,
    });

    if (candidateById) {
      candidate = candidateById;
    }
  }

  console.log("[loadJobMatches] Final candidate check:", {
    hasCandidate: !!candidate,
    candidateId: candidate?.id,
  });

  if (!candidate) {
    console.error("[loadJobMatches] Candidate fetch error: No candidate found for user", user.id);
    return { success: false, error: "Could not load candidate profile" };
  }

  // Check profile completeness
  const profileStatus = checkProfileCompleteness(candidate);

  // Check if candidate has CV uploaded
  const hasCV = await candidateHasCV(supabase, candidate.id);

  // Run the AI matcher
  const { matches, metadata } = await matchJobsForCandidate(supabase, {
    candidateId,
    limit,
    minScore,
    industry,
    includeAISummary,
  });

  // Quick apply requires both profile completeness AND CV
  const canQuickApply = profileStatus.canQuickApply && hasCV;

  // Add quick apply eligibility to each match
  const matchesWithQuickApply = matches.map((match) => ({
    ...match,
    canQuickApply: canQuickApply && !match.hasApplied,
  }));

  return {
    success: true,
    matches: matchesWithQuickApply,
    profile: {
      completeness: profileStatus.completeness,
      canQuickApply,
      missingFields: profileStatus.missingFields,
      hasCV,
      candidateId: candidate.id,
    },
    metadata: {
      ...metadata,
      industry,
      limit,
      minScore,
    },
  };
}

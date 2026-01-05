"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface JobPreferencesData {
  industryPreference: "yacht" | "household" | "both" | null;
  // Yacht preferences
  yachtPrimaryPosition: string | null;
  yachtSecondaryPositions: string[];
  yachtSizeMin: number | null;
  yachtSizeMax: number | null;
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

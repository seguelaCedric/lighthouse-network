import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PreferencesClient from "./preferences-client";

export const metadata = {
  title: "Job Preferences | Lighthouse Crew Network",
  description: "Set your job preferences to help us find the perfect role for you",
};

export default async function PreferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/crew/preferences");
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  const candidateSelectFields = `
    id,
    first_name,
    last_name,
    industry_preference,
    yacht_primary_position,
    yacht_secondary_positions,
    preferred_yacht_size_min,
    preferred_yacht_size_max,
    preferred_yacht_types,
    preferred_contract_types,
    preferred_regions,
    leave_package,
    salary_currency,
    desired_salary_min,
    desired_salary_max,
    availability_status,
    available_from,
    household_primary_position,
    household_secondary_positions,
    household_locations,
    living_arrangement,
    is_couple,
    partner_name,
    partner_position,
    preferences_completed_at
  `;

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("user_id", userData.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(candidateSelectFields)
      .eq("email", user.email)
      .maybeSingle();

    candidate = candidateByEmail;
  }

  if (!candidate) {
    redirect("/crew/profile/edit");
  }

  return (
    <PreferencesClient
      candidateId={candidate.id}
      initialData={{
        industryPreference: candidate.industry_preference,
        yachtPrimaryPosition: candidate.yacht_primary_position,
        yachtSecondaryPositions: candidate.yacht_secondary_positions || [],
        yachtSizeMin: candidate.preferred_yacht_size_min,
        yachtSizeMax: candidate.preferred_yacht_size_max,
        yachtTypes: candidate.preferred_yacht_types || [],
        contractTypes: candidate.preferred_contract_types || [],
        regions: candidate.preferred_regions || [],
        leavePackage: candidate.leave_package,
        salaryCurrency: candidate.salary_currency || "EUR",
        salaryMin: candidate.desired_salary_min,
        salaryMax: candidate.desired_salary_max,
        availabilityStatus: candidate.availability_status || "looking",
        availableFrom: candidate.available_from,
        householdPrimaryPosition: candidate.household_primary_position,
        householdSecondaryPositions: candidate.household_secondary_positions || [],
        householdLocations: candidate.household_locations || [],
        livingArrangement: candidate.living_arrangement,
        isCouple: candidate.is_couple || false,
        partnerName: candidate.partner_name,
        partnerPosition: candidate.partner_position,
        preferencesCompletedAt: candidate.preferences_completed_at,
      }}
    />
  );
}

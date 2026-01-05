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

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  let candidateUserId = userData?.id;

  // If no user record, try to find candidate by email
  if (!userData) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("email", user.email)
      .single();

    if (candidateByEmail?.user_id) {
      candidateUserId = candidateByEmail.user_id;
    } else if (!candidateByEmail) {
      redirect("/crew/profile/edit");
    }
  }

  // Get candidate data with preferences
  const { data: candidate } = await supabase
    .from("candidates")
    .select(`
      id,
      first_name,
      last_name,
      industry_preference,
      yacht_primary_position,
      yacht_secondary_positions,
      preferred_yacht_size_min,
      preferred_yacht_size_max,
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
    `)
    .eq("user_id", candidateUserId)
    .single();

  if (!candidate) {
    // Try by email for Vincere-imported candidates
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(`
        id,
        first_name,
        last_name,
        industry_preference,
        yacht_primary_position,
        yacht_secondary_positions,
        preferred_yacht_size_min,
        preferred_yacht_size_max,
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
      `)
      .eq("email", user.email)
      .single();

    if (!candidateByEmail) {
      redirect("/crew/profile/edit");
    }

    return (
      <PreferencesClient
        candidateId={candidateByEmail.id}
        initialData={{
          industryPreference: candidateByEmail.industry_preference,
          yachtPrimaryPosition: candidateByEmail.yacht_primary_position,
          yachtSecondaryPositions: candidateByEmail.yacht_secondary_positions || [],
          yachtSizeMin: candidateByEmail.preferred_yacht_size_min,
          yachtSizeMax: candidateByEmail.preferred_yacht_size_max,
          contractTypes: candidateByEmail.preferred_contract_types || [],
          regions: candidateByEmail.preferred_regions || [],
          leavePackage: candidateByEmail.leave_package,
          salaryCurrency: candidateByEmail.salary_currency || "EUR",
          salaryMin: candidateByEmail.desired_salary_min,
          salaryMax: candidateByEmail.desired_salary_max,
          availabilityStatus: candidateByEmail.availability_status || "looking",
          availableFrom: candidateByEmail.available_from,
          householdPrimaryPosition: candidateByEmail.household_primary_position,
          householdSecondaryPositions: candidateByEmail.household_secondary_positions || [],
          householdLocations: candidateByEmail.household_locations || [],
          livingArrangement: candidateByEmail.living_arrangement,
          isCouple: candidateByEmail.is_couple || false,
          partnerName: candidateByEmail.partner_name,
          partnerPosition: candidateByEmail.partner_position,
          preferencesCompletedAt: candidateByEmail.preferences_completed_at,
        }}
      />
    );
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

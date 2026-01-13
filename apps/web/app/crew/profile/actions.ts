"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncCandidateUpdate, syncDocumentUpload } from "@/lib/vincere/sync-service";
import type { Candidate } from "../../../../../packages/database/types";

/**
 * Helper function to get candidate ID from authenticated user
 * This consolidates the 3-tier lookup logic (user_id -> email fallback)
 * to avoid repeating it in every server action
 */
async function getCandidateIdFromAuth(): Promise<{ candidateId: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return { candidateId: null, error: "Not authenticated" };
  }

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("candidates").select("id").eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Check email lookup first (most common for Vincere imports)
  if (candidateByEmailResult.data) {
    return { candidateId: candidateByEmailResult.data.id };
  }

  // If we have a user record, try by user_id
  if (userResult.data) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    if (candidateByUserId) {
      return { candidateId: candidateByUserId.id };
    }
  }

  return { candidateId: null, error: "Candidate not found" };
}

/**
 * Structured location data from Google Places or manual entry
 */
export interface LocationData {
  displayName: string; // "Fort Lauderdale, FL, USA" - for display
  city: string; // "Fort Lauderdale"
  state?: string; // "FL"
  country: string; // "United States"
  countryCode: string; // "US"
  latitude?: number;
  longitude?: number;
}

/**
 * Profile data types
 */
export interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  secondNationality: string | null;
  currentLocation: string | null;
  profilePhotoUrl: string | null;
  // Professional
  candidateType: string | null;
  primaryPosition: string | null;
  secondaryPositions: string[] | null;
  yearsExperience: number | null;
  experienceSummary: string | null; // Maps to profile_summary in DB
  highestLicense: string | null;
  secondaryLicense: string | null;
  // Preferences
  preferredYachtTypes: string[] | null;
  preferredYachtSizeMin: number | null;
  preferredYachtSizeMax: number | null;
  preferredContractTypes: string[] | null;
  preferredRegions: string[] | null;
  salaryCurrency: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  // Availability
  availabilityStatus: "available" | "looking" | "employed" | "unavailable";
  availableFrom: string | null;
  // Preferences
  industryPreference: "yacht" | "household" | "both" | null;
  preferencesCompletedAt: string | null;
  yachtPrimaryPosition: string | null;
  householdPrimaryPosition: string | null;
  householdLocations: string[] | null;
  // Verification
  verificationTier: string | null;
  // Special circumstances
  isSmoker: boolean | null;
  hasTattoos: boolean | null;
  tattooDescription: string | null;
  maritalStatus: string | null;
  isCouplePosition: boolean | null;
  partnerName: string | null;
  partnerPosition: string | null;
  // Certifications & Visas
  hasStcw: boolean;
  stcwExpiry: string | null;
  hasEng1: boolean;
  eng1Expiry: string | null;
  hasSchengen: boolean | null;
  schengenExpiry: string | null;
  hasB1B2: boolean | null;
  b1b2Expiry: string | null;
  hasC1D: boolean | null;
  jobSearchNotes: string | null;
}

export interface CertificationData {
  id: string;
  name: string;
  issuingAuthority: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  documentUrl: string | null;
}

export interface DocumentData {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
}

export interface ProfileData {
  candidate: CandidateProfile;
  certifications: CertificationData[];
  documents: DocumentData[];
}

/**
 * Get profile data for the authenticated candidate
 */
export async function getProfileData(): Promise<ProfileData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[getProfileData] Auth check - user:", user?.id, "email:", user?.email, "error:", authError?.message);

  if (!user || !user.email) {
    console.log("[getProfileData] No user or email - returning null");
    return null;
  }

  const candidateFields = `
    id,
    first_name,
    last_name,
    email,
    phone,
    whatsapp,
    date_of_birth,
    gender,
    nationality,
    second_nationality,
    current_location,
    avatar_url,
    candidate_type,
    primary_position,
    secondary_positions,
    years_experience,
    profile_summary,
    highest_license,
    second_license,
    preferred_yacht_types,
    preferred_yacht_size_min,
    preferred_yacht_size_max,
    preferred_contract_types,
    preferred_regions,
    industry_preference,
    yacht_primary_position,
    household_primary_position,
    household_locations,
    preferences_completed_at,
    salary_currency,
    desired_salary_min,
    desired_salary_max,
    availability_status,
    available_from,
    is_smoker,
    has_visible_tattoos,
    tattoo_description,
    marital_status,
    is_couple,
    partner_name,
    partner_position,
    has_stcw,
    stcw_expiry,
    has_eng1,
    eng1_expiry,
    has_schengen,
    has_b1b2,
    has_c1d,
    verification_tier,
    job_search_notes
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

  console.log("[getProfileData] Parallel lookup - userData:", userResult.data?.id, "candidateByEmail:", !!candidateByEmailResult.data);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const result = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = result.data;
    console.log("[getProfileData] Candidate lookup by user_id - found:", !!candidate);
  }

  if (!candidate) {
    console.log("[getProfileData] No candidate found - returning null");
    return null;
  }

  console.log("[getProfileData] Success - candidate ID:", candidate.id);

  // PERFORMANCE: Run certifications and documents queries in parallel
  const [certificationsResult, documentsResult] = await Promise.all([
    supabase
      .from("candidate_certifications")
      .select(
        `
        id,
        certification_type,
        custom_name,
        expiry_date,
        has_certification
      `
      )
      .eq("candidate_id", candidate.id)
      .eq("has_certification", true)
      .order("expiry_date", { ascending: true }),
    supabase
      .from("documents")
      .select(
        `
        id,
        name,
        type,
        file_size,
        created_at,
        file_url
      `
      )
      .eq("entity_id", candidate.id)
      .eq("entity_type", "candidate")
      .order("created_at", { ascending: false }),
  ]);

  const certifications = certificationsResult.data;
  const documents = documentsResult.data;

  return {
    candidate: {
      id: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      whatsapp: candidate.whatsapp,
      dateOfBirth: candidate.date_of_birth,
      gender: candidate.gender,
      nationality: candidate.nationality,
      secondNationality: candidate.second_nationality,
      currentLocation: candidate.current_location,
      profilePhotoUrl: candidate.avatar_url,
      candidateType: candidate.candidate_type || null,
      primaryPosition: candidate.primary_position,
      secondaryPositions: candidate.secondary_positions,
      yearsExperience: candidate.years_experience,
      experienceSummary: candidate.profile_summary,
      highestLicense: candidate.highest_license,
      secondaryLicense: candidate.second_license,
      preferredYachtTypes: candidate.preferred_yacht_types,
      preferredYachtSizeMin: candidate.preferred_yacht_size_min,
      preferredYachtSizeMax: candidate.preferred_yacht_size_max,
      preferredContractTypes: candidate.preferred_contract_types,
      preferredRegions: candidate.preferred_regions,
      industryPreference: candidate.industry_preference,
      preferencesCompletedAt: candidate.preferences_completed_at,
      yachtPrimaryPosition: candidate.yacht_primary_position,
      householdPrimaryPosition: candidate.household_primary_position,
      householdLocations: candidate.household_locations,
      verificationTier: candidate.verification_tier,
      salaryCurrency: candidate.salary_currency,
      salaryMin: candidate.desired_salary_min,
      salaryMax: candidate.desired_salary_max,
      availabilityStatus: candidate.availability_status || "looking",
      availableFrom: candidate.available_from,
      isSmoker: candidate.is_smoker,
      hasTattoos: candidate.has_visible_tattoos,
      tattooDescription: candidate.tattoo_description,
      maritalStatus: candidate.marital_status,
      isCouplePosition: candidate.is_couple,
      partnerName: candidate.partner_name,
      partnerPosition: candidate.partner_position,
      hasStcw: candidate.has_stcw || false,
      stcwExpiry: candidate.stcw_expiry,
      hasEng1: candidate.has_eng1 || false,
      eng1Expiry: candidate.eng1_expiry,
      hasSchengen: candidate.has_schengen,
      schengenExpiry: null, // Column doesn't exist in database yet (migration 046 not run)
      hasB1B2: candidate.has_b1b2,
      b1b2Expiry: null, // Column doesn't exist in database yet (migration 046 not run)
      hasC1D: candidate.has_c1d,
      jobSearchNotes: candidate.job_search_notes,
    },
    certifications: (certifications || []).map((cert) => ({
      id: cert.id,
      name: cert.custom_name || cert.certification_type,
      issuingAuthority: null,
      certificateNumber: null,
      issueDate: null,
      expiryDate: cert.expiry_date,
      documentUrl: null,
    })),
    documents: (documents || []).map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.file_size || 0,
      uploadDate: doc.created_at,
      url: doc.file_url,
    })),
  };
}

/**
 * Update personal information
 */
export async function updatePersonalInfo(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  secondNationality?: string;
  currentLocation?: LocationData | null;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    first_name: data.firstName,
    last_name: data.lastName,
    updated_at: new Date().toISOString(),
  };

  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.nationality !== undefined) updateData.nationality = data.nationality;
  if (data.secondNationality !== undefined) updateData.second_nationality = data.secondNationality;
  // Store the display name in the database for backwards compatibility
  if (data.currentLocation !== undefined) {
    updateData.current_location = data.currentLocation?.displayName || null;
  }

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating personal info:", error);
    return { success: false, error: "Failed to update personal information" };
  }

  // Sync to Vincere (fire-and-forget)
  // Only include fields that are explicitly set (not undefined) to avoid clearing existing data
  const syncPayload: Parameters<typeof syncCandidateUpdate>[1] = {
    first_name: data.firstName,
    last_name: data.lastName,
  };
  // Only add optional fields if they are defined (including empty strings to allow clearing)
  if (data.email !== undefined) syncPayload.email = data.email;
  if (data.phone !== undefined) syncPayload.phone = data.phone;
  if (data.whatsapp !== undefined) syncPayload.whatsapp = data.whatsapp;
  if (data.dateOfBirth !== undefined) syncPayload.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) syncPayload.gender = data.gender;
  if (data.nationality !== undefined) syncPayload.nationality = data.nationality;
  if (data.secondNationality !== undefined) syncPayload.second_nationality = data.secondNationality;
  if (data.currentLocation) {
    syncPayload.current_location = data.currentLocation;
  }

  // Sync to Vincere - await to ensure completion before server action returns
  try {
    const syncResult = await syncCandidateUpdate(candidateId, syncPayload);
    console.log(`[updatePersonalInfo] Vincere sync completed for ${candidateId}:`, syncResult.success ? 'success' : syncResult.error);
  } catch (err) {
    console.error("[updatePersonalInfo] Vincere sync failed:", err);
  }

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Update professional details
 */
export async function updateProfessionalDetails(data: {
  primaryPosition?: string;
  secondaryPositions?: string[];
  candidateType?: string;
  yearsExperience?: number;
  experienceSummary?: string;
  keySkills?: string[];
  highestLicense?: string;
  secondaryLicense?: string;
  jobSearchNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.primaryPosition !== undefined) updateData.primary_position = data.primaryPosition;
  if (data.secondaryPositions !== undefined) updateData.secondary_positions = data.secondaryPositions;
  if (data.candidateType !== undefined) updateData.candidate_type = data.candidateType;
  if (data.yearsExperience !== undefined) updateData.years_experience = data.yearsExperience;
  if (data.experienceSummary !== undefined) updateData.profile_summary = data.experienceSummary;
  if (data.keySkills !== undefined) updateData.key_skills = data.keySkills;
  if (data.highestLicense !== undefined) updateData.highest_license = data.highestLicense;
  if (data.secondaryLicense !== undefined) updateData.second_license = data.secondaryLicense;
  if (data.jobSearchNotes !== undefined) updateData.job_search_notes = data.jobSearchNotes;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating professional details:", error);
    return { success: false, error: "Failed to update professional details" };
  }

  // Sync to Vincere (fire-and-forget) - include all fields that may have changed
  const syncData: Partial<Candidate> = {};
  if (data.primaryPosition !== undefined) syncData.primary_position = data.primaryPosition;
  if (data.secondaryPositions !== undefined) syncData.secondary_positions = data.secondaryPositions;
  if (data.yearsExperience !== undefined) syncData.years_experience = data.yearsExperience;
  if (data.experienceSummary !== undefined) syncData.profile_summary = data.experienceSummary;
  if (data.candidateType !== undefined) {
    syncData.candidate_type = data.candidateType as 'yacht_crew' | 'household_staff' | 'other' | 'both' | null;
  }
  if (data.keySkills !== undefined) syncData.search_keywords = data.keySkills;
  if (data.highestLicense !== undefined) syncData.highest_license = data.highestLicense;
  if (data.secondaryLicense !== undefined) syncData.second_license = data.secondaryLicense;
  // Note: job_search_notes is not part of Candidate type, so we skip it in sync

  syncCandidateUpdate(candidateId, syncData).catch((err) => console.error("Vincere sync failed for professional details update:", err));

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Update work preferences
 */
export async function updateWorkPreferences(data: {
  preferredYachtTypes?: string[];
  preferredYachtSizeMin?: number;
  preferredYachtSizeMax?: number;
  preferredContractTypes?: string[];
  preferredRegions?: string[];
  salaryCurrency?: string;
  salaryMin?: number;
  salaryMax?: number;
  availableFrom?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.preferredYachtTypes !== undefined) updateData.preferred_yacht_types = data.preferredYachtTypes;
  if (data.preferredYachtSizeMin !== undefined) updateData.preferred_yacht_size_min = data.preferredYachtSizeMin;
  if (data.preferredYachtSizeMax !== undefined) updateData.preferred_yacht_size_max = data.preferredYachtSizeMax;
  if (data.preferredContractTypes !== undefined) updateData.preferred_contract_types = data.preferredContractTypes;
  if (data.preferredRegions !== undefined) updateData.preferred_regions = data.preferredRegions;
  if (data.salaryCurrency !== undefined) updateData.salary_currency = data.salaryCurrency;
  if (data.salaryMin !== undefined) updateData.desired_salary_min = data.salaryMin;
  if (data.salaryMax !== undefined) updateData.desired_salary_max = data.salaryMax;
  if (data.availableFrom !== undefined) updateData.available_from = data.availableFrom;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating work preferences:", error);
    return { success: false, error: "Failed to update work preferences" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidateId, {
    preferred_yacht_types: data.preferredYachtTypes,
    preferred_yacht_size_min: data.preferredYachtSizeMin,
    preferred_yacht_size_max: data.preferredYachtSizeMax,
    preferred_contract_types: data.preferredContractTypes as ("permanent" | "rotational" | "seasonal" | "temporary" | "freelance")[] | undefined,
    preferred_regions: data.preferredRegions,
    salary_currency: data.salaryCurrency,
    desired_salary_min: data.salaryMin,
    desired_salary_max: data.salaryMax,
    available_from: data.availableFrom,
  }).catch((err) => console.error("Vincere sync failed for work preferences update:", err));

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Update special circumstances (personal details)
 */
export async function updateSpecialCircumstances(data: {
  isSmoker?: boolean;
  hasTattoos?: boolean;
  tattooDescription?: string;
  maritalStatus?: string;
  isCouplePosition?: boolean;
  partnerName?: string;
  partnerPosition?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.isSmoker !== undefined) updateData.is_smoker = data.isSmoker;
  if (data.hasTattoos !== undefined) updateData.has_visible_tattoos = data.hasTattoos;
  if (data.tattooDescription !== undefined) updateData.tattoo_description = data.tattooDescription;
  if (data.maritalStatus !== undefined) updateData.marital_status = data.maritalStatus;
  if (data.isCouplePosition !== undefined) updateData.is_couple = data.isCouplePosition;
  if (data.partnerName !== undefined) updateData.partner_name = data.partnerName;
  if (data.partnerPosition !== undefined) updateData.partner_position = data.partnerPosition;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating special circumstances:", error);
    return { success: false, error: "Failed to update special circumstances" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidateId, {
    is_smoker: data.isSmoker,
    has_visible_tattoos: data.hasTattoos,
    tattoo_description: data.tattooDescription,
    marital_status: data.maritalStatus,
    is_couple: data.isCouplePosition,
    partner_name: data.partnerName,
    partner_position: data.partnerPosition,
  }).catch((err) => console.error("Vincere sync failed for special circumstances update:", err));

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Update certifications (STCW, ENG1, visas)
 */
export async function updateCertificationStatus(data: {
  hasStcw?: boolean;
  stcwExpiry?: string;
  hasEng1?: boolean;
  eng1Expiry?: string;
  hasSchengen?: boolean;
  schengenExpiry?: string;
  hasB1B2?: boolean;
  b1b2Expiry?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.hasStcw !== undefined) updateData.has_stcw = data.hasStcw;
  if (data.stcwExpiry !== undefined) updateData.stcw_expiry = data.stcwExpiry || null;
  if (data.hasEng1 !== undefined) updateData.has_eng1 = data.hasEng1;
  if (data.eng1Expiry !== undefined) updateData.eng1_expiry = data.eng1Expiry || null;
  if (data.hasSchengen !== undefined) updateData.has_schengen = data.hasSchengen;
  if (data.schengenExpiry !== undefined) updateData.schengen_expiry = data.schengenExpiry || null;
  if (data.hasB1B2 !== undefined) updateData.has_b1b2 = data.hasB1B2;
  if (data.b1b2Expiry !== undefined) updateData.b1b2_expiry = data.b1b2Expiry || null;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating certification status:", error);
    return { success: false, error: "Failed to update certifications" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidateId, {
    has_stcw: data.hasStcw,
    stcw_expiry: data.stcwExpiry,
    has_eng1: data.hasEng1,
    eng1_expiry: data.eng1Expiry,
    has_schengen: data.hasSchengen,
    schengen_expiry: data.schengenExpiry,
    has_b1b2: data.hasB1B2,
    b1b2_expiry: data.b1b2Expiry,
  }).catch((err) => console.error("Vincere sync failed for certification update:", err));

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Add a certification
 */
export async function addCertification(data: {
  name: string;
  issuingAuthority?: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}): Promise<{ success: boolean; certificationId?: string; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const { data: certification, error } = await supabase
    .from("candidate_certifications")
    .insert({
      candidate_id: candidateId,
      certification_type: "other",
      custom_name: data.name,
      expiry_date: data.expiryDate || null,
      has_certification: true,
    })
    .select("id")
    .maybeSingle();

  if (error || !certification) {
    console.error("Error adding certification:", error);
    return { success: false, error: "Failed to add certification" };
  }

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true, certificationId: certification.id };
}

/**
 * Update a certification
 */
export async function updateCertification(
  certificationId: string,
  data: {
    name?: string;
    issuingAuthority?: string;
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.custom_name = data.name;
  if (data.expiryDate !== undefined) updateData.expiry_date = data.expiryDate || null;

  const { error } = await supabase
    .from("candidate_certifications")
    .update(updateData)
    .eq("id", certificationId);

  if (error) {
    console.error("Error updating certification:", error);
    return { success: false, error: "Failed to update certification" };
  }

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Delete a certification
 */
export async function deleteCertification(certificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("candidate_certifications")
    .delete()
    .eq("id", certificationId);

  if (error) {
    console.error("Error deleting certification:", error);
    return { success: false, error: "Failed to delete certification" };
  }

  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  return { success: true };
}

/**
 * Update profile photo
 * Uploads photo to Supabase Storage and updates candidate avatar_url
 */
export async function updateProfilePhoto(formData: FormData): Promise<{
  success: boolean;
  photoUrl?: string;
  error?: string
}> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const file = formData.get("photo") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please use JPG, PNG, or WebP" };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File too large. Maximum size is 5MB" };
  }

  // Generate unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${candidateId}-${Date.now()}.${fileExt}`;
  const filePath = `profile-photos/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading photo:", uploadError);
    return { success: false, error: "Failed to upload photo" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const photoUrl = urlData.publicUrl;

  // Update candidate record using the candidate ID we already have
  const { error: updateError } = await supabase
    .from("candidates")
    .update({
      avatar_url: photoUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", candidateId);

  if (updateError) {
    console.error("Error updating candidate avatar:", updateError);
    // Try to clean up the uploaded file
    await supabase.storage.from("avatars").remove([filePath]);
    return { success: false, error: "Failed to update profile photo" };
  }

  // Sync photo to Vincere (fire-and-forget)
  syncDocumentUpload(candidateId, photoUrl, file.name, file.type, "photo").catch((err) =>
    console.error("Vincere sync failed for profile photo upload:", err)
  );

  // Revalidate all paths where avatar appears
  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");
  revalidatePath("/crew"); // Nav uses layout data

  return { success: true, photoUrl };
}

/**
 * Update certification checklist
 * Manages the candidate_certifications table for the profile wizard checklist
 */
export async function updateCertificationChecklist(data: {
  certifications: Array<{
    type: string;
    hasIt: boolean;
    expiryDate?: string;
    customName?: string;
  }>;
}): Promise<{ success: boolean; error?: string }> {
  // Use shared utility to get candidate ID
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  // Upsert certifications (delete unchecked, upsert checked)
  for (const cert of data.certifications) {
    if (!cert.hasIt) {
      // Delete if unchecked
      await supabase
        .from("candidate_certifications")
        .delete()
        .eq("candidate_id", candidateId)
        .eq("certification_type", cert.type);
    } else {
      // Upsert if checked
      await supabase
        .from("candidate_certifications")
        .upsert({
          candidate_id: candidateId,
          certification_type: cert.type,
          has_certification: true,
          expiry_date: cert.expiryDate || null,
          custom_name: cert.customName || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "candidate_id,certification_type"
        });
    }
  }

  revalidatePath("/crew/profile/edit");
  return { success: true };
}

/**
 * Upload tattoo images
 * Uploads tattoo photos to Supabase Storage as documents
 */
export async function uploadTattooImage(formData: FormData): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  const file = formData.get("image") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type (images only)
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please use JPG, PNG, or WebP" };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File too large. Maximum size is 5MB" };
  }

  // Generate unique file name
  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  const fileName = `tattoo-${timestamp}-${sanitizedName}`;
  const filePath = `candidate/${candidateId}/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading tattoo image:", uploadError);
    return { success: false, error: "Failed to upload image" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  // Get user ID for uploaded_by
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await supabase.storage.from("documents").remove([filePath]);
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    await supabase.storage.from("documents").remove([filePath]);
    return { success: false, error: "User not found" };
  }

  // Save document record
  const { data: documentRecord, error: dbError } = await supabase
    .from("documents")
    .insert({
      entity_type: "candidate",
      entity_id: candidateId,
      name: file.name,
      type: "other",
      file_name: file.name,
      file_path: filePath,
      file_url: fileUrl,
      file_size: file.size,
      mime_type: file.type,
      description: "Tattoo image",
      uploaded_by: userData.id,
      organization_id: userData.organization_id,
      is_latest_version: true,
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Error saving tattoo document:", dbError);
    await supabase.storage.from("documents").remove([filePath]);
    return { success: false, error: "Failed to save document record" };
  }

  // Revalidate paths
  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");

  return { success: true, documentId: documentRecord.id };
}

/**
 * Delete a tattoo image document
 */
export async function deleteTattooImage(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return { success: false, error: lookupError || "Candidate not found" };
  }

  const supabase = await createClient();

  // Verify document belongs to this candidate and is a tattoo image
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, entity_id, file_path, description")
    .eq("id", documentId)
    .single();

  if (fetchError || !doc) {
    return { success: false, error: "Document not found" };
  }

  if (doc.entity_id !== candidateId) {
    return { success: false, error: "Not authorized to delete this document" };
  }

  if (doc.description !== "Tattoo image") {
    return { success: false, error: "Not a tattoo image document" };
  }

  // Delete from storage
  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    console.error("Error deleting tattoo document:", deleteError);
    return { success: false, error: "Failed to delete document" };
  }

  // Revalidate paths
  revalidatePath("/crew/profile/edit");
  revalidatePath("/crew/dashboard");

  return { success: true };
}

/**
 * Get tattoo images for the authenticated candidate
 */
export async function getTattooImages(): Promise<Array<{
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
}>> {
  const { candidateId, error: lookupError } = await getCandidateIdFromAuth();
  if (!candidateId) {
    return [];
  }

  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, name, file_url, created_at")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .eq("type", "other")
    .eq("description", "Tattoo image")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !documents) {
    console.error("Error fetching tattoo images:", error);
    return [];
  }

  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    fileUrl: doc.file_url,
    uploadedAt: doc.created_at,
  }));
}

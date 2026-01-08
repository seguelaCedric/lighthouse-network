"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncCandidateUpdate, syncDocumentUpload } from "@/lib/vincere/sync-service";
import type { Candidate } from "../../../../../packages/database/types";

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

  // Get user record (auth_id -> user_id mapping)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  console.log("[getProfileData] Users table lookup - userData:", userData?.id, "error:", userError?.message);

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

  let candidate = null;
  let candidateError = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const result = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userData.id)
      .maybeSingle();
    
    candidate = result.data;
    candidateError = result.error;
    console.log("[getProfileData] Candidate lookup by user_id - found:", !!candidate, "error:", candidateError?.message);
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const result = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("email", user.email)
      .maybeSingle();
    
    candidate = result.data;
    candidateError = result.error;
    console.log("[getProfileData] Candidate lookup by email - found:", !!candidate, "error:", candidateError?.message);
  }

  // Check for errors (excluding PGRST116 which means no rows found)
  if (candidateError && candidateError.code && candidateError.code !== "PGRST116") {
    console.error("[getProfileData] Error fetching candidate:", candidateError);
    return null;
  }

  if (!candidate) {
    console.log("[getProfileData] No candidate found - returning null");
    return null;
  }

  console.log("[getProfileData] Success - candidate ID:", candidate.id);

  // Get certifications
  const { data: certifications } = await supabase
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
    .order("expiry_date", { ascending: true });

  // Get documents
  const { data: documents } = await supabase
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
    .order("created_at", { ascending: false });

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
  currentLocation?: string;
}): Promise<{ success: boolean; error?: string }> {
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
    return { success: false, error: "Candidate not found" };
  }

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
  if (data.currentLocation !== undefined) updateData.current_location = data.currentLocation;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidate.id);

  if (error) {
    console.error("Error updating personal info:", error);
    return { success: false, error: "Failed to update personal information" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidate.id, {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    nationality: data.nationality,
    second_nationality: data.secondNationality,
    current_location: data.currentLocation,
  }).catch((err) => console.error("Vincere sync failed for personal info update:", err));

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
    return { success: false, error: "Candidate not found" };
  }

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
    .eq("id", candidate.id);

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
  
  syncCandidateUpdate(candidate.id, syncData).catch((err) => console.error("Vincere sync failed for professional details update:", err));

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
    return { success: false, error: "Candidate not found" };
  }

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
    .eq("id", candidate.id);

  if (error) {
    console.error("Error updating work preferences:", error);
    return { success: false, error: "Failed to update work preferences" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidate.id, {
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
    return { success: false, error: "Candidate not found" };
  }

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
    .eq("id", candidate.id);

  if (error) {
    console.error("Error updating special circumstances:", error);
    return { success: false, error: "Failed to update special circumstances" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidate.id, {
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
    return { success: false, error: "Candidate not found" };
  }

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
    .eq("id", candidate.id);

  if (error) {
    console.error("Error updating certification status:", error);
    return { success: false, error: "Failed to update certifications" };
  }

  // Sync to Vincere (fire-and-forget)
  syncCandidateUpdate(candidate.id, {
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
    return { success: false, error: "Candidate not found" };
  }

  const { data: certification, error } = await supabase
    .from("candidate_certifications")
    .insert({
      candidate_id: candidate.id,
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

  let candidateId: string | null = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidateId = candidateByUserId.id;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidateId && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidateId = candidateByEmail.id;
    }
  }

  if (!candidateId) {
    return { success: false, error: "Candidate not found" };
  }

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

  // Update candidate record - try user_id first, then email fallback
  let updateError = null;

  if (userData) {
    const { error } = await supabase
      .from("candidates")
      .update({
        avatar_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userData.id);
    updateError = error;
  }

  // If user_id update failed or no userData, try by candidate id
  if (updateError || !userData) {
    const { error } = await supabase
      .from("candidates")
      .update({
        avatar_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidateId);
    updateError = error;
  }

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
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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

  if (!candidate) return { success: false, error: "Candidate not found" };

  // Upsert certifications (delete unchecked, upsert checked)
  for (const cert of data.certifications) {
    if (!cert.hasIt) {
      // Delete if unchecked
      await supabase
        .from("candidate_certifications")
        .delete()
        .eq("candidate_id", candidate.id)
        .eq("certification_type", cert.type);
    } else {
      // Upsert if checked
      await supabase
        .from("candidate_certifications")
        .upsert({
          candidate_id: candidate.id,
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

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export interface ProfileAction {
  id: string;
  label: string;
  percentageBoost: number;
  completed: boolean;
  href: string;
}

export interface MatchedJob {
  id: string;
  position: string;
  vesselName: string | null;
  vesselSize: number | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  matchPercentage: number;
  postedDays: number;
  urgent: boolean;
  contractType: string | null;
}

export interface CandidateApplication {
  id: string;
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
}

/**
 * Calculate profile completeness score based on PRD weights
 */
function calculateProfileCompleteness(candidate: {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_location: string | null;
  primary_position: string | null;
  years_experience: number | null;
  photo_url: string | null;
  preferred_yacht_types: string[] | null;
  preferred_regions: string[] | null;
  has_stcw: boolean;
  has_eng1: boolean;
  verification_tier: string;
  candidate_type: string | null;
  industry_preference: string | null;
  documents: Array<{ type: string }>;
}): { score: number; actions: ProfileAction[] } {
  const actions: ProfileAction[] = [];
  let score = 0;

  // Basic info (15%): name, email, phone, dob, nationality, location
  const basicInfoComplete =
    candidate.first_name &&
    candidate.last_name &&
    candidate.email &&
    candidate.phone &&
    candidate.date_of_birth &&
    candidate.nationality &&
    candidate.current_location;
  if (basicInfoComplete) {
    score += 15;
  } else {
    actions.push({
      id: "basic-info",
      label: "Complete personal details",
      percentageBoost: 15,
      completed: false,
      href: "/crew/profile/edit#personal",
    });
  }

  // Professional profile (20%): role category and position
  const professionalComplete =
    candidate.primary_position && candidate.candidate_type;
  if (professionalComplete) {
    score += 20;
  } else {
    actions.push({
      id: "professional",
      label: "Add professional details",
      percentageBoost: 20,
      completed: false,
      href: "/crew/profile/edit#professional",
    });
  }

  // CV uploaded (20%)
  const hasCv = candidate.documents.some((d) => d.type === "cv");
  if (hasCv) {
    score += 20;
  } else {
    actions.push({
      id: "cv",
      label: "Upload your CV",
      percentageBoost: 20,
      completed: false,
      href: "/crew/documents#cv",
    });
  }

  // Photo (10%)
  if (candidate.photo_url) {
    score += 10;
  } else {
    actions.push({
      id: "photo",
      label: "Add profile photo",
      percentageBoost: 10,
      completed: false,
      href: "/crew/profile/edit#photo",
    });
  }

  // Certifications (20%): STCW or ENG1 (yacht crew only)
  const hasCerts =
    candidate.candidate_type === "yacht_crew" || candidate.candidate_type === "both"
      ? candidate.has_stcw || candidate.has_eng1
      : true;
  if (hasCerts) {
    score += 20;
  } else {
    actions.push({
      id: "certs",
      label: "Add certifications",
      percentageBoost: 20,
      completed: false,
      href: "/crew/documents#certificates",
    });
  }

  // Preferences (10%) - check if industry preference is set (new preferences system)
  const hasPrefs = !!candidate.industry_preference;
  if (hasPrefs) {
    score += 10;
  } else {
    actions.push({
      id: "preferences",
      label: "Set job preferences",
      percentageBoost: 10,
      completed: false,
      href: "/crew/preferences",
    });
  }

  // Identity verified (5%)
  const isVerified =
    candidate.verification_tier === "identity" ||
    candidate.verification_tier === "verified" ||
    candidate.verification_tier === "premium";
  if (isVerified) {
    score += 5;
  }
  // Note: verification is not self-service, so no action item

  return { score, actions };
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
    years_experience,
    photo_url,
    availability_status,
    available_from,
    preferred_yacht_types,
    preferred_regions,
    has_stcw,
    stcw_expiry,
    has_eng1,
    eng1_expiry,
    verification_tier,
    industry_preference,
    yacht_primary_position,
    household_primary_position,
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
  const { score, actions } = calculateProfileCompleteness(candidateWithDocs as any);

  // Get matched jobs (open jobs sorted by created_at)
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
    .limit(4);

  // Map jobs with match percentage (placeholder - would use AI matching)
  // Store created_at as string to avoid hydration issues with date calculations
  const matchedJobs: MatchedJob[] = (jobs || []).map((job) => {
    // Calculate days difference server-side to ensure consistent SSR/client rendering
    const createdAt = new Date(job.created_at);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Simple match percentage based on position match
    // In production, this would use vector similarity
    let matchPercentage = 70;
    if (
      candidate.primary_position &&
      job.title.toLowerCase().includes(candidate.primary_position.toLowerCase())
    ) {
      matchPercentage = 95;
    }

    return {
      id: job.id,
      position: job.title,
      vesselName: job.vessel_name,
      vesselSize: job.vessel_size_meters,
      location: job.primary_region,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: job.salary_currency || "EUR",
      matchPercentage,
      postedDays: diffDays,
      urgent: job.is_urgent || false,
      contractType: job.contract_type,
    };
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

  // Get certifications from certifications table for expiry alerts
  const { data: certifications } = await supabase
    .from("certifications")
    .select("id, name, expiry_date")
    .eq("candidate_id", candidate.id)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  for (const cert of certifications || []) {
    if (cert.expiry_date) {
      const expiryDate = new Date(cert.expiry_date);
      const isUrgent = expiryDate <= thirtyDaysFromNow;

      // Avoid duplicate alerts for STCW/ENG1
      if (
        cert.name.toLowerCase().includes("stcw") ||
        cert.name.toLowerCase().includes("eng1")
      ) {
        continue;
      }

      alerts.push({
        id: `cert-${cert.id}`,
        type: "certification",
        title: `${cert.name} Expiring`,
        description: `Your ${cert.name} expires on ${formatExpiryDate(expiryDate)}.`,
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
    profilePhotoUrl: candidate.photo_url,
    availabilityStatus: candidate.availability_status || "looking",
    availableFrom: candidate.available_from,
    hasPhoto: !!candidate.photo_url,
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

  return {
    candidate: dashboardCandidate,
    profileCompleteness: score,
    profileActions: actions,
    matchedJobs,
    applications: mappedApplications,
    alerts,
    preferences,
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

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import type {
  VerificationTier,
  VerificationEventType,
  CandidateReference,
} from "@lighthouse/database";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface VerificationChecks {
  email_verified: boolean;
  cv_uploaded: boolean;
  id_verified: boolean;
  voice_verified: boolean;
  references_verified_2: boolean;
  verified_references_count: number;
}

export interface VerificationStatus {
  tier: VerificationTier;
  checks: VerificationChecks;
  nextSteps: string[];
  progress: number; // 0-100
}

// ----------------------------------------------------------------------------
// TIER CALCULATION
// ----------------------------------------------------------------------------

/**
 * Calculate verification tier based on candidate data
 */
export async function calculateVerificationTier(
  candidateId: string
): Promise<VerificationTier> {
  const supabase = await createClient();

  // Get candidate data with references
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select(
      `
      *,
      candidate_references (
        id,
        status,
        is_verified
      )
    `
    )
    .eq("id", candidateId)
    .single();

  if (error || !candidate) {
    console.error("Failed to get candidate for verification:", error);
    return "unverified";
  }

  const checks = getVerificationChecks(candidate);

  // Premium: ID + 2+ references + voice
  if (
    checks.id_verified &&
    checks.references_verified_2 &&
    checks.voice_verified
  ) {
    return "premium";
  }

  // Verified: ID + 2+ references (no voice)
  if (checks.id_verified && checks.references_verified_2) {
    return "verified";
  }

  // References: email + CV + 2+ verified references
  if (
    checks.email_verified &&
    checks.cv_uploaded &&
    checks.references_verified_2
  ) {
    return "references";
  }

  // Identity: email + CV + ID verified
  if (checks.email_verified && checks.cv_uploaded && checks.id_verified) {
    return "identity";
  }

  // Basic: email + CV
  if (checks.email_verified && checks.cv_uploaded) {
    return "basic";
  }

  return "unverified";
}

/**
 * Get verification checks from candidate data
 */
function getVerificationChecks(candidate: {
  email_verified_at?: string | null;
  cv_url?: string | null;
  id_verified_at?: string | null;
  voice_verified_at?: string | null;
  candidate_references?: Array<{
    status?: string;
    is_verified?: boolean;
  }>;
}): VerificationChecks {
  const refs = candidate.candidate_references || [];
  const verifiedRefsCount = refs.filter(
    (r) => r.status === "verified" || r.is_verified === true
  ).length;

  return {
    email_verified: !!candidate.email_verified_at,
    cv_uploaded: !!candidate.cv_url,
    id_verified: !!candidate.id_verified_at,
    voice_verified: !!candidate.voice_verified_at,
    references_verified_2: verifiedRefsCount >= 2,
    verified_references_count: verifiedRefsCount,
  };
}

/**
 * Get full verification status with next steps
 */
export async function getVerificationStatus(
  candidateId: string
): Promise<VerificationStatus> {
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      `
      *,
      candidate_references (
        id,
        status,
        is_verified
      )
    `
    )
    .eq("id", candidateId)
    .single();

  if (!candidate) {
    return {
      tier: "unverified",
      checks: {
        email_verified: false,
        cv_uploaded: false,
        id_verified: false,
        voice_verified: false,
        references_verified_2: false,
        verified_references_count: 0,
      },
      nextSteps: ["Verify your email address"],
      progress: 0,
    };
  }

  const checks = getVerificationChecks(candidate);
  const tier = await calculateVerificationTier(candidateId);
  const nextSteps = getNextSteps(checks, tier);
  const progress = calculateProgress(checks);

  return {
    tier,
    checks,
    nextSteps,
    progress,
  };
}

/**
 * Get next steps to reach higher verification tier
 */
function getNextSteps(
  checks: VerificationChecks,
  currentTier: VerificationTier
): string[] {
  const steps: string[] = [];

  if (!checks.email_verified) {
    steps.push("Verify your email address");
  }
  if (!checks.cv_uploaded) {
    steps.push("Upload your CV");
  }
  if (currentTier === "basic" || currentTier === "unverified") {
    if (!checks.id_verified) {
      steps.push("Upload ID for verification");
    }
    if (checks.verified_references_count < 2) {
      steps.push(
        `Add ${2 - checks.verified_references_count} more references`
      );
    }
  }
  if (
    (currentTier === "identity" ||
      currentTier === "references" ||
      currentTier === "verified") &&
    !checks.voice_verified
  ) {
    steps.push("Complete voice verification");
  }

  return steps;
}

/**
 * Calculate progress percentage
 */
function calculateProgress(checks: VerificationChecks): number {
  let progress = 0;
  const weights = {
    email_verified: 15,
    cv_uploaded: 15,
    id_verified: 25,
    references_verified_2: 30,
    voice_verified: 15,
  };

  if (checks.email_verified) progress += weights.email_verified;
  if (checks.cv_uploaded) progress += weights.cv_uploaded;
  if (checks.id_verified) progress += weights.id_verified;
  if (checks.references_verified_2) progress += weights.references_verified_2;
  if (checks.voice_verified) progress += weights.voice_verified;

  return progress;
}

// ----------------------------------------------------------------------------
// TIER UPDATES
// ----------------------------------------------------------------------------

/**
 * Update verification tier and log event
 */
export async function updateVerificationTier(
  candidateId: string,
  performedBy?: string
): Promise<VerificationTier> {
  const supabase = await createClient();

  // Get current tier
  const { data: current } = await supabase
    .from("candidates")
    .select("verification_tier, user_id")
    .eq("id", candidateId)
    .single();

  const newTier = await calculateVerificationTier(candidateId);

  if (newTier !== current?.verification_tier) {
    // Update tier
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        verification_tier: newTier,
        verification_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Failed to update verification tier:", updateError);
      return current?.verification_tier || "unverified";
    }

    // Log event
    await logVerificationEvent(candidateId, "tier_changed", {
      oldValue: current?.verification_tier,
      newValue: newTier,
      performedBy,
    });

    // Notify candidate if tier improved
    if (tierRank(newTier) > tierRank(current?.verification_tier)) {
      await notifyTierUpgrade(candidateId, current?.user_id, newTier);
    }
  }

  return newTier;
}

/**
 * Get numeric rank for tier comparison
 */
function tierRank(tier: VerificationTier | undefined | null): number {
  const ranks: Record<VerificationTier, number> = {
    unverified: 0,
    basic: 1,
    identity: 2,
    references: 3,
    verified: 4,
    premium: 5,
  };
  return ranks[tier || "unverified"] || 0;
}

/**
 * Notify candidate of tier upgrade
 */
async function notifyTierUpgrade(
  candidateId: string,
  userId: string | null,
  newTier: VerificationTier
): Promise<void> {
  if (!userId) return;

  const messages: Record<VerificationTier, string> = {
    unverified: "",
    basic:
      "Your profile is now verified with basic checks. Add ID verification and references to unlock more opportunities.",
    identity:
      "Your identity has been verified! Add 2+ references to reach the next level.",
    references:
      "Your references have been verified! You're now visible to more employers.",
    verified:
      "Congratulations! Your profile is now fully verified with ID and references.",
    premium:
      "You've achieved Premium verification status! You'll receive priority consideration for roles.",
  };

  await createNotification(userId, {
    type: "system",
    title: `You're now ${newTier} verified!`,
    message: messages[newTier],
    actionUrl: "/crew/dashboard",
    actionLabel: "View Profile",
    metadata: {
      candidateId,
      newTier,
      event: "verification_upgrade",
    },
  });
}

// ----------------------------------------------------------------------------
// VERIFICATION EVENTS
// ----------------------------------------------------------------------------

export interface LogEventOptions {
  oldValue?: string | null;
  newValue?: string | null;
  performedBy?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Log a verification event
 */
export async function logVerificationEvent(
  candidateId: string,
  eventType: VerificationEventType,
  options: LogEventOptions = {}
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("verification_events")
    .insert({
      candidate_id: candidateId,
      event_type: eventType,
      old_value: options.oldValue || null,
      new_value: options.newValue || null,
      performed_by: options.performedBy || null,
      notes: options.notes || null,
      metadata: options.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log verification event:", error);
    return null;
  }

  // Update verification_updated_at on candidate
  await supabase
    .from("candidates")
    .update({ verification_updated_at: new Date().toISOString() })
    .eq("id", candidateId);

  return data?.id || null;
}

/**
 * Get verification history for a candidate
 */
export async function getVerificationHistory(
  candidateId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    event_type: VerificationEventType;
    old_value: string | null;
    new_value: string | null;
    performed_by: string | null;
    notes: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("verification_events")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get verification history:", error);
    return [];
  }

  return data || [];
}

// ----------------------------------------------------------------------------
// REFERENCE MANAGEMENT
// ----------------------------------------------------------------------------

export interface AddReferenceInput {
  candidateId: string;
  refereeName: string;
  refereeEmail?: string | null;
  refereePhone?: string | null;
  relationship?: string | null;
  companyVessel?: string | null;
  datesWorked?: string | null;
  performedBy?: string | null;
}

/**
 * Add a new reference for a candidate
 */
export async function addReference(
  input: AddReferenceInput
): Promise<CandidateReference | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidate_references")
    .insert({
      candidate_id: input.candidateId,
      referee_name: input.refereeName,
      referee_email: input.refereeEmail || null,
      referee_phone: input.refereePhone || null,
      relationship: input.relationship || null,
      company_vessel: input.companyVessel || null,
      dates_worked: input.datesWorked || null,
      status: "pending",
      is_verified: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to add reference:", error);
    return null;
  }

  // Log event
  await logVerificationEvent(input.candidateId, "reference_added", {
    newValue: input.refereeName,
    performedBy: input.performedBy,
    metadata: { referenceId: data.id },
  });

  return data as CandidateReference;
}

/**
 * Update reference status (for recruiters)
 */
export async function updateReferenceStatus(
  referenceId: string,
  status: "pending" | "contacted" | "verified" | "failed" | "declined",
  options: {
    contactedVia?: string;
    rating?: number;
    feedback?: string;
    wouldRehire?: boolean;
    notes?: string;
    performedBy?: string;
  } = {}
): Promise<boolean> {
  const supabase = await createClient();

  // Get current reference
  const { data: current } = await supabase
    .from("candidate_references")
    .select("candidate_id, status, referee_name")
    .eq("id", referenceId)
    .single();

  if (!current) {
    console.error("Reference not found:", referenceId);
    return false;
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "contacted" && !options.contactedVia) {
    updates.contacted_at = new Date().toISOString();
  }
  if (options.contactedVia) {
    updates.contacted_via = options.contactedVia;
    updates.contacted_at = new Date().toISOString();
  }
  if (status === "verified") {
    updates.is_verified = true;
    updates.verified_at = new Date().toISOString();
    updates.verified_by = options.performedBy || null;
  }
  if (options.rating !== undefined) updates.rating = options.rating;
  if (options.feedback) updates.feedback = options.feedback;
  if (options.wouldRehire !== undefined)
    updates.would_rehire = options.wouldRehire;
  if (options.notes) updates.notes = options.notes;

  const { error } = await supabase
    .from("candidate_references")
    .update(updates)
    .eq("id", referenceId);

  if (error) {
    console.error("Failed to update reference status:", error);
    return false;
  }

  // Log event
  const eventType: VerificationEventType =
    status === "contacted"
      ? "reference_contacted"
      : status === "verified"
        ? "reference_verified"
        : "reference_contacted"; // fallback

  await logVerificationEvent(current.candidate_id, eventType, {
    oldValue: current.status,
    newValue: status,
    performedBy: options.performedBy,
    metadata: {
      referenceId,
      refereeName: current.referee_name,
      rating: options.rating,
    },
  });

  // Recalculate tier if reference was verified
  if (status === "verified") {
    await updateVerificationTier(current.candidate_id, options.performedBy);
  }

  return true;
}

// ----------------------------------------------------------------------------
// ID VERIFICATION
// ----------------------------------------------------------------------------

/**
 * Mark ID as verified (for recruiters)
 */
export async function verifyId(
  candidateId: string,
  options: {
    documentUrl?: string;
    notes?: string;
    performedBy?: string;
  } = {}
): Promise<boolean> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    id_verified_at: new Date().toISOString(),
    verification_updated_at: new Date().toISOString(),
  };

  if (options.documentUrl) updates.id_document_url = options.documentUrl;
  if (options.notes) updates.id_verification_notes = options.notes;

  const { error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to verify ID:", error);
    return false;
  }

  // Log event
  await logVerificationEvent(candidateId, "id_verified", {
    performedBy: options.performedBy,
    notes: options.notes,
  });

  // Recalculate tier
  await updateVerificationTier(candidateId, options.performedBy);

  return true;
}

/**
 * Upload ID document (for candidates)
 */
export async function uploadIdDocument(
  candidateId: string,
  documentUrl: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({
      id_document_url: documentUrl,
      verification_updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to upload ID document:", error);
    return false;
  }

  // Log event
  await logVerificationEvent(candidateId, "id_uploaded", {
    newValue: documentUrl,
  });

  return true;
}

// ----------------------------------------------------------------------------
// CV UPLOAD
// ----------------------------------------------------------------------------

/**
 * Upload CV and trigger tier recalculation
 */
export async function uploadCv(
  candidateId: string,
  cvUrl: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({
      cv_url: cvUrl,
      verification_updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to upload CV:", error);
    return false;
  }

  // Log event
  await logVerificationEvent(candidateId, "cv_uploaded", {
    newValue: cvUrl,
  });

  // Recalculate tier
  await updateVerificationTier(candidateId);

  return true;
}

// ----------------------------------------------------------------------------
// EMAIL VERIFICATION
// ----------------------------------------------------------------------------

/**
 * Mark email as verified
 */
export async function markEmailVerified(candidateId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({
      email_verified_at: new Date().toISOString(),
      verification_updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to mark email verified:", error);
    return false;
  }

  // Log event
  await logVerificationEvent(candidateId, "email_verified");

  // Recalculate tier
  await updateVerificationTier(candidateId);

  return true;
}

// ----------------------------------------------------------------------------
// VOICE VERIFICATION
// ----------------------------------------------------------------------------

/**
 * Mark voice verification as complete (called after Vapi call)
 */
export async function completeVoiceVerification(
  candidateId: string,
  vapiCallId: string,
  performedBy?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({
      voice_verified_at: new Date().toISOString(),
      voice_verification_id: vapiCallId,
      verification_updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to complete voice verification:", error);
    return false;
  }

  // Log event
  await logVerificationEvent(candidateId, "voice_completed", {
    newValue: vapiCallId,
    performedBy,
    metadata: { vapiCallId },
  });

  // Recalculate tier
  await updateVerificationTier(candidateId, performedBy);

  return true;
}

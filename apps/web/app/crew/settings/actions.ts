"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Settings data for a candidate
 */
export interface CandidateSettings {
  email: string;
  emailNotifications: boolean;
  jobAlerts: boolean;
  marketingEmails: boolean;
  profileVisibility: "public" | "agencies_only" | "private";
}

/**
 * Get current settings for the authenticated candidate
 */
export async function getSettingsData(): Promise<CandidateSettings | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id, email")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(
        `
        email,
        email_notifications,
        job_alerts,
        marketing_emails,
        profile_visibility
      `
      )
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
      .select(
        `
        email,
        email_notifications,
        job_alerts,
        marketing_emails,
        profile_visibility
      `
      )
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) return null;

  return {
    email: candidate.email || userData?.email || user.email || "",
    emailNotifications: candidate.email_notifications ?? true,
    jobAlerts: candidate.job_alerts ?? true,
    marketingEmails: candidate.marketing_emails ?? false,
    profileVisibility: candidate.profile_visibility || "agencies_only",
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationSettings(data: {
  emailNotifications?: boolean;
  jobAlerts?: boolean;
  marketingEmails?: boolean;
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

  let candidateUserId = userData?.id;

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!userData && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidateUserId = candidateByEmail.user_id;
    }
  }

  if (!candidateUserId) {
    return { success: false, error: "User not found" };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.emailNotifications !== undefined)
    updateData.email_notifications = data.emailNotifications;
  if (data.jobAlerts !== undefined) updateData.job_alerts = data.jobAlerts;
  if (data.marketingEmails !== undefined)
    updateData.marketing_emails = data.marketingEmails;

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("user_id", candidateUserId);

  if (error) {
    console.error("Error updating notification settings:", error);
    return { success: false, error: "Failed to update notification settings" };
  }

  revalidatePath("/crew/settings");
  return { success: true };
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(data: {
  profileVisibility: "public" | "agencies_only" | "private";
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

  const { error } = await supabase
    .from("candidates")
    .update({
      profile_visibility: data.profileVisibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating privacy settings:", error);
    return { success: false, error: "Failed to update privacy settings" };
  }

  revalidatePath("/crew/settings");
  return { success: true };
}

/**
 * Change password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    console.error("Error changing password:", updateError);
    return { success: false, error: "Failed to change password" };
  }

  return { success: true };
}

/**
 * Request account deletion
 */
export async function requestAccountDeletion(data: {
  reason?: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.password,
  });

  if (signInError) {
    return { success: false, error: "Password is incorrect" };
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate: { id: string } | null = null;

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
    return { success: false, error: "Candidate profile not found" };
  }

  // Mark candidate as deleted (soft delete)
  const { error: deleteError } = await supabase
    .from("candidates")
    .update({
      deleted_at: new Date().toISOString(),
      deletion_reason: data.reason || "User requested deletion",
      availability_status: "unavailable",
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidate.id);

  if (deleteError) {
    console.error("Error requesting account deletion:", deleteError);
    return { success: false, error: "Failed to process deletion request" };
  }

  // Mark user as inactive (if user record exists)
  if (userData) {
    await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.id);
  }

  // Sign out the user
  await supabase.auth.signOut();

  return { success: true };
}

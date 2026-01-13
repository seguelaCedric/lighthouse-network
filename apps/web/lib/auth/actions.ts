"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mapPositionToDatabaseValue, getPositionIndustry } from "@/lib/utils/position-mapping";
import { syncCandidateCreation } from "@/lib/vincere/sync-service";
import { sendEmail, welcomeCandidateEmail } from "@/lib/email";

export type AuthResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Determine redirect based on user type
  let redirectTo = "/dashboard"; // Default for recruiters

  if (authData.user) {
    // Check if user is a candidate
    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("auth_id", authData.user.id)
      .single();

    if (userData?.user_type === "candidate") {
      redirectTo = "/crew/dashboard";
    }
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo };
}

export async function signUp(
  email: string,
  password: string,
  metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    nationality?: string;
    candidate_type?: string;
    other_role_details?: string;
    primary_position?: string;
    years_experience?: string;
    current_status?: string;
    referral_id?: string | null;
  },
  redirectTo?: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const emailRedirectTo = safeRedirect
    ? `${baseUrl}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
    : `${baseUrl}/auth/callback`;

  // Determine if this is a candidate registration
  // Candidates have primary_position or candidate_type in metadata
  const isCandidate = !!(metadata?.primary_position || metadata?.candidate_type);

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata,
        user_type: isCandidate ? "candidate" : undefined,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // If this is a candidate registration, create user and candidate records
  if (isCandidate && authData.user && metadata) {
    // Use the actual Lighthouse Careers org ID
    const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Use service role client to bypass RLS for initial record creation
    // This is necessary because the user hasn't verified their email yet,
    // so auth.uid() is not available and RLS policies would block the insert
    const serviceClient = createServiceRoleClient();

    // Create or update user record with user_type = 'candidate'
    const { error: userError } = await serviceClient.from("users").upsert(
      {
        auth_id: authData.user.id,
        email: email.toLowerCase(),
        first_name: metadata.first_name || "",
        last_name: metadata.last_name || "",
        phone: metadata.phone || null,
        user_type: "candidate",
        organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
        is_active: true,
      },
      {
        onConflict: "auth_id",
      }
    );

    if (userError) {
      console.error("Failed to create user record:", userError);
      // Continue anyway - the user record might already exist
    }

    // Get the user record to link to candidate
    const { data: userRecord } = await serviceClient
      .from("users")
      .select("id")
      .eq("auth_id", authData.user.id)
      .single();

    // Check if candidate already exists (by email)
    const { data: existingCandidate } = await serviceClient
      .from("candidates")
      .select("id, user_id, first_name, last_name, phone, nationality, candidate_type, primary_position, years_experience")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let candidateId: string | null = null;

    if (existingCandidate) {
      candidateId = existingCandidate.id;
      // Link existing candidate to user account if not already linked
      if (!existingCandidate.user_id && userRecord?.id) {
        const normalizedPosition = metadata.primary_position
          ? mapPositionToDatabaseValue(metadata.primary_position)
          : existingCandidate.primary_position;
        const candidateType = metadata.candidate_type || existingCandidate.candidate_type;

        // Determine which preference field(s) to populate based on position and candidate type
        const positionIndustry = normalizedPosition
          ? getPositionIndustry(normalizedPosition, candidateType)
          : null;

        const updatePayload: Record<string, unknown> = {
          user_id: userRecord.id,
          first_name: metadata.first_name || existingCandidate.first_name,
          last_name: metadata.last_name || existingCandidate.last_name,
          phone: metadata.phone || existingCandidate.phone,
          whatsapp: metadata.phone || existingCandidate.phone,
          nationality: metadata.nationality || existingCandidate.nationality,
          candidate_type: candidateType,
          primary_position: normalizedPosition,
          years_experience: metadata.years_experience
            ? parseInt(metadata.years_experience)
            : existingCandidate.years_experience,
          availability_status: "available",
          updated_at: new Date().toISOString(),
        };

        // Also populate the appropriate preference position field(s)
        if (normalizedPosition && positionIndustry) {
          if (positionIndustry === "yacht" || positionIndustry === "both") {
            updatePayload.yacht_primary_position = normalizedPosition;
          }
          if (positionIndustry === "household" || positionIndustry === "both") {
            updatePayload.household_primary_position = normalizedPosition;
          }
          // Set industry_preference based on candidate type
          if (candidateType === "yacht_crew") {
            updatePayload.industry_preference = "yacht";
          } else if (candidateType === "household_staff") {
            updatePayload.industry_preference = "household";
          } else if (candidateType === "both") {
            updatePayload.industry_preference = "both";
          }
        }

        const { error: updateError } = await serviceClient
          .from("candidates")
          .update(updatePayload)
          .eq("id", existingCandidate.id);

        if (updateError) {
          console.error("Failed to update candidate:", updateError);
        }
      }
    } else {
      // Create new candidate record
      const normalizedPosition = metadata.primary_position
        ? mapPositionToDatabaseValue(metadata.primary_position)
        : null;
      const candidateType = metadata.candidate_type || null;

      // Determine which preference field(s) to populate based on position and candidate type
      const positionIndustry = normalizedPosition
        ? getPositionIndustry(normalizedPosition, candidateType)
        : null;

      const insertPayload: Record<string, unknown> = {
        user_id: userRecord?.id || null,
        first_name: metadata.first_name || "",
        last_name: metadata.last_name || "",
        email: email.toLowerCase(),
        phone: metadata.phone || null,
        whatsapp: metadata.phone || null,
        nationality: metadata.nationality || null,
        candidate_type: candidateType,
        primary_position: normalizedPosition,
        years_experience: metadata.years_experience
          ? parseInt(metadata.years_experience)
          : null,
        source: "self_registration",
        availability_status: "available",
      };

      // Also populate the appropriate preference position field(s)
      if (normalizedPosition && positionIndustry) {
        if (positionIndustry === "yacht" || positionIndustry === "both") {
          insertPayload.yacht_primary_position = normalizedPosition;
        }
        if (positionIndustry === "household" || positionIndustry === "both") {
          insertPayload.household_primary_position = normalizedPosition;
        }
        // Set industry_preference based on candidate type
        if (candidateType === "yacht_crew") {
          insertPayload.industry_preference = "yacht";
        } else if (candidateType === "household_staff") {
          insertPayload.industry_preference = "household";
        } else if (candidateType === "both") {
          insertPayload.industry_preference = "both";
        }
      }

      const { data: newCandidate, error: candidateError } = await serviceClient
        .from("candidates")
        .insert(insertPayload)
        .select("id")
        .single();

      if (candidateError || !newCandidate) {
        console.error("Failed to create candidate record:", candidateError);
        // Don't fail the registration, but log the error
      } else {
        candidateId = newCandidate.id;
      }
    }

    // Create candidate-agency relationship so Lighthouse Careers can see the candidate
    if (candidateId) {
      // Check if relationship already exists
      const { data: existingRelationship } = await serviceClient
        .from("candidate_agency_relationships")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("agency_id", DEFAULT_LIGHTHOUSE_ORG_ID)
        .maybeSingle();

      if (!existingRelationship) {
        const { error: relationshipError } = await serviceClient
          .from("candidate_agency_relationships")
          .insert({
            candidate_id: candidateId,
            agency_id: DEFAULT_LIGHTHOUSE_ORG_ID,
            relationship_type: "registered",
            is_exclusive: false,
          });

        if (relationshipError) {
          console.error("Failed to create candidate-agency relationship:", relationshipError);
          // Don't fail the registration, but log the error
        }
      }

      // Sync candidate to Vincere (fire-and-forget)
      syncCandidateCreation(candidateId).catch((err) =>
        console.error("Vincere sync failed for candidate creation:", err)
      );

      // Send welcome email (fire-and-forget)
      const welcomeEmail = welcomeCandidateEmail({
        candidateName: metadata.first_name || "there",
        position: metadata.primary_position || undefined,
        candidateType: metadata.candidate_type as "yacht_crew" | "private_staff" | undefined,
        dashboardLink: `${process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com"}/crew/dashboard`,
      });
      sendEmail({
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text,
      }).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );
    }

    // For candidates, sign them in directly (skip email verification)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Failed to auto-sign-in candidate:", signInError);
      // Don't fail registration, but they'll need to log in manually
    }

    revalidatePath("/", "layout");
    return { success: true, redirectTo: "/crew/dashboard" };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const oauthRedirectTo = safeRedirect
    ? `${baseUrl}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
    : `${baseUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthRedirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const emailRedirectTo = safeRedirect
    ? `${baseUrl}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
    : `${baseUrl}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

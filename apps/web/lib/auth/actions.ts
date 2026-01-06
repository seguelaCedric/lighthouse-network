"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo,
    },
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

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
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

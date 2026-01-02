"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// Types
export interface EmployerSession {
  employer_id: string;
  email: string;
  contact_name: string;
  company_name: string | null;
  tier: "basic" | "verified" | "premium";
  vetting_status: "pending" | "scheduled" | "completed" | "rejected";
}

/**
 * Get the current employer session from the cookie
 */
export async function getEmployerSession(): Promise<EmployerSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("employer_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .rpc("validate_employer_session", { p_session_token: sessionToken });

  if (error || !data || data.length === 0) {
    // Session invalid or expired - clear the cookie
    cookieStore.delete("employer_session");
    return null;
  }

  return data[0] as EmployerSession;
}

/**
 * Require employer authentication - redirects to login if not authenticated
 */
export async function requireEmployerAuth(): Promise<EmployerSession> {
  const session = await getEmployerSession();

  if (!session) {
    redirect("/employer/login");
  }

  return session;
}

/**
 * Require verified employer - redirects if not verified
 */
export async function requireVerifiedEmployer(): Promise<EmployerSession> {
  const session = await requireEmployerAuth();

  if (session.vetting_status !== "completed") {
    redirect("/employer/portal/verification-required");
  }

  return session;
}

/**
 * Sign out the employer
 */
export async function signOutEmployer(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("employer_session")?.value;

  if (sessionToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Revoke the session in the database
    await supabase.rpc("revoke_employer_session", { p_session_token: sessionToken });

    // Clear the cookie
    cookieStore.delete("employer_session");
  }

  redirect("/employer/login");
}

/**
 * Get full employer account details
 */
export async function getEmployerAccount(employerId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("employer_accounts")
    .select("*")
    .eq("id", employerId)
    .single();

  if (error) {
    console.error("Error fetching employer account:", error);
    return null;
  }

  return data;
}

/**
 * Update employer account
 */
export async function updateEmployerAccount(
  employerId: string,
  updates: Partial<{
    contact_name: string;
    phone: string;
    company_name: string;
    hiring_for: string;
    vessel_name: string;
    vessel_type: string;
    vessel_size_meters: number;
    property_type: string;
    property_location: string;
  }>
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("employer_accounts")
    .update(updates)
    .eq("id", employerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating employer account:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

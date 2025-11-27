"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, clientMagicLinkEmail, isResendConfigured } from "@/lib/email";

export type ClientAuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export type ClientSession = {
  clientId: string;
  clientName: string;
  agencyId: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
};

const CLIENT_SESSION_COOKIE = "lighthouse_client_session";

/**
 * Send a magic link to the client's email
 */
export async function sendMagicLink(email: string): Promise<ClientAuthResult> {
  const supabase = await createClient();

  // Find client by portal email
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, portal_enabled, portal_email")
    .eq("portal_email", email.toLowerCase().trim())
    .eq("portal_enabled", true)
    .single();

  if (clientError || !client) {
    // Don't reveal whether email exists for security
    return {
      success: true,
      message: "If an account exists for this email, you will receive a login link shortly.",
    };
  }

  // Generate magic link token
  const { data: token, error: tokenError } = await supabase.rpc(
    "generate_client_magic_link",
    { p_client_id: client.id }
  );

  if (tokenError) {
    console.error("Error generating magic link:", tokenError);
    return {
      success: false,
      error: "Failed to generate login link. Please try again.",
    };
  }

  // Build magic link URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/client/auth/verify?token=${token}`;

  // Send email if Resend is configured
  if (isResendConfigured()) {
    const emailContent = clientMagicLinkEmail({
      clientName: client.name,
      magicLink,
      expiresIn: "1 hour",
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.error("Failed to send magic link email:", emailResult.error);
      // Still return success to not reveal if email exists
    } else {
      console.log(`Magic link email sent to ${email} (ID: ${emailResult.id})`);
    }
  } else {
    // Development fallback - log the link
    console.log("=== Magic Link (dev mode - no email configured) ===");
    console.log(`Email: ${email}`);
    console.log(`Client: ${client.name}`);
    console.log(`Link: ${magicLink}`);
    console.log("===================================================");
  }

  return {
    success: true,
    message: "If an account exists for this email, you will receive a login link shortly.",
  };
}

/**
 * Verify a magic link token and create a session
 */
export async function verifyMagicLink(
  token: string,
  userAgent?: string
): Promise<ClientAuthResult> {
  if (!token) {
    return {
      success: false,
      error: "Invalid or missing token.",
    };
  }

  const supabase = await createClient();

  // Verify token and create session
  const { data, error } = await supabase.rpc("verify_client_magic_link", {
    p_token: token,
    p_user_agent: userAgent || null,
    p_ip_address: null, // IP handled at edge/middleware level
  });

  if (error || !data || data.length === 0) {
    console.error("Error verifying magic link:", error);
    return {
      success: false,
      error: "This login link is invalid or has expired. Please request a new one.",
    };
  }

  const session = data[0];

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE, session.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath("/client", "layout");

  return {
    success: true,
    message: "Login successful!",
  };
}

/**
 * Get the current client session
 */
export async function getClientSession(): Promise<ClientSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("validate_client_session", {
    p_session_token: sessionToken,
  });

  if (error || !data || data.length === 0) {
    // Invalid session, clear the cookie
    cookieStore.delete(CLIENT_SESSION_COOKIE);
    return null;
  }

  const session = data[0];

  return {
    clientId: session.client_id,
    clientName: session.client_name,
    agencyId: session.agency_id,
    primaryContactName: session.primary_contact_name,
    primaryContactEmail: session.primary_contact_email,
  };
}

/**
 * Sign out the current client
 */
export async function clientSignOut(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;

  if (sessionToken) {
    const supabase = await createClient();
    await supabase.rpc("revoke_client_session", {
      p_session_token: sessionToken,
    });
  }

  cookieStore.delete(CLIENT_SESSION_COOKIE);
  revalidatePath("/client", "layout");
  redirect("/client/auth/login");
}

/**
 * Require client authentication - redirects to login if not authenticated
 */
export async function requireClientAuth(): Promise<ClientSession> {
  const session = await getClientSession();

  if (!session) {
    redirect("/client/auth/login");
  }

  return session;
}

/**
 * Check if client is authenticated without redirecting
 */
export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getClientSession();
  return session !== null;
}

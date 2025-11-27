import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const CLIENT_SESSION_COOKIE = "lighthouse_client_session";

export interface ClientSessionData {
  clientId: string;
  clientName: string;
  agencyId: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
}

/**
 * Get the client session from cookies for API routes
 * Returns null if not authenticated
 */
export async function getClientSessionFromCookie(): Promise<ClientSessionData | null> {
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
 * Require client authentication in API routes
 * Returns the session or throws an error
 */
export async function requireClientSession(): Promise<ClientSessionData> {
  const session = await getClientSessionFromCookie();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

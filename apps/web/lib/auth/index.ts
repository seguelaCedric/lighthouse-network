import { createClient } from "@/lib/supabase/server";

export interface Session {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

/**
 * Get the current authenticated session from Supabase
 * Returns null if not authenticated
 */
export async function auth(): Promise<Session | null> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
  };
}

/**
 * Require authentication in API routes
 * Returns the session or throws an error
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

// Re-export client session utilities
export {
  getClientSessionFromCookie,
  requireClientSession,
  type ClientSessionData,
} from "./client-session";

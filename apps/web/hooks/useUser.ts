"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UseUserReturn = {
  user: User | null;
  session: Session | null;
  userType: string | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

// Create singleton supabase client outside the hook to avoid re-creation
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use singleton client
  const supabase = useMemo(() => getSupabaseClient(), []);

  const fetchUserType = useCallback(async (authId: string) => {
    const { data } = await supabase
      .from("users")
      .select("user_type")
      .eq("auth_id", authId)
      .single();

    setUserType(data?.user_type ?? null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user?.id) {
        await fetchUserType(data.session.user.id);
      } else {
        setUserType(null);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to get session"));
      setUser(null);
      setSession(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchUserType]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session - inline to avoid stale closure issues
    const initSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          setError(sessionError);
          setLoading(false);
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user?.id) {
          const { data: userData } = await supabase
            .from("users")
            .select("user_type")
            .eq("auth_id", data.session.user.id)
            .single();

          if (isMounted) {
            setUserType(userData?.user_type ?? null);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to get session"));
          setLoading(false);
        }
      }
    };

    initSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("user_type")
          .eq("auth_id", newSession.user.id)
          .single();

        if (isMounted) {
          setUserType(userData?.user_type ?? null);
        }
      } else {
        setUserType(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, session, userType, loading, error, refresh };
}

"use client";

import { useEffect, useState, useCallback } from "react";
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

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

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
    // Get initial session
    refresh();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchUserType(session.user.id);
      } else {
        setUserType(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refresh, fetchUserType]);

  return { user, session, userType, loading, error, refresh };
}

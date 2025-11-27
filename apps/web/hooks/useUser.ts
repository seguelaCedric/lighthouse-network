"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UseUserReturn = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to get session"));
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    refresh();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  return { user, session, loading, error, refresh };
}

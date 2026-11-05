"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { User, Session } from "@supabase/supabase-js";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);

          if (requireAuth && !currentSession) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
        if (mounted) {
          setIsLoading(false);
          if (requireAuth) router.push("/login");
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (requireAuth && !session) {
          router.push("/login");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, requireAuth]);

  // Helper to fetch authorization header for FastAPI backend API requests
  const getAuthHeaders = async () => {
    if (!session) return {};
    return {
      Authorization: `Bearer ${session.access_token}`
    };
  };

  return {
    user,
    session,
    isLoading,
    getAuthHeaders,
    isAuthenticated: !!user
  };
}

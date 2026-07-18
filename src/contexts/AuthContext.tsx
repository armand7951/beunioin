import type { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

export interface MemberProfile {
  id: string;
  full_name: string;
  phone: string;
}
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProfile = useCallback(async (activeSession?: Session | null) => {
    const currentSession = activeSession ?? (await supabase.auth.getSession()).data.session;
    if (!currentSession?.user) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,phone")
      .eq("id", currentSession.user.id)
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  const loadAdmin = useCallback(async (activeSession?: Session | null) => {
    const currentSession = activeSession ?? (await supabase.auth.getSession()).data.session;
    if (!currentSession?.access_token) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });
      setIsAdmin(response.ok && (await response.json()).isAdmin === true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await Promise.all([loadProfile(data.session), loadAdmin(data.session)]);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        window.setTimeout(() => {
          void Promise.all([loadProfile(nextSession), loadAdmin(nextSession)]);
        }, 0);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadAdmin, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin,
      refreshProfile: () => loadProfile(session),
      refreshAdmin: () => loadAdmin(session),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
      },
    }),
    [isAdmin, loadAdmin, loadProfile, loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

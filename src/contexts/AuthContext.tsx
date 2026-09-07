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
type AdminRole = "admin" | "operator" | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  isAdmin: boolean;
  // 'admin' 管理者 | 'operator' 操作者 | null 不是管理員。介面用它決定「人員」與
  // 「操作紀錄」顯不顯示；真正的權限判斷在每支 RPC 的 require_admin，不在這裡。
  adminRole: AdminRole;
  refreshProfile: () => Promise<void>;
  refreshAdmin: () => Promise<AdminRole>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);

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

  // 回傳角色而不是只寫進 state：剛登入的那一刻 state 還沒更新，登入頁得等到
  // 這支的結果才知道要把人帶去後台還是會員中心。
  const loadAdmin = useCallback(
    async (activeSession?: Session | null): Promise<AdminRole> => {
      const currentSession =
        activeSession ?? (await supabase.auth.getSession()).data.session;
      if (!currentSession?.access_token) {
        setIsAdmin(false);
        setAdminRole(null);
        return null;
      }

      try {
        const response = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${currentSession.access_token}` },
        });
        const body = response.ok ? await response.json() : null;
        const role: AdminRole =
          body?.role === "admin" || body?.role === "operator" ? body.role : null;
        setIsAdmin(body?.isAdmin === true);
        setAdminRole(role);
        return role;
      } catch {
        setIsAdmin(false);
        setAdminRole(null);
        return null;
      }
    },
    [],
  );

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
      adminRole,
      refreshProfile: () => loadProfile(session),
      // 不帶 session：剛登入時 state 裡的還是舊值，讓它自己去讀當前 session。
      refreshAdmin: () => loadAdmin(),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
        setAdminRole(null);
      },
    }),
    [adminRole, isAdmin, loadAdmin, loadProfile, loading, profile, session],
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

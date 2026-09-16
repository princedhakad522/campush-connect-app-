import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { getProfile, ensureProfile } from "../lib/api";
import type { Profile } from "../lib/types";

interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  isStaff: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  isStaff: false,
  isAdmin: false,
  isTeacher: false,
  isStudent: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = (current: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  }) => {
    ensureProfile(current)
      .then(setProfile)
      .catch(() => {
        getProfile(current.id).then(setProfile).catch(() => setProfile(null));
      });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user ?? null;
      setUser(current ? { id: current.id, email: current.email } : null);
      if (current) {
        loadProfile(current);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user ?? null;
      setUser(current ? { id: current.id, email: current.email } : null);
      if (current) {
        loadProfile(current);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfile(p);
  };

  const role = profile?.role;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        isStaff: role === "teacher" || role === "admin",
        isAdmin: role === "admin",
        isTeacher: role === "teacher",
        isStudent: role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
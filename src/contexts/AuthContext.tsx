import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { isUsingSupabasePlaceholders, supabase } from "../lib/supabase";
import { parseJsonStringArray } from "../lib/profileFields";
import {
  resolveEffectiveRole,
  inferRoleFromSessionUser,
  learnerNeedsOnboarding,
  isStaffRole,
  normalizeUserRole,
  staffRoleFromAppMetadataOnly,
  type UserRole,
} from "@/lib/userRole";
import { isTrustedBootstrapAdmin } from "@/lib/trustedAdminBootstrap";
import { queryClient, queryKeys } from "@/lib/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export type { UserRole };

export interface OnboardingData {
  interests: string[];
  selectedCourses: number[];
  careerGoal: string;
  experienceLevel: string;
  completed: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  careerGoal?: string;
  bio?: string;
  headline?: string;
  location?: string;
  linkedin?: string;
  /** Professional skills from profiles.skills (jsonb) */
  skills?: string[];
  onboarding: OnboardingData;
}

function mapProfileRowToAppUser(data: Record<string, unknown>, authUser?: User | null): AppUser {
  const interests = parseJsonStringArray(data.interests);
  const profileEmail = typeof data.email === "string" ? data.email : "";
  let role = resolveEffectiveRole(data, authUser);
  // VITE_TRUSTED_ADMIN_EMAILS: UI matches intent even if DB row has not refreshed yet.
  if (isTrustedBootstrapAdmin(authUser?.email ?? null) || isTrustedBootstrapAdmin(profileEmail || null)) {
    role = "admin";
  }
  const completed = isStaffRole(role) ? true : Boolean(data.onboarding_completed);
  return {
    id: String(data.id),
    name: (typeof data.name === "string" && data.name) || "User",
    email: typeof data.email === "string" ? data.email : "",
    role,
    avatar: typeof data.avatar_url === "string" ? data.avatar_url : undefined,
    careerGoal: typeof data.career_goal === "string" ? data.career_goal : undefined,
    bio: typeof data.bio === "string" ? data.bio : undefined,
    headline: typeof data.headline === "string" ? data.headline : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
    linkedin: typeof data.linkedin === "string" ? data.linkedin : undefined,
    skills: parseJsonStringArray(data.skills),
    onboarding: {
      completed,
      careerGoal: typeof data.career_goal === "string" ? data.career_goal : "",
      interests,
      selectedCourses: [],
      experienceLevel: "",
    },
  };
}

/** When the profiles row cannot be read yet, infer role from JWT metadata (app + user, incl. `roles` arrays). */
function roleFromAuthUser(authUser: User): UserRole {
  return inferRoleFromSessionUser(authUser);
}

function mapAuthUserToFallbackAppUser(authUser: User): AppUser {
  const meta = authUser.user_metadata || {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    authUser.email?.split("@")[0] ||
    "User";
  const avatar =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    undefined;
  let role = roleFromAuthUser(authUser);
  if (isTrustedBootstrapAdmin(authUser.email)) role = "admin";
  return {
    id: authUser.id,
    name,
    email: authUser.email ?? "",
    role,
    avatar,
    onboarding: {
      ...defaultOnboarding,
      // Staff must never be routed to the learner onboarding wizard when profile fetch lags or fails once.
      completed: isStaffRole(role) ? true : defaultOnboarding.completed,
    },
  };
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  completeOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  /** Reload profile from Supabase (e.g. after avatar upload — auth events do not fire on profile-only updates). */
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  
  // Global Auth Modal State
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultOnboarding: OnboardingData = {
  interests: [],
  selectedCourses: [],
  careerGoal: "",
  experienceLevel: "",
  completed: false,
};

// ─── Demo accounts removed from initial state — users must log in ────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const rq = useQueryClient();
  /** Same user as `user` — refs stay in sync for realtime profile reloads (no stale closure). */
  const authUserForProfileRef = useRef<User | null>(null);
  useEffect(() => {
    authUserForProfileRef.current = user;
  }, [user]);

  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  /** Google/OAuth users need a profiles row; trigger usually creates it, but this covers gaps. */
  const ensureProfileFromAuthUser = async (authUser: User) => {
    if (isUsingSupabasePlaceholders) return;
    const { data: existing, error: existingErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();
    if (existing) return;
    if (existingErr) {
      // Do not insert/upsert if we could not verify absence — upsert with student role could overwrite an admin row.
      console.warn("ensureProfileFromAuthUser: could not read existing profile, skipping create:", existingErr.message);
      return;
    }

    const meta = authUser.user_metadata || {};
    const name =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      authUser.email?.split("@")[0] ||
      "User";
    const avatar =
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      undefined;

    const role = roleFromAuthUser(authUser);
    const onboarding_completed = isStaffRole(role);

    const { error: insertErr } = await supabase.from("profiles").insert({
      id: authUser.id,
      name,
      email: authUser.email ?? "",
      role,
      avatar_url: avatar,
      onboarding_completed,
    });
    if (insertErr && !String(insertErr.message || "").toLowerCase().includes("duplicate")) {
      console.error("ensureProfileFromAuthUser insert error:", insertErr.message);
    }
  };

  // Load user profile from Supabase profiles table
  const loadUserProfile = async (userId: string, authUser?: User | null) => {
    // Dashboard + RLS both use `profiles.role`. If the row is stale `student`, self-serve recovery:
    // (1) VITE_TRUSTED_ADMIN_EMAILS — deploy-time allowlist; (2) JWT app_metadata staff — cannot be forged by clients.
    // We do not persist from user_metadata alone (users could otherwise self-promote in DB).
    const syncProfileStaffToDatabase = async (row: Record<string, unknown>): Promise<Record<string, unknown>> => {
      if (!authUser || isUsingSupabasePlaceholders) return row;
      let working: Record<string, unknown> = row;
      const uid = userId;
      const pull = async () => {
        const fresh = await api.getProfile(uid);
        if (fresh) working = fresh as Record<string, unknown>;
      };

      let dbRole = normalizeUserRole(working.role);
      const profileEmail = typeof working.email === "string" ? working.email : "";

      if (isTrustedBootstrapAdmin(authUser.email) || isTrustedBootstrapAdmin(profileEmail)) {
        if (dbRole !== "admin") {
          const { error } = await supabase
            .from("profiles")
            .update({ role: "admin", onboarding_completed: true })
            .eq("id", uid);
          if (error) console.warn("Trusted admin bootstrap: profiles update failed:", error.message);
          else await pull();
        }
      }

      dbRole = normalizeUserRole(working.role);
      const fromApp = staffRoleFromAppMetadataOnly(authUser);
      if (dbRole === "student" && fromApp && isStaffRole(fromApp)) {
        const { error } = await supabase
          .from("profiles")
          .update({ role: fromApp, onboarding_completed: true })
          .eq("id", uid);
        if (error) console.warn("Sync staff from app_metadata: profiles update failed:", error.message);
        else await pull();
      }

      // DB-side recovery: SECURITY DEFINER RPC (see supabase/rpc_recover_staff_profile.sql). Works when RLS blocks client UPDATE.
      dbRole = normalizeUserRole(working.role);
      if (dbRole === "student") {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("recover_my_staff_profile");
        if (rpcErr) {
          const m = (rpcErr.message ?? "").toLowerCase();
          const fnMissing =
            rpcErr.code === "42883" || m.includes("does not exist") || m.includes("could not find");
          if (!fnMissing) console.warn("recover_my_staff_profile:", rpcErr.message);
        } else if (rpcData && typeof rpcData === "object" && (rpcData as { ok?: boolean }).ok === true) {
          await pull();
        }
      }

      return working;
    };

    try {
      const data = await api.getProfile(userId);
      if (data) {
        const row = await syncProfileStaffToDatabase(data as Record<string, unknown>);
        setAppUser(mapProfileRowToAppUser(row, authUser));
        return true;
      }
      if (authUser) {
        await ensureProfileFromAuthUser(authUser);
        const retry = await api.getProfile(userId);
        if (retry) {
          const row = await syncProfileStaffToDatabase(retry as Record<string, unknown>);
          setAppUser(mapProfileRowToAppUser(row, authUser));
          return true;
        }
      }
      console.error("Could not load profile for user:", userId);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
    if (authUser) {
      // Do not block a valid session on profile RLS / missing row issues.
      setAppUser(mapAuthUserToFallbackAppUser(authUser));
    }
    return false;
  };

  const loadUserProfileRef = useRef(loadUserProfile);
  loadUserProfileRef.current = loadUserProfile;

  // Realtime: profile row updates (role, skills, avatar, etc.) — keep appUser in sync without refresh.
  useEffect(() => {
    if (!user?.id || isUsingSupabasePlaceholders) return;
    const uid = user.id;
    const channel = supabase
      .channel(`profile_self_${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
        () => {
          void loadUserProfileRef.current(uid, authUserForProfileRef.current);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    // PILLAR 2: Frictionless Authentication State
    // Use getUser() for ACTIVE validation (confirms user isn't disabled/deleted)
    const initializeAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          setUser(user);
          // Use ref so this effect is resilient to function identity changes.
          await loadUserProfileRef.current(user.id, user);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // PILLAR 2: Auto-Refresh Management
    // Ensures sessions don't expire during 2-hour video lectures
    supabase.auth.startAutoRefresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth Event: ${event}`);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use ref to avoid stale closure issues inside this effect.
          void loadUserProfileRef.current(session.user.id, session.user);
        } else {
          setAppUser(null);
        }
      }
    );

    // Stop refresh when tab is hidden to save battery/network (Blueprint directive)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (isUsingSupabasePlaceholders) {
      return {
        error: new Error(
          "Supabase is not configured. Please set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env`."
        ),
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    // Try to load profile, but never block a valid session on profile fetch/RLS issues.
    if (data.user) {
      setUser(data.user);
      if (data.session) setSession(data.session);
      await loadUserProfile(data.user.id, data.user);
    }
    return { error: null };
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    if (isUsingSupabasePlaceholders) {
      return {
        error: new Error(
          "Supabase is not configured. Please set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env`."
        ),
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role }
      }
    });

    // Immediately create a profile row so the user is queryable right away
    if (data.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role,
        joined: new Date().toISOString(),
        onboarding_completed: false,
        career_goal: '',
      }, { onConflict: 'id' });
    }

    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    rq.clear();
    setAppUser(null);
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadUserProfile(user.id, user);
  };

  const completeOnboarding = async (data: Partial<OnboardingData>) => {
    if (!user) return;

    // Optimistic UI update
    setAppUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        careerGoal: data.careerGoal || prev.careerGoal,
        onboarding: { ...prev.onboarding, ...data, completed: true },
      };
    });

    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, career_goal: data.careerGoal })
        .eq("id", user.id);
      // Profile row may already include avatar_url from onboarding; reload so appUser.avatar matches the DB.
      await loadUserProfile(user.id, user);
    } catch (e) {
      console.log("Failed to save onboarding to DB, local state updated.");
    }
  };

  // We are checking if appUser exists for auth status so UI can function without real keys momentarily
  const isAuthenticated = !!user;
  const needsOnboarding = learnerNeedsOnboarding(appUser);

  const prevRoleRef = useRef<UserRole | null>(null);
  useEffect(() => {
    if (!appUser) {
      prevRoleRef.current = null;
      return;
    }
    const prev = prevRoleRef.current;
    if (prev !== null && prev !== appUser.role) {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.base });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.base });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.base });
    }
    prevRoleRef.current = appUser.role;
  }, [appUser]);

  return (
    <AuthContext.Provider value={{
      user, appUser, session, loading, login, signup, logout, completeOnboarding, refreshProfile, isAuthenticated, needsOnboarding,
      isAuthModalOpen, authModalMode, openAuthModal, closeAuthModal
    }}>
      {/* Always mount children — use opacity fade to prevent flash */}
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s ease' }}>
        {children}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

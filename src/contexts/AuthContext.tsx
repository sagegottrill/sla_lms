import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { isUsingSupabasePlaceholders, supabase } from "../lib/supabase";

export type UserRole = "student" | "instructor" | "program_manager" | "admin";

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
  onboarding: OnboardingData;
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
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
    if (existing) return;

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

    await supabase.from("profiles").upsert(
      {
        id: authUser.id,
        name,
        email: authUser.email ?? "",
        role: "student" as UserRole,
        avatar_url: avatar,
        onboarding_completed: false,
      },
      { onConflict: "id" },
    );
  };

  // Load user profile from Supabase profiles table
  const loadUserProfile = async (userId: string, authUser?: User | null) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (data && !error) {
            // Map the flat DB row to the React AppUser interface expected by the UI
            const mappedUser: AppUser = {
              id: data.id,
              name: data.name || "User",
              email: data.email,
              role: data.role as UserRole,
              avatar: data.avatar_url,
              careerGoal: data.career_goal,
              bio: data.bio,
              onboarding: {
                completed: data.onboarding_completed || false,
                careerGoal: data.career_goal || "",
                interests: [],
                selectedCourses: [],
                experienceLevel: "",
              }
            };
            setAppUser(mappedUser);
        } else {
            if (authUser) {
              await ensureProfileFromAuthUser(authUser);
              const { data: retry } = await supabase.from("profiles").select("*").eq("id", userId).single();
              if (retry) {
                const mappedUser: AppUser = {
                  id: retry.id,
                  name: retry.name || "User",
                  email: retry.email,
                  role: retry.role as UserRole,
                  avatar: retry.avatar_url,
                  careerGoal: retry.career_goal,
                  bio: retry.bio,
                  onboarding: {
                    completed: retry.onboarding_completed || false,
                    careerGoal: retry.career_goal || "",
                    interests: [],
                    selectedCourses: [],
                    experienceLevel: "",
                  },
                };
                setAppUser(mappedUser);
                return;
              }
            }
            console.error("Could not load profile:", error?.message);
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
  };

  useEffect(() => {
    // PILLAR 2: Frictionless Authentication State
    // Use getUser() for ACTIVE validation (confirms user isn't disabled/deleted)
    const initializeAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          setUser(user);
          await loadUserProfile(user.id, user);
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
          void loadUserProfile(session.user.id, session.user);
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
    // Real Supabase auth
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
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
    setAppUser(null);
    setUser(null);
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

    // Try to update in DB
    try {
       await supabase
         .from('profiles')
         .update({ onboarding_completed: true, career_goal: data.careerGoal })
         .eq('id', user.id);
    } catch (e) {
        console.log("Failed to save onboarding to DB, local state updated.");
    }
  };

  // We are checking if appUser exists for auth status so UI can function without real keys momentarily
  const isAuthenticated = !!user;
  const needsOnboarding = !!appUser && !appUser.onboarding?.completed;

  return (
    <AuthContext.Provider value={{
      user, appUser, session, loading, login, signup, logout, completeOnboarding, isAuthenticated, needsOnboarding,
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

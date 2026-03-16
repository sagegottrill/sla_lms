import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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

  // Load user profile from Supabase profiles table
  const loadUserProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (data && !error) {
            setAppUser(data as AppUser);
        } else {
            console.error("Could not load profile:", error?.message);
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadUserProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
            loadUserProfile(session.user.id);
        } else {
            setAppUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Real Supabase auth
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
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
  const isAuthenticated = !!user || !!appUser;
  const needsOnboarding = !!appUser && !appUser.onboarding.completed;

  return (
    <AuthContext.Provider value={{
      user, appUser, session, loading, login, signup, logout, completeOnboarding, isAuthenticated, needsOnboarding
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

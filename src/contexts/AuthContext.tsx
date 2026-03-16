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
  // Start as null — restored from localStorage if demo session exists
  const [appUser, setAppUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem("sla_demo_user");
      return saved ? (JSON.parse(saved) as AppUser) : null;
    } catch { return null; }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Supabase profiles table
  const loadUserProfile = async (userId: string) => {
    // In a real app we'd fetch from profiles table. 
    // For now, if no DB exists, we fall back to mock data until we set up the tables.
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (data && !error) {
            setAppUser(data as AppUser);
        } else {
            console.log("Could not load profile, using mock.");
        }
    } catch {
        console.log("Supabase not fully configured yet, using mock profile.");
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
            // Don't clear appUser if we have a demo session in localStorage
            const saved = localStorage.getItem("sla_demo_user");
            if (!saved) setAppUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

// ─── Local demo accounts — any of these work without Supabase ───────────────
const DEMO_ACCOUNTS: Record<string, AppUser> = {
  "student@demo.sla": {
    id: "demo-student", name: "Chioma Eze", email: "student@demo.sla",
    role: "student",
    onboarding: { interests: ["Data Science", "Leadership"], selectedCourses: [1, 2], careerGoal: "Data Analyst", experienceLevel: "beginner", completed: true },
  },
  "instructor@demo.sla": {
    id: "demo-instructor", name: "Dr. Fatima Hassan", email: "instructor@demo.sla",
    role: "instructor",
    onboarding: { interests: [], selectedCourses: [], careerGoal: "", experienceLevel: "", completed: true },
  },
  "manager@demo.sla": {
    id: "demo-manager", name: "Ngozi Williams", email: "manager@demo.sla",
    role: "program_manager",
    onboarding: { interests: [], selectedCourses: [], careerGoal: "", experienceLevel: "", completed: true },
  },
  "admin@demo.sla": {
    id: "demo-admin", name: "Yasmin Belo-Osagie", email: "admin@demo.sla",
    role: "admin",
    onboarding: { interests: [], selectedCourses: [], careerGoal: "", experienceLevel: "", completed: true },
  },
};
const DEMO_PASSWORD = "demo1234";
// ─────────────────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    // Try demo accounts first — they work offline / without Supabase tables
    const demoUser = DEMO_ACCOUNTS[email.toLowerCase()];
    if (demoUser && password === DEMO_PASSWORD) {
      localStorage.setItem("sla_demo_user", JSON.stringify(demoUser));
      setAppUser(demoUser);
      return { error: null };
    }

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
    localStorage.removeItem("sla_demo_user");
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

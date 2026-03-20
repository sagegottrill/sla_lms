import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = "student" | "instructor" | "program_manager" | "admin" | "";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  
  // Wizard Steps State
  roleChoice: Role;
  skills: string[];
  interests: string[];
  avatarUrl: string | null;

  // Actions
  setRoleChoice: (role: Role) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  toggleInterest: (interest: string) => void;
  setAvatarUrl: (url: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      roleChoice: "",
      skills: [],
      interests: [],
      avatarUrl: null,

      setRoleChoice: (role) => set({ roleChoice: role }),
      addSkill: (skill) => set((state) => ({ 
        skills: state.skills.includes(skill) ? state.skills : [...state.skills, skill] 
      })),
      removeSkill: (skill) => set((state) => ({ 
        skills: state.skills.filter((s) => s !== skill) 
      })),
      toggleInterest: (interest) => set((state) => ({
        interests: state.interests.includes(interest)
          ? state.interests.filter((i) => i !== interest)
          : [...state.interests, interest]
      })),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ 
        hasCompletedOnboarding: false, 
        roleChoice: "", 
        skills: [], 
        interests: [], 
        avatarUrl: null 
      }),
    }),
    {
      name: 'connecta-onboarding-storage',
    }
  )
);

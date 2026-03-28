import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Self-service onboarding is learner-only; staff roles are assigned via invite. */
export type OnboardingRoleChoice = "student" | null;

interface OnboardingData {
  // Matches the onboarding wizard selections we capture across steps.
  role: OnboardingRoleChoice;
  skills: string[];
  interests: string[];
  avatarUrl: string | null;

  // Spec keys that we don't currently collect in the UI.
  // Keeping them optional means the store can still be strict about shape
  // without forcing UI changes.
  organization?: string;
  experienceLevel?: string;
  professionalGoals?: string;
}

interface OnboardingState {
  currentStep: number;
  direction: number; // used for directional step transition animations

  formData: Partial<OnboardingData>;
  setFormData: (data: Partial<OnboardingData>) => void;

  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      direction: 0,
      formData: {},
      setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1, direction: 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1), direction: -1 })),
      resetForm: () =>
        set({
          currentStep: 0,
          direction: 0,
          formData: {},
        }),
    }),
    {
      name: 'connect-her-onboarding-storage',
      // Persist only formData; animation-only state should be ephemeral.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        formData: state.formData,
      }),
    }
  )
);

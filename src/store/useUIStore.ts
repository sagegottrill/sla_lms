import { create } from 'zustand';

interface UIState {
  isTheaterMode: boolean;
  toggleTheaterMode: () => void;
  setTheaterMode: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTheaterMode: false,
  toggleTheaterMode: () => set((state) => ({ isTheaterMode: !state.isTheaterMode })),
  setTheaterMode: (value) => set({ isTheaterMode: value }),
}));

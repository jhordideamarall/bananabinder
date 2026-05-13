import { create } from 'zustand';

interface UIState {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  toggleFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showFilters: false,
  setShowFilters: (show) => set({ showFilters: show }),
  toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
}));

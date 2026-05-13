import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  coords: [number, number] | null;
  locationName: string;
  hasHydrated: boolean;
  setCoords: (coords: [number, number]) => void;
  setLocationName: (name: string) => void;
  setHasHydrated: (val: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      coords: null,
      locationName: 'Pilih Lokasi',
      hasHydrated: false,
      setCoords: (coords) => set({ coords }),
      setLocationName: (locationName) => set({ locationName }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'bananasbindery-location-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

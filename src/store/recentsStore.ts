import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from './create';
import type { RadioStation } from '../types/radio';

type RecentsState = {
  stations: RadioStation[];
  addRecent: (station: RadioStation) => void;
  clearRecents: () => void;
};

const MAX_RECENTS = 12;

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set, get) => ({
      stations: [],
      addRecent: (station) => {
        const without = get().stations.filter((item) => item.stationuuid !== station.stationuuid);
        set({ stations: [station, ...without].slice(0, MAX_RECENTS) });
      },
      clearRecents: () => set({ stations: [] }),
    }),
    {
      name: 'wave-recents',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

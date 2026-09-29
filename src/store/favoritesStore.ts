import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RadioStation } from '../types/radio';
import type { FavoriteSort } from '../utils/constants';

type FavoritesState = {
  stations: RadioStation[];
  sort: FavoriteSort;
  hydrated: boolean;
  isFavorite: (uuid: string) => boolean;
  toggleFavorite: (station: RadioStation) => void;
  removeFavorite: (uuid: string) => void;
  setSort: (sort: FavoriteSort) => void;
  sortedStations: () => RadioStation[];
  exportPayload: () => string;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      stations: [],
      sort: 'recent',
      hydrated: false,
      isFavorite: (uuid) => get().stations.some((station) => station.stationuuid === uuid),
      toggleFavorite: (station) => {
        const exists = get().isFavorite(station.stationuuid);
        set({
          stations: exists
            ? get().stations.filter((item) => item.stationuuid !== station.stationuuid)
            : [station, ...get().stations],
        });
      },
      removeFavorite: (uuid) =>
        set({
          stations: get().stations.filter((station) => station.stationuuid !== uuid),
        }),
      setSort: (sort) => set({ sort }),
      sortedStations: () => {
        const { stations, sort } = get();
        if (sort === 'name') {
          return [...stations].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        }
        if (sort === 'country') {
          return [...stations].sort((a, b) =>
            (a.country || a.countrycode).localeCompare(b.country || b.countrycode, 'fr'),
          );
        }
        return stations;
      },
      exportPayload: () =>
        JSON.stringify(
          get().stations.map((station) => ({
            stationuuid: station.stationuuid,
            name: station.name,
            country: station.country,
            url: station.urlResolved || station.url,
          })),
          null,
          2,
        ),
    }),
    {
      name: 'wave-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ stations: state.stations, sort: state.sort }),
      onRehydrateStorage: () => () => {
        useFavoritesStore.setState({ hydrated: true });
      },
    },
  ),
);

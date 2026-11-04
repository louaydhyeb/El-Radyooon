import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { radioBrowserApi } from '../api/radioBrowserApi';
import { audioService } from '../services/audioService';
import { fetchNowPlaying, type NowPlaying } from '../services/icy';
import type { RadioStation } from '../types/radio';
import { streamUrl } from '../utils/station';
import { useFavoritesStore } from './favoritesStore';
import { useRecentsStore } from './recentsStore';

type PlaySource = 'user' | 'auto';

type PlayerState = {
  currentStation: RadioStation | null;
  queue: RadioStation[];
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  error: string | null;
  nowPlaying: NowPlaying | null;
  sleepTimerEndsAt: number | null;
  playStation: (
    station: RadioStation,
    queue?: RadioStation[],
    source?: PlaySource,
  ) => Promise<void>;
  togglePlay: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  fadeToVolume: (target: number, durationMs?: number) => Promise<void>;
  setSleepTimer: (minutes: number) => void;
  clearError: () => void;
};

const ICY_POLL_MS = 18_000;
const DEAD_STREAM_MS = 15_000;
const MAX_AUTO_SKIPS = 6;

let sleepTimerHandle: ReturnType<typeof setTimeout> | null = null;
let icyTimer: ReturnType<typeof setInterval> | null = null;
let icyAbort: AbortController | null = null;
let icyToken = 0;
let deadWatch: ReturnType<typeof setTimeout> | null = null;
let fadeToken = 0;
let wantPlaying = false;
let autoNextLock = false;
const deadSkip = new Set<string>();

function clearSleepTimerHandle() {
  if (sleepTimerHandle) {
    clearTimeout(sleepTimerHandle);
    sleepTimerHandle = null;
  }
}

function stopIcy() {
  icyToken += 1;
  icyAbort?.abort();
  icyAbort = null;
  if (icyTimer) {
    clearInterval(icyTimer);
    icyTimer = null;
  }
}

function clearDeadWatch() {
  if (deadWatch) {
    clearTimeout(deadWatch);
    deadWatch = null;
  }
}

function lockScreenFor(station: RadioStation, nowPlaying?: NowPlaying | null) {
  return {
    title: nowPlaying?.title || station.name,
    artist: nowPlaying?.artist || station.country || station.name,
    albumTitle: station.name,
    artworkUrl: station.favicon || undefined,
  };
}

function pickFallbackStation(current: RadioStation, queue: RadioStation[]): RadioStation | null {
  if (queue.length > 1) {
    const index = queue.findIndex((item) => item.stationuuid === current.stationuuid);
    const start = index < 0 ? 0 : index;
    for (let offset = 1; offset < queue.length; offset += 1) {
      const candidate = queue[(start + offset) % queue.length];
      if (candidate && !deadSkip.has(candidate.stationuuid)) {
        return candidate;
      }
    }
  }
  const extras = [...useRecentsStore.getState().stations, ...useFavoritesStore.getState().stations];
  for (const station of extras) {
    if (station.stationuuid !== current.stationuuid && !deadSkip.has(station.stationuuid)) {
      return station;
    }
  }
  return null;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      const handleDeadStream = async () => {
        if (autoNextLock || !wantPlaying) {
          return;
        }
        const { currentStation, queue } = get();
        if (!currentStation) {
          return;
        }
        deadSkip.add(currentStation.stationuuid);
        if (deadSkip.size > MAX_AUTO_SKIPS) {
          wantPlaying = false;
          stopIcy();
          set({ isBuffering: false, isPlaying: false, error: 'unavailable' });
          return;
        }
        const next = pickFallbackStation(currentStation, queue);
        if (!next) {
          wantPlaying = false;
          stopIcy();
          set({ isBuffering: false, isPlaying: false, error: 'unavailable' });
          return;
        }
        autoNextLock = true;
        try {
          await get().playStation(next, queue.length ? queue : undefined, 'auto');
        } finally {
          autoNextLock = false;
        }
      };

      const armDeadWatch = () => {
        clearDeadWatch();
        if (!wantPlaying) {
          return;
        }
        deadWatch = setTimeout(() => {
          void handleDeadStream();
        }, DEAD_STREAM_MS);
      };

      const pollIcy = async (station: RadioStation, token: number) => {
        icyAbort?.abort();
        icyAbort = new AbortController();
        let result: NowPlaying | null = null;
        try {
          result = await fetchNowPlaying(streamUrl(station), station, icyAbort.signal);
        } catch {
          return;
        }
        if (token !== icyToken || get().currentStation?.stationuuid !== station.stationuuid) {
          return;
        }
        if (!result) {
          return;
        }
        const previous = get().nowPlaying;
        if (previous?.artist === result.artist && previous?.title === result.title) {
          return;
        }
        set({ nowPlaying: result });
        audioService.updateNowPlaying(lockScreenFor(station, result));
      };

      const startIcy = (station: RadioStation) => {
        stopIcy();
        const token = icyToken;
        set({ nowPlaying: null });
        const tick = () => {
          void pollIcy(station, token);
        };
        tick();
        icyTimer = setInterval(tick, ICY_POLL_MS);
      };

      audioService.setStatusHandler((playing, buffering, error) => {
        const hadError = Boolean(error);
        set({
          isPlaying: playing,
          isBuffering: buffering,
          error: hadError ? 'unavailable' : playing ? null : get().error,
        });
        if (playing) {
          clearDeadWatch();
          const station = get().currentStation;
          if (station) {
            deadSkip.delete(station.stationuuid);
          }
          return;
        }
        if (!wantPlaying) {
          clearDeadWatch();
          return;
        }
        if (hadError) {
          void handleDeadStream();
          return;
        }
        if (buffering) {
          armDeadWatch();
        }
      });

      const shift = async (delta: number) => {
        const { queue, currentStation } = get();
        if (!currentStation || queue.length === 0) {
          return;
        }
        const index = queue.findIndex((item) => item.stationuuid === currentStation.stationuuid);
        if (index < 0) {
          return;
        }
        const next = queue[(index + delta + queue.length) % queue.length];
        if (next) {
          await get().playStation(next, queue);
        }
      };

      return {
        currentStation: null,
        queue: [],
        isPlaying: false,
        isBuffering: false,
        volume: 0.72,
        error: null,
        nowPlaying: null,
        sleepTimerEndsAt: null,

        playStation: async (station, queue, source = 'user') => {
          fadeToken += 1;
          wantPlaying = true;
          if (source !== 'auto') {
            deadSkip.clear();
          }
          clearDeadWatch();
          stopIcy();
          set({
            currentStation: station,
            queue: queue ?? get().queue,
            isBuffering: true,
            isPlaying: false,
            error: null,
            nowPlaying: null,
          });
          useRecentsStore.getState().addRecent(station);
          void radioBrowserApi.clickStation(station.stationuuid);
          armDeadWatch();
          try {
            await audioService.play(streamUrl(station), lockScreenFor(station));
            await audioService.setVolume(get().volume);
            startIcy(station);
          } catch {
            set({
              isBuffering: false,
              isPlaying: false,
              error: 'playFailed',
            });
            void handleDeadStream();
          }
        },

        togglePlay: async () => {
          const { currentStation, isPlaying } = get();
          if (!currentStation) {
            return;
          }
          try {
            if (isPlaying) {
              wantPlaying = false;
              clearDeadWatch();
              stopIcy();
              fadeToken += 1;
              await audioService.pause();
              set({ isPlaying: false, isBuffering: false });
            } else {
              wantPlaying = true;
              if (!audioService.isReady()) {
                await get().playStation(currentStation, get().queue);
                return;
              }
              await audioService.resume();
              set({ isPlaying: true });
              startIcy(currentStation);
            }
          } catch {
            await get().playStation(currentStation, get().queue);
          }
        },

        playNext: () => shift(1),
        playPrevious: () => shift(-1),

        setVolume: async (volume) => {
          fadeToken += 1;
          set({ volume });
          await audioService.setVolume(volume);
        },

        fadeToVolume: async (target, durationMs = 10_000) => {
          const token = (fadeToken += 1);
          const steps = 16;
          const clamped = Math.min(1, Math.max(0, target));
          await audioService.setVolume(0);
          set({ volume: 0 });
          for (let step = 1; step <= steps; step += 1) {
            await delay(durationMs / steps);
            if (token !== fadeToken) {
              return;
            }
            const volume = (clamped * step) / steps;
            await audioService.setVolume(volume);
            set({ volume });
          }
        },

        setSleepTimer: (minutes) => {
          clearSleepTimerHandle();
          if (minutes <= 0) {
            set({ sleepTimerEndsAt: null });
            return;
          }
          const endsAt = Date.now() + minutes * 60 * 1000;
          set({ sleepTimerEndsAt: endsAt });
          sleepTimerHandle = setTimeout(
            () => {
              wantPlaying = false;
              clearDeadWatch();
              stopIcy();
              fadeToken += 1;
              void audioService.pause();
              set({ isPlaying: false, sleepTimerEndsAt: null });
            },
            minutes * 60 * 1000,
          );
        },

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'wave-player',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStation: state.currentStation,
        queue: state.queue,
        volume: state.volume,
      }),
    },
  ),
);

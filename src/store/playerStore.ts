import { create } from 'zustand';
import { radioBrowserApi } from '../api/radioBrowserApi';
import { audioService } from '../services/audioService';
import type { RadioStation } from '../types/radio';
import { streamUrl } from '../utils/station';
import { useRecentsStore } from './recentsStore';

type PlayerState = {
  currentStation: RadioStation | null;
  queue: RadioStation[];
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  error: string | null;
  sleepTimerEndsAt: number | null;
  playStation: (station: RadioStation, queue?: RadioStation[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setSleepTimer: (minutes: number) => void;
  clearError: () => void;
};

let sleepTimerHandle: ReturnType<typeof setTimeout> | null = null;

function clearSleepTimerHandle() {
  if (sleepTimerHandle) {
    clearTimeout(sleepTimerHandle);
    sleepTimerHandle = null;
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  audioService.setStatusHandler((playing, buffering, error) => {
    set({
      isPlaying: playing,
      isBuffering: buffering,
      error: error ? 'unavailable' : get().error,
    });
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
    sleepTimerEndsAt: null,

    playStation: async (station, queue) => {
      set({
        currentStation: station,
        queue: queue ?? get().queue,
        isBuffering: true,
        isPlaying: false,
        error: null,
      });
      useRecentsStore.getState().addRecent(station);
      void radioBrowserApi.clickStation(station.stationuuid);
      try {
        await audioService.play(streamUrl(station), {
          title: station.name,
          artist: station.country || undefined,
          artworkUrl: station.favicon || undefined,
        });
        await audioService.setVolume(get().volume);
      } catch {
        set({
          isBuffering: false,
          isPlaying: false,
          error: 'playFailed',
        });
      }
    },

    togglePlay: async () => {
      const { currentStation, isPlaying } = get();
      if (!currentStation) {
        return;
      }
      try {
        if (isPlaying) {
          await audioService.pause();
          set({ isPlaying: false });
        } else {
          await audioService.resume();
          set({ isPlaying: true });
        }
      } catch {
        await get().playStation(currentStation, get().queue);
      }
    },

    playNext: () => shift(1),
    playPrevious: () => shift(-1),

    setVolume: async (volume) => {
      set({ volume });
      await audioService.setVolume(volume);
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
          void audioService.pause();
          set({ isPlaying: false, sleepTimerEndsAt: null });
        },
        minutes * 60 * 1000,
      );
    },

    clearError: () => set({ error: null }),
  };
});

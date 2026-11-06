import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from './create';

type AlarmState = {
  enabled: boolean;
  hour: number;
  minute: number;
  stationUuid: string | null;
  setEnabled: (enabled: boolean) => void;
  setTime: (hour: number, minute: number) => void;
  setStationUuid: (stationUuid: string | null) => void;
};

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set) => ({
      enabled: false,
      hour: 7,
      minute: 0,
      stationUuid: null,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
      setStationUuid: (stationUuid) => set({ stationUuid }),
    }),
    {
      name: 'wave-alarm',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        hour: state.hour,
        minute: state.minute,
        stationUuid: state.stationUuid,
      }),
    },
  ),
);

export function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function nextAlarmDate(hour: number, minute: number, from = new Date()): Date {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from './create';
import { detectDeviceLocale, type AppLocale } from '../i18n/translations';
import { applyLayoutDirection } from '../i18n/rtl';

type SettingsState = {
  hideBroken: boolean;
  locale: AppLocale;
  setHideBroken: (value: boolean) => void;
  setLocale: (locale: AppLocale) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hideBroken: true,
      locale: detectDeviceLocale(),
      setHideBroken: (hideBroken) => set({ hideBroken }),
      setLocale: (locale) => {
        applyLayoutDirection(locale);
        set({ locale });
      },
    }),
    {
      name: 'wave-settings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted) => {
        const data = persisted as Partial<SettingsState>;
        const locale: AppLocale = data.locale === 'en' || data.locale === 'ar' ? data.locale : 'fr';
        return {
          hideBroken: data.hideBroken ?? true,
          locale,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          applyLayoutDirection(state.locale);
        }
      },
    },
  ),
);

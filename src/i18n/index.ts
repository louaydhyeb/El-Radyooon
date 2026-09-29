import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { dictionaries, type AppLocale, type TranslationKey } from './translations';

export type { AppLocale, TranslationKey };
export { isRtlLocale, layoutDirection } from './rtl';

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let value = dictionaries[locale][key] ?? dictionaries.fr[key] ?? key;
  if (vars) {
    for (const [name, raw] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(raw));
    }
  }
  return value;
}

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  return translate(useSettingsStore.getState().locale, key, vars);
}

export function useT() {
  const locale = useSettingsStore((s) => s.locale);
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
}

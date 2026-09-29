import { I18nManager, Platform } from 'react-native';
import { RTL_LOCALES, type AppLocale } from './translations';

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function layoutDirection(locale: AppLocale): 'rtl' | 'ltr' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

/** Persist RTL for the next cold start. Text updates immediately; flex layout flips after relaunch. */
export function applyLayoutDirection(locale: AppLocale) {
  if (Platform.OS === 'web') {
    return;
  }
  const rtl = isRtlLocale(locale);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}

import { Platform } from 'react-native';
import {
  addHomeWidgetToggleListener,
  isHomeWidgetAvailable,
  updateHomeWidget,
} from '../../modules/home-widget/src';
import { t } from '../i18n';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';

function pushFromPlayer() {
  const { currentStation, isPlaying, isBuffering } = usePlayerStore.getState();
  const hasStation = Boolean(currentStation);
  void updateHomeWidget({
    stationName: currentStation?.name?.trim() || 'El Radyooon',
    subtitle: !hasStation
      ? t('widget.emptySubtitle')
      : isBuffering
        ? t('widget.connecting')
        : t('widget.live'),
    isPlaying,
    hasStation,
    toggleLabel: isPlaying ? t('a11y.pause') : t('a11y.play'),
  });
}

if (Platform.OS === 'android' && isHomeWidgetAvailable()) {
  addHomeWidgetToggleListener(() => {
    void usePlayerStore.getState().togglePlay();
  });
}

export function startHomeWidgetSync(): () => void {
  if (Platform.OS !== 'android' || !isHomeWidgetAvailable()) {
    return () => undefined;
  }

  pushFromPlayer();

  const unsubPlayer = usePlayerStore.subscribe((state, prev) => {
    if (
      state.currentStation?.stationuuid === prev.currentStation?.stationuuid &&
      state.currentStation?.name === prev.currentStation?.name &&
      state.isPlaying === prev.isPlaying &&
      state.isBuffering === prev.isBuffering
    ) {
      return;
    }
    pushFromPlayer();
  });

  const unsubSettings = useSettingsStore.subscribe((state, prev) => {
    if (state.locale === prev.locale) {
      return;
    }
    pushFromPlayer();
  });

  return () => {
    unsubPlayer();
    unsubSettings();
  };
}

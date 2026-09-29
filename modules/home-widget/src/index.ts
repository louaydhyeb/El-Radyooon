import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type HomeWidgetNative = {
  update: (
    stationName: string,
    subtitle: string,
    isPlaying: boolean,
    hasStation: boolean,
    toggleLabel: string,
  ) => Promise<void>;
  addListener: (eventName: 'onToggle', listener: () => void) => { remove: () => void };
};

const native = Platform.OS === 'android' ? requireOptionalNativeModule<HomeWidgetNative>('HomeWidget') : null;

export type HomeWidgetSnapshot = {
  stationName: string;
  subtitle: string;
  isPlaying: boolean;
  hasStation: boolean;
  toggleLabel: string;
};

export function isHomeWidgetAvailable(): boolean {
  return native != null;
}

export async function updateHomeWidget(snapshot: HomeWidgetSnapshot): Promise<void> {
  if (!native) {
    return;
  }
  await native.update(
    snapshot.stationName,
    snapshot.subtitle,
    snapshot.isPlaying,
    snapshot.hasStation,
    snapshot.toggleLabel,
  );
}

export function addHomeWidgetToggleListener(listener: () => void): () => void {
  if (!native) {
    return () => undefined;
  }
  const sub = native.addListener('onToggle', listener);
  return () => sub.remove();
}

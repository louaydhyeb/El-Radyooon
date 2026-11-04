import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '../i18n';
import { navigationRef } from '../navigation/navigationRef';
import { useAlarmStore, formatClock } from '../store/alarmStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { useRecentsStore } from '../store/recentsStore';
import { useSettingsStore } from '../store/settingsStore';
import type { RadioStation } from '../types/radio';

export const ALARM_TYPE = 'el-radyooon-alarm';
export const ALARM_CHANNEL = 'el-radyooon-alarm';
const ALARM_ID = 'el-radyooon-alarm';

let lastFireAt = 0;
let lastResponseId: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isAlarm = notification.request.content.data?.type === ALARM_TYPE;
    return {
      shouldPlaySound: isAlarm,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

function isAlarmNotification(data: unknown): boolean {
  return Boolean(data && typeof data === 'object' && 'type' in data && data.type === ALARM_TYPE);
}

function waitHydrated(): Promise<void> {
  const stores = [useAlarmStore, usePlayerStore, useFavoritesStore, useRecentsStore] as const;
  return Promise.all(
    stores.map(
      (store) =>
        new Promise<void>((resolve) => {
          if (store.persist.hasHydrated()) {
            resolve();
            return;
          }
          const finish = () => resolve();
          store.persist.onFinishHydration(finish);
          setTimeout(finish, 1500);
        }),
    ),
  ).then(() => undefined);
}

function resolveAlarmStation(): RadioStation | null {
  const { stationUuid } = useAlarmStore.getState();
  const current = usePlayerStore.getState().currentStation;
  const recents = useRecentsStore.getState().stations;
  const favorites = useFavoritesStore.getState().stations;
  if (stationUuid) {
    return (
      favorites.find((item) => item.stationuuid === stationUuid) ||
      recents.find((item) => item.stationuuid === stationUuid) ||
      (current?.stationuuid === stationUuid ? current : null) ||
      current ||
      recents[0] ||
      favorites[0] ||
      null
    );
  }
  return current || recents[0] || favorites[0] || null;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
    name: t('alarm.title'),
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

export async function requestAlarmPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted
    ? current
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
  if (!status.granted) {
    return false;
  }
  await ensureAndroidChannel();
  return true;
}

export async function syncAlarmSchedule() {
  await Notifications.cancelScheduledNotificationAsync(ALARM_ID).catch(() => undefined);
  const { enabled, hour, minute, stationUuid } = useAlarmStore.getState();
  if (!enabled) {
    return;
  }
  const station = resolveAlarmStation();
  const time = formatClock(hour, minute);
  const body = station
    ? t('alarm.notificationBody', { name: station.name, time })
    : t('alarm.notificationBodyGeneric', { time });
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: ALARM_ID,
    content: {
      title: t('alarm.notificationTitle'),
      body,
      sound: true,
      data: { type: ALARM_TYPE, stationUuid },
      ...(Platform.OS === 'android'
        ? { channelId: ALARM_CHANNEL, priority: Notifications.AndroidNotificationPriority.MAX }
        : {}),
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: ALARM_CHANNEL } : {}),
    },
  });
}

export async function fireAlarm() {
  const now = Date.now();
  if (now - lastFireAt < 30_000) {
    return;
  }
  lastFireAt = now;
  await waitHydrated();
  if (!useAlarmStore.getState().enabled) {
    return;
  }
  const station = resolveAlarmStation();
  if (!station) {
    return;
  }
  const player = usePlayerStore.getState();
  const queue = player.queue.some((item) => item.stationuuid === station.stationuuid)
    ? player.queue
    : [station, ...player.queue];
  const targetVolume = player.volume > 0.08 ? player.volume : 0.72;
  if (player.currentStation?.stationuuid === station.stationuuid && player.isPlaying) {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Player');
    }
    return;
  }
  await player.setVolume(0);
  await usePlayerStore.getState().playStation(station, queue);
  await usePlayerStore.getState().fadeToVolume(targetVolume);
  if (navigationRef.isReady()) {
    navigationRef.navigate('Player');
  }
}

export function startAlarmService(): () => void {
  void waitHydrated().then(() => {
    void syncAlarmSchedule();
  });

  const received = Notifications.addNotificationReceivedListener((notification) => {
    if (isAlarmNotification(notification.request.content.data)) {
      void fireAlarm();
    }
  });

  const response = Notifications.addNotificationResponseReceivedListener((event) => {
    if (event.notification.request.identifier === lastResponseId) {
      return;
    }
    lastResponseId = event.notification.request.identifier;
    if (isAlarmNotification(event.notification.request.content.data)) {
      void fireAlarm();
    }
  });

  void Notifications.getLastNotificationResponseAsync().then((event) => {
    if (!event || event.notification.request.identifier === lastResponseId) {
      return;
    }
    const stamp = event.notification.date;
    const occurredAt = stamp < 1e12 ? stamp * 1000 : stamp;
    if (Date.now() - occurredAt > 3 * 60 * 1000) {
      return;
    }
    if (isAlarmNotification(event.notification.request.content.data)) {
      lastResponseId = event.notification.request.identifier;
      void fireAlarm();
    }
  });

  const unsubAlarm = useAlarmStore.subscribe((state, prev) => {
    if (
      state.enabled === prev.enabled &&
      state.hour === prev.hour &&
      state.minute === prev.minute &&
      state.stationUuid === prev.stationUuid
    ) {
      return;
    }
    void syncAlarmSchedule();
  });

  const unsubLocale = useSettingsStore.subscribe((state, prev) => {
    if (state.locale === prev.locale) {
      return;
    }
    void syncAlarmSchedule();
  });

  return () => {
    received.remove();
    response.remove();
    unsubAlarm();
    unsubLocale();
  };
}

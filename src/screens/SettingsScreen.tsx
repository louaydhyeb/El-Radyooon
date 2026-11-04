import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterSheet } from '../components/FilterSheet';
import { Icon } from '../components/Icon';
import { LimeToggle } from '../components/LimeToggle';
import { PressableScale } from '../components/PressableScale';
import { useT } from '../i18n';
import type { AppLocale } from '../i18n/translations';
import { requestAlarmPermission } from '../services/alarm';
import { formatClock, nextAlarmDate, useAlarmStore } from '../store/alarmStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { useRecentsStore } from '../store/recentsStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, fonts, radii } from '../theme/tokens';

const LANGUAGES: { id: AppLocale; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  id: String(hour),
  label: String(hour).padStart(2, '0'),
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => ({
  id: String(minute),
  label: String(minute).padStart(2, '0'),
}));

export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useT();
  const hideBroken = useSettingsStore((s) => s.hideBroken);
  const setHideBroken = useSettingsStore((s) => s.setHideBroken);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const clearRecents = useRecentsStore((s) => s.clearRecents);
  const alarmEnabled = useAlarmStore((s) => s.enabled);
  const alarmHour = useAlarmStore((s) => s.hour);
  const alarmMinute = useAlarmStore((s) => s.minute);
  const alarmStationUuid = useAlarmStore((s) => s.stationUuid);
  const setAlarmEnabled = useAlarmStore((s) => s.setEnabled);
  const setAlarmTime = useAlarmStore((s) => s.setTime);
  const setAlarmStationUuid = useAlarmStore((s) => s.setStationUuid);
  const favorites = useFavoritesStore((s) => s.stations);
  const recents = useRecentsStore((s) => s.stations);
  const currentStation = usePlayerStore((s) => s.currentStation);
  const [hourOpen, setHourOpen] = useState(false);
  const [minuteOpen, setMinuteOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);

  const stationOptions = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ id: 'last', label: t('alarm.lastStation') }];
    const pool = [...favorites, ...recents, ...(currentStation ? [currentStation] : [])];
    for (const station of pool) {
      if (seen.has(station.stationuuid)) {
        continue;
      }
      seen.add(station.stationuuid);
      options.push({ id: station.stationuuid, label: station.name });
    }
    return options;
  }, [currentStation, favorites, recents, t]);

  const selectedStationLabel =
    stationOptions.find((item) => item.id === (alarmStationUuid ?? 'last'))?.label ??
    t('alarm.lastStation');

  const nextAlarm = nextAlarmDate(alarmHour, alarmMinute);
  const isToday = nextAlarm.getDate() === new Date().getDate();
  const nextLabel = t(isToday ? 'alarm.todayAt' : 'alarm.tomorrowAt', {
    time: formatClock(alarmHour, alarmMinute),
  });

  const toggleAlarm = async (value: boolean) => {
    if (value) {
      const allowed = await requestAlarmPermission();
      if (!allowed) {
        Alert.alert(t('alarm.permissionTitle'), t('alarm.permissionBody'), [
          { text: t('settings.cancel'), style: 'cancel' },
          { text: t('alarm.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
    }
    setAlarmEnabled(value);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={20} color={colors.onSurface} />
        </PressableScale>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <View style={styles.langRow}>
            {LANGUAGES.map((item) => {
              const active = item.id === locale;
              return (
                <PressableScale
                  key={item.id}
                  onPress={() => setLocale(item.id)}
                  style={[styles.langChip, active ? styles.langChipActive : styles.langChipIdle]}
                >
                  <Text
                    style={[styles.langText, active ? styles.langTextActive : styles.langTextIdle]}
                  >
                    {item.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <Text style={styles.hint}>{t('settings.languageHint')}</Text>
        </View>

        <Text style={styles.kicker}>{t('alarm.title')}</Text>
        <View style={styles.card}>
          <LimeToggle
            value={alarmEnabled}
            onValueChange={(value) => void toggleAlarm(value)}
            label={t('alarm.enable')}
          />
          <Text style={styles.hint}>{t('alarm.enableHint')}</Text>
          <View style={styles.timeRow}>
            <PressableScale onPress={() => setHourOpen(true)} style={styles.timeBox}>
              <Text style={styles.timeText}>{formatClock(alarmHour, alarmMinute).slice(0, 2)}</Text>
            </PressableScale>
            <Text style={styles.timeColon}>:</Text>
            <PressableScale onPress={() => setMinuteOpen(true)} style={styles.timeBox}>
              <Text style={styles.timeText}>{formatClock(alarmHour, alarmMinute).slice(3)}</Text>
            </PressableScale>
          </View>
          {alarmEnabled ? <Text style={styles.nextLabel}>{nextLabel}</Text> : null}
          <PressableScale style={styles.stationRow} onPress={() => setStationOpen(true)}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle}>{t('alarm.station')}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {selectedStationLabel}
              </Text>
            </View>
            <Icon name="expand-more" size={20} color={colors.onSurfaceVariant} />
          </PressableScale>
        </View>

        <Text style={styles.kicker}>{t('settings.playback')}</Text>
        <View style={styles.card}>
          <LimeToggle
            value={hideBroken}
            onValueChange={setHideBroken}
            label={t('settings.hideBroken')}
          />
          <Text style={styles.hint}>{t('settings.hideBrokenHint')}</Text>
        </View>

        <Text style={styles.kicker}>{t('settings.data')}</Text>
        <PressableScale
          style={styles.row}
          onPress={() =>
            Alert.alert(t('settings.clearHistoryAlertTitle'), t('settings.clearHistoryAlertBody'), [
              { text: t('settings.cancel'), style: 'cancel' },
              { text: t('settings.clear'), style: 'destructive', onPress: clearRecents },
            ])
          }
        >
          <View>
            <Text style={styles.rowTitle}>{t('settings.clearHistory')}</Text>
            <Text style={styles.rowSub}>{t('settings.clearHistorySub')}</Text>
          </View>
          <Icon name="delete-outline" size={20} color={colors.onSurfaceVariant} />
        </PressableScale>

        <Text style={styles.kicker}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <Text style={styles.rowTitle}>{t('settings.version')}</Text>
          <Text style={styles.rowSub}>{t('settings.aboutBody')}</Text>
        </View>
        <PressableScale
          style={styles.row}
          onPress={() => void Linking.openURL('https://api.radio-browser.info/')}
        >
          <View>
            <Text style={styles.rowTitle}>Radio Browser API</Text>
            <Text style={styles.rowSub}>api.radio-browser.info</Text>
          </View>
          <Icon name="open-in-new" size={18} color={colors.primaryFixed} />
        </PressableScale>
      </ScrollView>

      <FilterSheet
        visible={hourOpen}
        title={t('alarm.hour')}
        options={HOUR_OPTIONS}
        selectedId={String(alarmHour)}
        onSelect={(id) => setAlarmTime(Number(id), alarmMinute)}
        onClose={() => setHourOpen(false)}
      />
      <FilterSheet
        visible={minuteOpen}
        title={t('alarm.minute')}
        options={MINUTE_OPTIONS}
        selectedId={String(alarmMinute)}
        onSelect={(id) => setAlarmTime(alarmHour, Number(id))}
        onClose={() => setMinuteOpen(false)}
      />
      <FilterSheet
        visible={stationOpen}
        title={t('alarm.station')}
        options={stationOptions}
        selectedId={alarmStationUuid ?? 'last'}
        onSelect={(id) => setAlarmStationUuid(id === 'last' ? null : id)}
        onClose={() => setStationOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.white05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'left',
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 48,
  },
  kicker: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primaryFixed,
    marginTop: 8,
    textAlign: 'left',
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  hint: {
    fontFamily: fonts.hanken.regular,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'left',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    minWidth: '30%',
    flexGrow: 1,
    height: 40,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  langChipActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primaryFixed,
  },
  langChipIdle: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.cardBorder,
  },
  langText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 14,
  },
  langTextActive: {
    color: colors.onPrimaryFixed,
  },
  langTextIdle: {
    color: colors.onSurfaceVariant,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  timeBox: {
    minWidth: 72,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.limeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    color: colors.primaryFixed,
  },
  timeColon: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    color: colors.primaryFixed,
  },
  nextLabel: {
    fontFamily: fonts.hanken.medium,
    fontSize: 12,
    color: colors.primaryFixed,
    textAlign: 'center',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.white05,
  },
  row: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'left',
  },
  rowSub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'left',
  },
});

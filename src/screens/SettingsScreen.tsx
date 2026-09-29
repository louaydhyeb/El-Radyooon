import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { LimeToggle } from '../components/LimeToggle';
import { PressableScale } from '../components/PressableScale';
import { useT } from '../i18n';
import type { AppLocale } from '../i18n/translations';
import { useRecentsStore } from '../store/recentsStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, fonts, radii } from '../theme/tokens';

const LANGUAGES: { id: AppLocale; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useT();
  const hideBroken = useSettingsStore((s) => s.hideBroken);
  const setHideBroken = useSettingsStore((s) => s.setHideBroken);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const clearRecents = useRecentsStore((s) => s.clearRecents);

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

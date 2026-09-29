import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, shadows } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

const TABS: {
  key: string;
  labelKey: 'nav.home' | 'nav.explore' | 'nav.favorites';
  icon: IconName;
  iconActive: IconName;
}[] = [
  { key: 'Accueil', labelKey: 'nav.home', icon: 'radio', iconActive: 'radio' },
  {
    key: 'Explorer',
    labelKey: 'nav.explore',
    icon: 'travel-explore',
    iconActive: 'travel-explore',
  },
  { key: 'Favoris', labelKey: 'nav.favorites', icon: 'favorite-border', iconActive: 'favorite' },
];

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useT();

  return (
    <View style={[styles.wrap, shadows.nav]}>
      <BlurView
        intensity={50}
        tint="dark"
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {TABS.map((tab, index) => {
          const focused = state.index === index;
          return (
            <PressableScale
              key={tab.key}
              accessibilityLabel={t(tab.labelKey)}
              onPress={() => navigation.navigate(tab.key)}
              style={styles.item}
            >
              <Icon
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? colors.primaryFixed : 'rgba(196,201,175,0.7)'}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{t(tab.labelKey)}</Text>
              {focused ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
            </PressableScale>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(31,31,35,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(68,73,53,0.2)',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(196,201,175,0.7)',
    marginTop: 2,
  },
  labelActive: {
    color: colors.primaryFixed,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryFixed,
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
});

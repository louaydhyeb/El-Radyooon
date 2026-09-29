import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

type Props = {
  onSettings?: () => void;
  right?: ReactNode;
};

export function AppHeader({ onSettings, right }: Props) {
  const t = useT();
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Icon name="graphic-eq" size={24} color={colors.primaryFixed} />
        <Text style={styles.logo}>El Radyooon</Text>
      </View>
      {right ?? (
        <PressableScale
          accessibilityLabel={t('a11y.settings')}
          onPress={onSettings}
          style={styles.iconBtn}
        >
          <Icon name="settings" size={20} color={colors.onSurfaceVariant} />
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.onSurface,
    textAlign: 'left',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.white05,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

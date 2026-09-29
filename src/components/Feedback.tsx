import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

type EmptyProps = {
  icon?: IconName;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon = 'radio', title, subtitle }: EmptyProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={28} color={colors.primaryFixed} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const t = useT();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primaryFixed} />
      <Text style={[styles.subtitle, { marginTop: 12 }]}>{label ?? t('common.loading')}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Icon name="wifi-off" size={28} color={colors.error} />
      </View>
      <Text style={styles.title}>{t('common.connectionLost')}</Text>
      <Text style={styles.subtitle}>{message}</Text>
      {onRetry ? (
        <PressableScale onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryLabel}>{t('common.retry')}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.85,
  },
  retry: {
    marginTop: 10,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontFamily: fonts.hanken.bold,
    fontSize: 12,
    color: colors.onPrimaryFixed,
  },
});

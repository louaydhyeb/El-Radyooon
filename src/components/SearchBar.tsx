import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { layoutDirection, useT } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';

type Props = {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  onMic?: () => void;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  placeholder,
  onChangeText,
  onSubmit,
  onClear,
  onMic,
  autoFocus,
}: Props) {
  const t = useT();
  const locale = useSettingsStore((s) => s.locale);
  return (
    <View style={styles.bar}>
      <Icon name="search" size={20} color={colors.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(196,201,175,0.55)"
        style={[styles.input, { writingDirection: layoutDirection(locale), textAlign: 'left' }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
      />
      {value.length > 0 && onClear ? (
        <PressableScale
          onPress={onClear}
          style={styles.clear}
          accessibilityLabel={t('a11y.clearSearch')}
        >
          <Icon name="close" size={14} color={colors.white70} />
        </PressableScale>
      ) : onMic ? (
        <PressableScale onPress={onMic} accessibilityLabel={t('a11y.mic')}>
          <Icon name="mic" size={18} color={colors.white60} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 48,
    borderRadius: 99,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.hanken.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

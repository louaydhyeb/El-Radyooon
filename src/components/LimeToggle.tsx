import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function LimeToggle({ value, onValueChange, label, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryFixed }}
        thumbColor={value ? colors.surfaceContainerLowest : colors.white}
        ios_backgroundColor={colors.surfaceContainerHigh}
      />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: fonts.hanken.medium,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.white70,
    textAlign: 'left',
    flex: 1,
    minWidth: 0,
  },
});

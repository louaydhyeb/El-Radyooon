import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
};

export function LimeToggle({ value, onValueChange, label }: Props) {
  return (
    <View style={styles.row}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryFixed }}
        thumbColor={value ? colors.surfaceContainerLowest : colors.white}
        ios_backgroundColor={colors.surfaceContainerHigh}
      />
      <Text style={styles.label}>{label}</Text>
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
  },
});

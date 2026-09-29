import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  bars?: number;
  height?: number;
  playing?: boolean;
  style?: ViewStyle;
};

export function Equalizer({ bars = 3, height = 16, playing = true, style }: Props) {
  const values = useMemo(() => Array.from({ length: bars }, () => new Animated.Value(0.3)), [bars]);

  useEffect(() => {
    if (!playing) {
      values.forEach((value) => value.stopAnimation());
      values.forEach((value) => value.setValue(0.25));
      return;
    }

    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 0.2 + ((index * 17) % 80) / 100,
            duration: 280 + index * 90,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.85 - (index % 3) * 0.15,
            duration: 260 + index * 70,
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [playing, values]);

  return (
    <View style={[styles.row, { height }, style]}>
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: value.interpolate({
                inputRange: [0, 1],
                outputRange: [3, height],
              }),
              opacity: 0.55 + (index % 3) * 0.15,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: colors.primaryFixed,
    borderRadius: 99,
  },
});

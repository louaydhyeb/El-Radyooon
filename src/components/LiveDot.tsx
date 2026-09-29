import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  size?: number;
};

export function LiveDot({ size = 8 }: Props) {
  const pulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          styles.ping,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: pulse,
            transform: [
              { scale: pulse.interpolate({ inputRange: [0.35, 1], outputRange: [1.35, 1] }) },
            ],
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size,
            left: size * 0.15,
            top: size * 0.15,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ping: {
    position: 'absolute',
    backgroundColor: colors.primaryFixed,
  },
  core: {
    position: 'absolute',
    backgroundColor: colors.primaryFixed,
  },
});

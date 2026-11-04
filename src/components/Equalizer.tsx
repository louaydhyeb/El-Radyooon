import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { audioService } from '../services/audioService';
import { colors } from '../theme/tokens';
import {
  LIVE_ENERGY,
  barOpacity,
  idleEqualizerBars,
  shapeEqualizerBars,
  takeBars,
} from '../utils/spectrum';

type Variant = 'mini' | 'player';

type Props = {
  bars?: number;
  height?: number;
  playing?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

function lerpTo(value: Animated.Value, toValue: number, duration = 70) {
  value.stopAnimation();
  Animated.timing(value, {
    toValue,
    duration,
    useNativeDriver: false,
  }).start();
}

export function Equalizer({
  bars = 3,
  height = 16,
  playing = true,
  variant = 'mini',
  style,
}: Props) {
  const values = useMemo(() => Array.from({ length: bars }, () => new Animated.Value(0.3)), [bars]);
  const isPlayer = variant === 'player';
  const minBar = isPlayer ? 5 : 3;
  const barWidth = isPlayer ? 4 : 2.5;
  const gap = isPlayer ? 3 : 2;

  useEffect(() => {
    const rest = idleEqualizerBars(bars);

    if (!playing) {
      values.forEach((value, index) => lerpTo(value, rest[index] ?? 0.2, 180));
      return;
    }

    let fakes: Animated.CompositeAnimation[] = [];
    let stale: ReturnType<typeof setTimeout> | undefined;

    const startFake = () => {
      if (fakes.length) {
        return;
      }
      fakes = values.map((value, index) => {
        const peak = Math.min(1, (rest[index] ?? 0.3) + 0.28);
        const trough = Math.max(0.12, (rest[index] ?? 0.3) - 0.16);
        return Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: trough,
              duration: 280 + index * 90,
              useNativeDriver: false,
            }),
            Animated.timing(value, {
              toValue: peak,
              duration: 260 + index * 70,
              useNativeDriver: false,
            }),
          ]),
        );
      });
      fakes.forEach((animation) => animation.start());
    };

    const stopFake = () => {
      fakes.forEach((animation) => animation.stop());
      fakes = [];
    };

    startFake();

    const unsubscribe = audioService.subscribeSpectrum((frame) => {
      if (!frame || frame.energy < LIVE_ENERGY) {
        return;
      }
      stopFake();
      const levels = shapeEqualizerBars(takeBars(frame.bars, bars));
      levels.forEach((level, index) => {
        const value = values[index];
        if (value) {
          lerpTo(value, level);
        }
      });
      if (stale) {
        clearTimeout(stale);
      }
      stale = setTimeout(startFake, 400);
    });

    return () => {
      unsubscribe();
      stopFake();
      if (stale) {
        clearTimeout(stale);
      }
    };
  }, [playing, values, bars]);

  return (
    <View style={[styles.row, { height, gap }, style]}>
      {values.map((value, index) => (
        <View key={index} style={[styles.slot, { width: isPlayer ? 10 : barWidth }]}>
          {isPlayer ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  height: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [minBar, height],
                  }),
                  opacity: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.06, 0.4],
                  }),
                },
              ]}
            />
          ) : null}
          <Animated.View
            style={[
              styles.bar,
              {
                width: barWidth,
                height: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [minBar, height],
                }),
                opacity: playing ? barOpacity(index, bars) : barOpacity(index, bars) * 0.55,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  glow: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    borderRadius: 99,
    backgroundColor: colors.limeGlow,
  },
  bar: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 99,
  },
});

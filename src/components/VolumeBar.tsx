import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function VolumeBar({ value, onChange }: Props) {
  const [width, setWidth] = useState(1);

  const update = (x: number) => {
    onChange(Math.min(1, Math.max(0, x / width)));
  };

  return (
    <View
      style={styles.track}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => update(event.nativeEvent.locationX)}
      onResponderMove={(event) => update(event.nativeEvent.locationX)}
    >
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primaryFixed,
    borderRadius: 99,
  },
});

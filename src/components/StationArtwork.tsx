import { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import type { RadioStation } from '../types/radio';
import { crestColors, stationInitials } from '../utils/station';
import { Icon } from './Icon';

type Props = {
  station: RadioStation;
  size?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
  fallbackIcon?: boolean;
};

export function StationArtwork({
  station,
  size = 52,
  rounded,
  style,
  fallbackIcon = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const radius = rounded ?? size / 2;
  const crest = crestColors(station.stationuuid || station.name);
  const showImage = Boolean(station.favicon) && !failed;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: fallbackIcon ? colors.surfaceContainerHigh : crest.bg,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: station.favicon }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setFailed(true)}
        />
      ) : fallbackIcon ? (
        <Icon name="radio" size={Math.round(size * 0.42)} color={colors.primaryFixed} />
      ) : (
        <Text
          style={[styles.initials, { color: crest.fg, fontSize: size > 48 ? 13 : 11 }]}
          numberOfLines={1}
        >
          {stationInitials(station.name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white10,
  },
  initials: {
    fontFamily: fonts.outfit.bold,
    letterSpacing: -0.4,
  },
});

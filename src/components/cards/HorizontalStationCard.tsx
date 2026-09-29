import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../../theme/tokens';
import type { RadioStation } from '../../types/radio';
import { formatBitrate, stationLocation } from '../../utils/station';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { StationArtwork } from '../StationArtwork';

type Props = {
  station: RadioStation;
  isPlaying?: boolean;
  onPlay: () => void;
  onOpen: () => void;
};

export function HorizontalStationCard({ station, isPlaying, onPlay, onOpen }: Props) {
  const tag = station.tags[0] || station.countrycode;

  return (
    <PressableScale onPress={onOpen} scale={0.98} style={styles.card}>
      <View style={styles.left}>
        <StationArtwork station={station} size={44} rounded={16} fallbackIcon />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {station.name}
            </Text>
            {tag ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sub} numberOfLines={1}>
            {stationLocation(station)} • {formatBitrate(station.bitrate)}
          </Text>
        </View>
      </View>
      <PressableScale
        onPress={onPlay}
        accessibilityLabel="Jouer"
        style={[styles.play, isPlaying && styles.playActive]}
      >
        <Icon
          name={isPlaying ? 'pause' : 'play-arrow'}
          size={18}
          color={isPlaying ? colors.onPrimaryFixed : colors.onSurface}
        />
      </PressableScale>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xxl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: colors.onSurface,
    flexShrink: 1,
    textAlign: 'left',
  },
  tag: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'left',
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playActive: {
    backgroundColor: colors.primaryFixed,
  },
});

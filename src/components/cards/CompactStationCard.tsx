import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../../theme/tokens';
import type { RadioStation } from '../../types/radio';
import { formatBitrate } from '../../utils/station';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { StationArtwork } from '../StationArtwork';

type Props = {
  station: RadioStation;
  isFavorite: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onFavorite: () => void;
  onOpen: () => void;
};

export function CompactStationCard({
  station,
  isFavorite,
  isPlaying,
  onPlay,
  onFavorite,
  onOpen,
}: Props) {
  return (
    <PressableScale onPress={onOpen} scale={0.98} style={styles.card}>
      <View>
        <View style={styles.top}>
          <StationArtwork station={station} size={36} />
          <PressableScale onPress={onFavorite} hitSlop={8}>
            <Icon
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={18}
              color={isFavorite ? colors.primaryFixed : colors.white60}
            />
          </PressableScale>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {station.state || station.country || 'Live'} • {station.countrycode || 'FM'}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.rate}>{formatBitrate(station.bitrate)}</Text>
        <PressableScale onPress={onPlay} style={[styles.play, isPlaying && styles.playActive]}>
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={16}
            color={isPlaying ? colors.onPrimaryFixed : colors.onSurface}
          />
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xxl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-between',
    minHeight: 148,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: colors.onSurface,
    marginTop: 10,
    textAlign: 'left',
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'left',
  },
  bottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.white05,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rate: {
    fontFamily: fonts.hanken.medium,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  play: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playActive: {
    backgroundColor: colors.primaryFixed,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../../theme/tokens';
import type { RadioStation } from '../../types/radio';
import { countryFlag, formatBitrateCodec, stationLocation } from '../../utils/station';
import { Equalizer } from '../Equalizer';
import { Icon } from '../Icon';
import { LiveDot } from '../LiveDot';
import { PressableScale } from '../PressableScale';
import { StationArtwork } from '../StationArtwork';

type Props = {
  station: RadioStation;
  isPlaying: boolean;
  onOpen: () => void;
  onRemove: () => void;
};

export function FavoriteStationCard({ station, isPlaying, onOpen, onRemove }: Props) {
  return (
    <PressableScale onPress={onOpen} scale={0.98} style={[styles.card, isPlaying && styles.active]}>
      {isPlaying ? <View style={styles.glow} /> : null}
      <View style={styles.row}>
        <View style={styles.left}>
          <View>
            <StationArtwork station={station} size={48} rounded={14} />
            {isPlaying ? (
              <View style={styles.liveBadge}>
                <LiveDot size={10} />
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {station.name}
              </Text>
              {isPlaying ? <Equalizer playing height={12} bars={4} /> : null}
            </View>
            <Text style={[styles.line, isPlaying && styles.playingLine]} numberOfLines={1}>
              {isPlaying ? 'Écoute en cours' : station.tags[0] || 'Station favorite'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {stationLocation(station)} {countryFlag(station.countrycode)} •{' '}
              {formatBitrateCodec(station)}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={onRemove}
          accessibilityLabel="Retirer des favoris"
          style={styles.heart}
        >
          <Icon name="favorite" size={22} color={colors.primaryFixed} />
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  active: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.limeBorder,
  },
  glow: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(198,243,64,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  liveBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 14,
    color: colors.onSurface,
    flexShrink: 1,
    textAlign: 'left',
  },
  line: {
    fontFamily: fonts.hanken.regular,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'left',
  },
  playingLine: {
    color: colors.primaryFixed,
    fontFamily: fonts.hanken.medium,
  },
  meta: {
    fontFamily: fonts.hanken.medium,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  heart: {
    padding: 10,
  },
});

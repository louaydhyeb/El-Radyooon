import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, shadows } from '../../theme/tokens';
import type { RadioStation } from '../../types/radio';
import { countryFlag, formatBitrate, formatCodec, stationSubtitle } from '../../utils/station';
import { Icon } from '../Icon';
import { LiveDot } from '../LiveDot';
import { PressableScale } from '../PressableScale';
import { StationArtwork } from '../StationArtwork';
import { useT } from '../../i18n';

type Props = {
  station: RadioStation;
  isFavorite: boolean;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onFavorite: () => void;
  onOpen: () => void;
};

export function ExploreStationCard({
  station,
  isFavorite,
  isActive,
  isPlaying,
  onPlay,
  onFavorite,
  onOpen,
}: Props) {
  const t = useT();
  return (
    <PressableScale onPress={onOpen} scale={0.98} style={[styles.card, isActive && styles.active]}>
      <View style={styles.left}>
        <View style={[styles.artWrap, isActive && styles.artActive]}>
          <StationArtwork station={station} size={48} />
          {isActive ? (
            <View style={styles.eqBadge}>
              <Icon name="graphic-eq" size={12} color={colors.primaryFixed} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {station.name}
            </Text>
            <Text style={styles.flag}>{countryFlag(station.countrycode)}</Text>
            {isActive ? (
              <View style={styles.direct}>
                <LiveDot size={6} />
                <Text style={styles.directText}>{t('player.liveShort')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sub} numberOfLines={1}>
            {stationSubtitle(station)}
          </Text>
          <View style={styles.meta}>
            <View style={[styles.rate, isActive && styles.rateActive]}>
              <Text style={[styles.rateText, isActive && styles.rateTextActive]}>
                {formatBitrate(station.bitrate)}
              </Text>
            </View>
            <Text style={styles.codec}>{formatCodec(station.codec)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <PressableScale
          onPress={onFavorite}
          accessibilityLabel={t('a11y.favorite')}
          style={styles.heart}
        >
          <Icon
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={22}
            color={isFavorite ? colors.primaryFixed : colors.white40}
          />
        </PressableScale>
        <PressableScale
          onPress={onPlay}
          accessibilityLabel={t('a11y.play')}
          style={[styles.play, isActive && styles.playActive]}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={20}
            color={isActive ? colors.surfaceContainerLowest : colors.white}
          />
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  active: {
    borderColor: colors.limeBorderStrong,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  artWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.white10,
  },
  artActive: {
    borderColor: colors.limeBorder,
  },
  eqBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: colors.white,
    flexShrink: 1,
    textAlign: 'left',
  },
  flag: {
    fontSize: 12,
  },
  direct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: 'rgba(198,243,64,0.15)',
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  directText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 9,
    color: colors.primaryFixed,
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 11,
    color: colors.white50,
    marginTop: 2,
    textAlign: 'left',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rate: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateActive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  rateText: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.white70,
  },
  rateTextActive: {
    color: colors.primaryFixed,
  },
  codec: {
    fontFamily: fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.white40,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primaryFixed,
    ...shadows.limePlay,
  },
});

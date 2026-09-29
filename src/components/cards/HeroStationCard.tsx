import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, shadows } from '../../theme/tokens';
import type { RadioStation } from '../../types/radio';
import { formatBitrateCodec, stationLocation } from '../../utils/station';
import { useT } from '../../i18n';
import { Equalizer } from '../Equalizer';
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

export function HeroStationCard({
  station,
  isFavorite,
  isPlaying,
  onPlay,
  onFavorite,
  onOpen,
}: Props) {
  const t = useT();
  return (
    <PressableScale onPress={onOpen} scale={0.98} style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.top}>
        <View style={styles.meta}>
          <View style={styles.vinyl}>
            <StationArtwork station={station} size={52} fallbackIcon />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {station.name}
              </Text>
              <View style={styles.livePill}>
                <Text style={styles.liveText}>{t('common.liveOnAir')}</Text>
              </View>
            </View>
            <Text style={styles.sub} numberOfLines={1}>
              {stationLocation(station)}
              {station.tags[0] ? ` • ${station.tags[0]}` : ''}
            </Text>
          </View>
        </View>
        <PressableScale onPress={onFavorite} accessibilityLabel={t('a11y.favorite')} hitSlop={8}>
          <Icon
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={20}
            color={isFavorite ? colors.primaryFixed : colors.onSurfaceVariant}
          />
        </PressableScale>
      </View>
      <View style={styles.bottom}>
        <View style={styles.eqRow}>
          <View style={styles.eqBox}>
            <Equalizer playing={isPlaying} height={16} bars={3} />
          </View>
          <Text style={styles.quality}>{formatBitrateCodec(station)}</Text>
        </View>
        <PressableScale
          onPress={onPlay}
          style={styles.listen}
          accessibilityLabel={t('a11y.listen')}
        >
          <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={16} color={colors.onPrimaryFixed} />
          <Text style={styles.listenLabel}>
            {isPlaying ? t('player.pause') : t('player.listen')}
          </Text>
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xxl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: colors.limeSoft,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  vinyl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.white10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: colors.onSurface,
    flexShrink: 1,
    textAlign: 'left',
  },
  livePill: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontFamily: fonts.hanken.extrabold,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.onPrimaryFixed,
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'left',
  },
  bottom: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.white06,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eqBox: {
    height: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.limeSoft,
    justifyContent: 'flex-end',
  },
  quality: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.primaryFixed,
  },
  listen: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 99,
    backgroundColor: colors.primaryFixed,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...shadows.limePlay,
  },
  listenLabel: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.onPrimaryFixed,
  },
});

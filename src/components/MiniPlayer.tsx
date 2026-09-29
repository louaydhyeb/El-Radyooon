import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, shadows } from '../theme/tokens';
import { formatBitrateCodec } from '../utils/station';
import { useT } from '../i18n';
import { Icon } from './Icon';
import { LiveDot } from './LiveDot';
import { PressableScale } from './PressableScale';
import { StationArtwork } from './StationArtwork';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';

type Props = {
  onExpand: () => void;
};

export function MiniPlayer({ onExpand }: Props) {
  const insets = useSafeAreaInsets();
  const station = usePlayerStore((s) => s.currentStation);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const isFavorite = useFavoritesStore((s) =>
    station ? s.isFavorite(station.stationuuid) : false,
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const t = useT();

  if (!station) {
    return null;
  }

  return (
    <View style={[styles.wrap, { bottom: 58 + Math.max(insets.bottom, 10) }]}>
      <PressableScale onPress={onExpand} scale={0.99} style={styles.shadow}>
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.inner}>
            <View style={styles.left}>
              <View>
                <StationArtwork station={station} size={40} rounded={12} />
                <View style={styles.dot}>
                  <LiveDot size={8} />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {station.name}
                  </Text>
                  <Text style={styles.live}>• {t('player.liveShort')}</Text>
                </View>
                <Text style={styles.sub} numberOfLines={1}>
                  {isBuffering
                    ? t('mini.connecting')
                    : t('mini.live', { info: formatBitrateCodec(station) })}
                </Text>
              </View>
            </View>
            <View style={styles.controls}>
              <PressableScale
                onPress={() => toggleFavorite(station)}
                hitSlop={6}
                style={styles.iconBtn}
              >
                <Icon
                  name={isFavorite ? 'favorite' : 'favorite-border'}
                  size={18}
                  color={isFavorite ? colors.primaryFixed : colors.onSurfaceVariant}
                />
              </PressableScale>
              <PressableScale
                onPress={() => void playPrevious()}
                hitSlop={6}
                style={styles.iconBtn}
              >
                <Icon name="skip-previous" size={20} color={colors.white70} />
              </PressableScale>
              <PressableScale onPress={() => void togglePlay()} style={styles.pause}>
                <Icon
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={22}
                  color={colors.onPrimaryFixed}
                />
              </PressableScale>
              <PressableScale onPress={() => void playNext()} hitSlop={6} style={styles.iconBtn}>
                <Icon name="skip-next" size={20} color={colors.white70} />
              </PressableScale>
              <PressableScale onPress={onExpand} hitSlop={6} style={styles.iconBtn}>
                <Icon name="expand-less" size={18} color={colors.onSurfaceVariant} />
              </PressableScale>
            </View>
          </View>
        </BlurView>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 40,
  },
  shadow: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.miniPlayer,
  },
  blur: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorderStrong,
    backgroundColor: 'rgba(27,27,31,0.92)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: colors.onSurface,
    flexShrink: 1,
    textAlign: 'left',
  },
  live: {
    fontFamily: fonts.hanken.extrabold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.primaryFixed,
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 1,
    textAlign: 'left',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pause: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.limePlay,
  },
});

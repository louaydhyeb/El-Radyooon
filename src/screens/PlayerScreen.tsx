import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Share, StyleSheet, Text, View } from 'react-native';
import { VolumeBar } from '../components/VolumeBar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Equalizer } from '../components/Equalizer';
import { FilterSheet } from '../components/FilterSheet';
import { Icon } from '../components/Icon';
import { LiveDot } from '../components/LiveDot';
import { PressableScale } from '../components/PressableScale';
import { StationArtwork } from '../components/StationArtwork';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from '../services/audioService';
import { colors, fonts, shadows } from '../theme/tokens';
import { formatNowPlaying } from '../services/icy';
import { countryFlag, formatBitrate, formatCodec, stationLocation } from '../utils/station';
import { SLEEP_TIMER_OPTIONS } from '../utils/constants';
import { useT } from '../i18n';

export function PlayerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const station = usePlayerStore((s) => s.currentStation);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const volume = usePlayerStore((s) => s.volume);
  const error = usePlayerStore((s) => s.error);
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  const sleepTimerEndsAt = usePlayerStore((s) => s.sleepTimerEndsAt);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
  const isFavorite = useFavoritesStore((s) =>
    station ? s.isFavorite(station.stationuuid) : false,
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [sleepOpen, setSleepOpen] = useState(false);
  const glowPulse = useMemo(() => new Animated.Value(0), []);
  const liveGlow = useRef(false);
  const t = useT();

  useEffect(() => {
    if (!isPlaying) {
      liveGlow.current = false;
      glowPulse.stopAnimation();
      glowPulse.setValue(0);
      return;
    }

    let fake: Animated.CompositeAnimation | null = null;
    let stale: ReturnType<typeof setTimeout> | undefined;

    const startFake = () => {
      if (fake) {
        return;
      }
      fake = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowPulse, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
      );
      fake.start();
    };

    const unsubscribe = audioService.subscribeSpectrum((frame) => {
      if (!frame) {
        return;
      }
      if (!liveGlow.current) {
        liveGlow.current = true;
        fake?.stop();
        fake = null;
      }
      glowPulse.setValue(Math.min(1, frame.energy * 1.65));
      if (stale) {
        clearTimeout(stale);
      }
      stale = setTimeout(() => {
        liveGlow.current = false;
        startFake();
      }, 400);
    });

    startFake();

    return () => {
      unsubscribe();
      fake?.stop();
      if (stale) {
        clearTimeout(stale);
      }
    };
  }, [glowPulse, isPlaying]);

  if (!station) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.roundBtn}>
          <Icon name="keyboard-arrow-down" size={24} color={colors.onSurface} />
        </PressableScale>
        <View style={styles.empty}>
          <Text style={styles.name}>{t('player.emptyTitle')}</Text>
          <Text style={styles.sub}>{t('player.emptySubtitle')}</Text>
        </View>
      </View>
    );
  }

  const tags = station.tags.slice(0, 3);
  const shareStation = async () => {
    await Share.share({
      message: `${station.name}\n${station.homepage || station.urlResolved || station.url}`,
    });
  };

  const moreOptions = () => {
    Alert.alert(
      station.name,
      undefined,
      [
        station.homepage
          ? {
              text: t('player.openSite'),
              onPress: () => void Linking.openURL(station.homepage),
            }
          : undefined,
        {
          text: t('player.share'),
          onPress: () => void shareStation(),
        },
        { text: t('player.close'), style: 'cancel' },
      ].filter(Boolean) as { text: string; onPress?: () => void; style?: 'cancel' }[],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          accessibilityLabel={t('a11y.collapsePlayer')}
          onPress={() => navigation.goBack()}
          style={styles.roundBtn}
        >
          <Icon name="keyboard-arrow-down" size={24} color={colors.onSurface} />
        </PressableScale>
        <View style={styles.centerMeta}>
          <View style={styles.flagRow}>
            <Text style={styles.flag}>{countryFlag(station.countrycode)}</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {station.name}
            </Text>
          </View>
          <Text style={styles.freq} numberOfLines={1}>
            {station.state || t('player.nationalFreq')}
          </Text>
        </View>
        <View style={styles.topActions}>
          <PressableScale onPress={() => void shareStation()} style={styles.ghostBtn}>
            <Icon name="share" size={20} color={colors.onSurfaceVariant} />
          </PressableScale>
          <PressableScale onPress={moreOptions} style={styles.ghostBtn}>
            <Icon name="more-vert" size={20} color={colors.onSurfaceVariant} />
          </PressableScale>
        </View>
      </View>

      <View style={styles.heroBlock}>
        <View style={styles.artWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.artHalo,
              {
                opacity: glowPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.12, 0.22],
                }),
                transform: [
                  {
                    scale: glowPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.03],
                    }),
                  },
                ],
              },
            ]}
          />
          <View pointerEvents="none" style={styles.artGlow} />
          <View style={styles.artShadow}>
            <View style={styles.artFrame}>
              <StationArtwork station={station} size={232} rounded={24} fallbackIcon />
              <View style={styles.stamp}>
                <Icon name="graphic-eq" size={12} color={colors.primaryFixed} />
                <Text style={styles.stampText}>{station.name.slice(0, 6).toUpperCase()}</Text>
              </View>
              <View style={styles.quality}>
                <Text style={styles.qualityText}>
                  HQ {station.bitrate ? `${station.bitrate}K` : 'LIVE'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.livePill}>
          <LiveDot size={8} />
          <Text style={styles.liveText}>
            {isBuffering ? t('player.connecting') : t('player.live')}
          </Text>
        </View>
        <Text style={styles.tech} numberOfLines={1}>
          {formatCodec(station.codec)} • {formatBitrate(station.bitrate)} • STÉRÉO • ID{' '}
          {station.stationuuid.slice(0, 4)}
        </Text>
        <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
          {station.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {error
            ? error === 'unavailable'
              ? t('errors.unavailable')
              : error === 'playFailed'
                ? t('errors.playFailed')
                : error
            : (formatNowPlaying(nowPlaying) ??
              `${station.tags.slice(0, 2).join(' & ') || t('player.continuous')} • ${stationLocation(station)}`)}
        </Text>
        <View style={styles.tags}>
          {tags.map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {item}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.wave}>
          <Equalizer bars={12} height={28} playing={isPlaying} variant="player" />
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.cluster}>
          <PressableScale
            accessibilityLabel={t('a11y.addFavorite')}
            onPress={() => toggleFavorite(station)}
            style={styles.sideBtn}
          >
            <Icon
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite ? colors.primaryFixed : colors.onSurface}
            />
          </PressableScale>
          <PressableScale
            accessibilityLabel={isPlaying ? t('a11y.pause') : t('a11y.play')}
            onPress={() => void togglePlay()}
            style={styles.play}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={38}
              color={colors.onPrimaryFixed}
            />
          </PressableScale>
          <PressableScale
            accessibilityLabel={t('a11y.sleepTimer')}
            onPress={() => setSleepOpen(true)}
            style={styles.sideBtn}
          >
            <Icon
              name="bedtime"
              size={24}
              color={sleepTimerEndsAt ? colors.primaryFixed : colors.onSurface}
            />
          </PressableScale>
        </View>

        <View style={styles.volumeRow}>
          <Icon name="volume-mute" size={18} color={colors.onSurfaceVariant} />
          <VolumeBar value={volume} onChange={(value) => void setVolume(value)} />
          <Icon name="volume-up" size={18} color={colors.onSurfaceVariant} />
        </View>

        <View style={styles.castWrap}>
          <View style={styles.cast}>
            <Icon name="headset" size={16} color={colors.primaryFixed} />
            <Text style={styles.castText}>
              {sleepTimerEndsAt ? t('player.sleepActive') : t('player.output')}
            </Text>
            <Icon name="expand-less" size={14} color={colors.white60} />
          </View>
        </View>
      </View>

      <FilterSheet
        visible={sleepOpen}
        title={t('player.sleepTitle')}
        options={SLEEP_TIMER_OPTIONS.map((item) => ({
          id: String(item.minutes),
          label:
            item.minutes === 0
              ? t('player.sleepOff')
              : t('player.sleepMinutes', { count: item.minutes }),
        }))}
        selectedId={sleepTimerEndsAt ? undefined : '0'}
        onSelect={(id) => setSleepTimer(Number(id))}
        onClose={() => setSleepOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.white05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMeta: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  flag: {
    fontSize: 12,
  },
  headerName: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 14,
    color: colors.onSurface,
    flexShrink: 1,
  },
  freq: {
    fontFamily: fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(196,201,175,0.7)',
    marginTop: 2,
    maxWidth: '100%',
  },
  topActions: {
    flexDirection: 'row',
  },
  ghostBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  artWrap: {
    width: 232,
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  artHalo: {
    position: 'absolute',
    width: 248,
    height: 248,
    borderRadius: 28,
    backgroundColor: colors.primaryFixed,
  },
  artGlow: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    ...shadows.jacketGlow,
  },
  artShadow: {
    width: 232,
    height: 232,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow,
    ...shadows.jacket,
  },
  artFrame: {
    width: 232,
    height: 232,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.white10,
    backgroundColor: colors.surfaceContainerLow,
  },
  stamp: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(14,14,18,0.8)',
    borderWidth: 1,
    borderColor: colors.white10,
  },
  stampText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 9,
    color: colors.onSurface,
    letterSpacing: 0.6,
  },
  quality: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(14,14,18,0.9)',
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  qualityText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.primaryFixed,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
    marginBottom: 8,
  },
  liveText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.primaryFixed,
  },
  tech: {
    fontFamily: fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(196,201,175,0.8)',
    marginBottom: 10,
    textTransform: 'uppercase',
    maxWidth: '100%',
    paddingHorizontal: 8,
  },
  name: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    lineHeight: 32,
    color: colors.tertiary,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
  },
  sub: {
    fontFamily: fonts.hanken.regular,
    fontSize: 14,
    color: 'rgba(196,201,175,0.9)',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    width: '100%',
  },
  tag: {
    maxWidth: '32%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.white05,
  },
  tagText: {
    fontFamily: fonts.hanken.medium,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  wave: {
    width: 280,
    height: 40,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexShrink: 0,
    paddingHorizontal: 24,
    gap: 20,
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.limePlay,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  castWrap: {
    alignItems: 'center',
  },
  cast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.white05,
  },
  castText: {
    fontFamily: fonts.hanken.medium,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
});

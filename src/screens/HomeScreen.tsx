import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { radioBrowserApi } from '../api/radioBrowserApi';
import { AppHeader } from '../components/AppHeader';
import { CompactStationCard } from '../components/cards/CompactStationCard';
import { HeroStationCard } from '../components/cards/HeroStationCard';
import { HorizontalStationCard } from '../components/cards/HorizontalStationCard';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { SearchBar } from '../components/SearchBar';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { useRecentsStore } from '../store/recentsStore';
import { colors, fonts } from '../theme/tokens';
import type { RadioStation } from '../types/radio';
import { HOME_GENRES, type HomeGenre } from '../utils/constants';
import { useT } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Accueil'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<HomeGenre>(HOME_GENRES[0]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recents = useRecentsStore((s) => s.stations);
  const current = usePlayerStore((s) => s.currentStation);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playStation = usePlayerStore((s) => s.playStation);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const favorites = useFavoritesStore((s) => s.stations);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useCallback(
    (uuid: string) => favorites.some((item) => item.stationuuid === uuid),
    [favorites],
  );
  const t = useT();

  const load = useCallback(async () => {
    try {
      const results = await radioBrowserApi.searchStations({
        tag: 'tag' in genre ? genre.tag : undefined,
        countrycode: 'countrycode' in genre ? genre.countrycode : undefined,
        hidebroken: true,
        order: 'clickcount',
        reverse: true,
        limit: 12,
      });
      setStations(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [genre, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const hero = stations[0];
  const compact = stations.slice(1, 3);
  const queue = useMemo(() => [...stations, ...recents], [stations, recents]);

  const handlePlay = (station: RadioStation) => {
    if (current?.stationuuid === station.stationuuid) {
      void togglePlay();
      return;
    }
    void playStation(station, queue);
  };

  const openPlayer = (station: RadioStation) => {
    if (current?.stationuuid !== station.stationuuid) {
      void playStation(station, queue);
    }
    navigation.navigate('Player');
  };

  const submitSearch = () => {
    const value = query.trim();
    navigation.navigate('Explorer', value ? { query: value } : undefined);
  };

  return (
    <View style={styles.screen}>
      <AppHeader onSettings={() => navigation.navigate('Settings')} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primaryFixed}
          />
        }
      >
        <View style={styles.greeting}>
          <View style={styles.helloRow}>
            <Text style={styles.hello}>{t('home.hello')}</Text>
            <View style={styles.ping} />
          </View>
          <Text style={styles.subline}>{t('home.subline')}</Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.search')}
          onSubmit={submitSearch}
          onMic={submitSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {HOME_GENRES.map((item) => {
            const active = item.id === genre.id;
            return (
              <PressableScale
                key={item.id}
                onPress={() => setGenre(item)}
                style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
              >
                <Text
                  style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}
                >
                  {t(`genre.${item.id}` as TranslationKey)}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.kicker}>{t('home.kicker')}</Text>
            <Text style={styles.sectionTitle}>{t('home.trending')}</Text>
          </View>
          <PressableScale onPress={() => navigation.navigate('Explorer')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            <Icon name="chevron-right" size={16} color={colors.onSurfaceVariant} />
          </PressableScale>
        </View>

        {loading ? <LoadingState /> : null}
        {error && !loading ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!loading && !error && hero ? (
          <View style={styles.bento}>
            <HeroStationCard
              station={hero}
              isFavorite={isFavorite(hero.stationuuid)}
              isPlaying={isPlaying && current?.stationuuid === hero.stationuuid}
              onPlay={() => handlePlay(hero)}
              onFavorite={() => toggleFavorite(hero)}
              onOpen={() => openPlayer(hero)}
            />
            <View style={styles.compactRow}>
              {compact.map((station) => (
                <CompactStationCard
                  key={station.stationuuid}
                  station={station}
                  isFavorite={isFavorite(station.stationuuid)}
                  isPlaying={isPlaying && current?.stationuuid === station.stationuuid}
                  onPlay={() => handlePlay(station)}
                  onFavorite={() => toggleFavorite(station)}
                  onOpen={() => openPlayer(station)}
                />
              ))}
            </View>
          </View>
        ) : null}
        {!loading && !error && stations.length === 0 ? (
          <EmptyState title={t('home.emptyTitle')} subtitle={t('home.emptySubtitle')} />
        ) : null}

        <View style={[styles.sectionHead, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>{t('home.recents')}</Text>
          <Text style={styles.recentHint}>{t('home.last24h')}</Text>
        </View>
        {recents.length === 0 ? (
          <EmptyState
            icon="history"
            title={t('home.noRecentsTitle')}
            subtitle={t('home.noRecentsSubtitle')}
          />
        ) : (
          recents
            .slice(0, 4)
            .map((station) => (
              <HorizontalStationCard
                key={station.stationuuid}
                station={station}
                isPlaying={isPlaying && current?.stationuuid === station.stationuuid}
                onPlay={() => handlePlay(station)}
                onOpen={() => openPlayer(station)}
              />
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 160,
    gap: 18,
  },
  greeting: {
    paddingTop: 4,
  },
  helloRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  hello: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    letterSpacing: -0.5,
    color: colors.onSurface,
    textAlign: 'left',
  },
  ping: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryFixed,
  },
  subline: {
    fontFamily: fonts.hanken.regular,
    fontSize: 14,
    color: 'rgba(196,201,175,0.8)',
    marginTop: 2,
    textAlign: 'left',
  },
  chips: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primaryFixed,
  },
  chipIdle: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 14,
  },
  chipTextActive: {
    color: colors.onPrimaryFixed,
  },
  chipTextIdle: {
    color: colors.onSurfaceVariant,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primaryFixed,
    textAlign: 'left',
  },
  sectionTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'left',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  bento: {
    gap: 12,
  },
  compactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recentHint: {
    fontFamily: fonts.hanken.bold,
    fontSize: 11,
    color: 'rgba(196,201,175,0.7)',
    textAlign: 'left',
  },
});

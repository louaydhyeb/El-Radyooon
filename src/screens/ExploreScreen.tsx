import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radioBrowserApi } from '../api/radioBrowserApi';
import { AppHeader } from '../components/AppHeader';
import { ExploreStationCard } from '../components/cards/ExploreStationCard';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { FilterSheet, type SheetOption } from '../components/FilterSheet';
import { Icon } from '../components/Icon';
import { LimeToggle } from '../components/LimeToggle';
import { LiveDot } from '../components/LiveDot';
import { PressableScale } from '../components/PressableScale';
import { SearchBar } from '../components/SearchBar';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, fonts } from '../theme/tokens';
import type { RadioStation } from '../types/radio';
import { countryFlag } from '../utils/station';
import { useT } from '../i18n';
import type { RootStackParamList, TabParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Explorer'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const PAGE_SIZE = 20;

export function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<TabParamList, 'Explorer'>>();
  const incomingQuery = route.params?.query;
  const incomingTag = route.params?.tag;
  const incomingCountry = route.params?.countrycode;
  const [query, setQuery] = useState(incomingQuery ?? '');
  const [countrycode, setCountrycode] = useState(incomingCountry ?? '');
  const [tag, setTag] = useState(incomingTag ?? '');
  const [prevParams, setPrevParams] = useState(route.params);
  if (route.params !== prevParams) {
    setPrevParams(route.params);
    if (incomingQuery != null) setQuery(incomingQuery);
    if (incomingTag != null) setTag(incomingTag);
    if (incomingCountry != null) setCountrycode(incomingCountry);
  }
  const [codec, setCodec] = useState('');
  const [hideBroken, setHideBroken] = useState(useSettingsStore.getState().hideBroken);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'country' | 'tag' | 'codec' | null>(null);
  const [countries, setCountries] = useState<SheetOption[]>([]);
  const [tags, setTags] = useState<SheetOption[]>([]);
  const [codecs, setCodecs] = useState<SheetOption[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = usePlayerStore((s) => s.currentStation);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playStation = usePlayerStore((s) => s.playStation);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const favorites = useFavoritesStore((s) => s.stations);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const t = useT();

  useEffect(() => {
    void radioBrowserApi.getCountries().then((list) => {
      setCountries([
        { id: '', label: t('explore.allCountries') },
        ...list.slice(0, 80).map((item) => ({
          id: item.iso_3166_1,
          label: `${countryFlag(item.iso_3166_1)} ${item.name}`,
        })),
      ]);
    });
    void radioBrowserApi.getTags(100).then((list) => {
      setTags([
        { id: '', label: t('explore.allGenres') },
        ...list.map((item) => ({
          id: item.name,
          label: item.name,
        })),
      ]);
    });
    void radioBrowserApi.getCodecs().then((list) => {
      setCodecs([
        { id: '', label: t('explore.allCodecs') },
        ...list.slice(0, 20).map((item) => ({
          id: item.name,
          label: item.name.toUpperCase(),
        })),
      ]);
    });
  }, [t]);

  const fetchPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      try {
        const results = await radioBrowserApi.searchStations({
          name: query.trim() || undefined,
          countrycode: countrycode || undefined,
          tag: tag || undefined,
          codec: codec || undefined,
          hidebroken: hideBroken,
          order: query.trim() ? 'name' : 'clickcount',
          reverse: !query.trim(),
          offset: nextOffset,
          limit: PAGE_SIZE,
        });
        setStations((prev) => (replace ? results : [...prev, ...results]));
        setHasMore(results.length === PAGE_SIZE);
        setOffset(nextOffset);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('explore.searchError'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, countrycode, tag, codec, hideBroken, t],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchPage(0, true);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchPage]);

  const handlePlay = (station: RadioStation) => {
    if (current?.stationuuid === station.stationuuid) {
      void togglePlay();
      return;
    }
    void playStation(station, stations);
  };

  const openPlayer = (station: RadioStation) => {
    if (current?.stationuuid !== station.stationuuid) {
      void playStation(station, stations);
    }
    navigation.navigate('Player');
  };

  const countryLabel = useMemo(() => {
    if (!countrycode) return t('explore.world');
    const match = countries.find((item) => item.id === countrycode);
    const name = match ? match.label.replace(/^[^\s]+\s/, '') : countrycode;
    return t('explore.country', { name });
  }, [countrycode, countries, t]);

  return (
    <View style={styles.screen}>
      <AppHeader onSettings={() => navigation.navigate('Settings')} />
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('explore.title')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DAB+ & LIVE</Text>
          </View>
        </View>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('explore.search')}
          onClear={() => setQuery('')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <View style={styles.filtersRow}>
          <PressableScale onPress={() => setSheet('country')} style={styles.filterChip}>
            <Text style={styles.filterEmoji}>{countrycode ? countryFlag(countrycode) : '🌍'}</Text>
            <Text style={styles.filterText}>{countryLabel}</Text>
            <Icon name="expand-more" size={16} color={colors.white50} />
          </PressableScale>
          <PressableScale onPress={() => setSheet('tag')} style={styles.filterChip}>
            <Icon name="tune" size={16} color={colors.primaryFixed} />
            <Text style={styles.filterText}>{tag ? tag : t('explore.genre')}</Text>
          </PressableScale>
          <PressableScale onPress={() => setSheet('codec')} style={styles.filterChip}>
            <Text style={styles.filterText}>
              {codec ? t('explore.codecValue', { name: codec }) : t('explore.codec')}
            </Text>
            <Icon name="expand-more" size={16} color={colors.white50} />
          </PressableScale>
        </View>
      </ScrollView>

      <View style={styles.countRow}>
        <LimeToggle
          style={styles.hideToggle}
          value={hideBroken}
          onValueChange={(value) => {
            setHideBroken(value);
            useSettingsStore.getState().setHideBroken(value);
          }}
          label={t('explore.hideOffline')}
        />
        <View style={styles.count}>
          <LiveDot size={6} />
          <Text style={styles.countText} numberOfLines={1}>
            {stations.length}
            {hasMore ? '+' : ''} {t('explore.stations')}
          </Text>
        </View>
      </View>

      {loading ? <LoadingState label={t('explore.searching')} /> : null}
      {error && !loading ? (
        <ErrorState message={error} onRetry={() => void fetchPage(0, true)} />
      ) : null}
      {!loading && !error && stations.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('explore.emptyTitle')}
          subtitle={t('explore.emptySubtitle')}
        />
      ) : null}

      {!loading && !error ? (
        <FlatList
          data={stations}
          style={styles.listFlex}
          keyExtractor={(item) => item.stationuuid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
            void fetchPage(offset + PAGE_SIZE, false);
          }}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primaryFixed} style={{ margin: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <ExploreStationCard
              station={item}
              isFavorite={favorites.some((fav) => fav.stationuuid === item.stationuuid)}
              isActive={current?.stationuuid === item.stationuuid}
              isPlaying={isPlaying && current?.stationuuid === item.stationuuid}
              onPlay={() => handlePlay(item)}
              onFavorite={() => toggleFavorite(item)}
              onOpen={() => openPlayer(item)}
            />
          )}
        />
      ) : null}

      <FilterSheet
        visible={sheet === 'country'}
        title={t('explore.sheetCountry')}
        options={countries}
        selectedId={countrycode}
        onSelect={setCountrycode}
        onClose={() => setSheet(null)}
      />
      <FilterSheet
        visible={sheet === 'tag'}
        title={t('explore.sheetGenre')}
        options={tags}
        selectedId={tag}
        onSelect={setTag}
        onClose={() => setSheet(null)}
      />
      <FilterSheet
        visible={sheet === 'codec'}
        title={t('explore.sheetCodec')}
        options={codecs}
        selectedId={codec}
        onSelect={setCodec}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 28,
    color: colors.white,
    textAlign: 'left',
  },
  badge: {
    backgroundColor: colors.limeSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.primaryFixed,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingRight: 28,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterEmoji: {
    fontSize: 13,
  },
  filterText: {
    fontFamily: fonts.hanken.medium,
    fontSize: 13,
    color: colors.white,
    flexShrink: 0,
  },
  countRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hideToggle: {
    flex: 1,
    minWidth: 0,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  countText: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.primaryFixed,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 160,
    gap: 10,
  },
});

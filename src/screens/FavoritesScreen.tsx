import { useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { FavoriteStationCard } from '../components/cards/FavoriteStationCard';
import { EmptyState } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';
import { colors, fonts } from '../theme/tokens';
import { FAVORITE_SORT_OPTIONS } from '../utils/constants';
import { useT } from '../i18n';
import type { RootStackParamList, TabParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Favoris'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const favoriteStations = useFavoritesStore((s) => s.stations);
  const sort = useFavoritesStore((s) => s.sort);
  const stations = useMemo(() => {
    if (sort === 'name') {
      return [...favoriteStations].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    if (sort === 'country') {
      return [...favoriteStations].sort((a, b) =>
        (a.country || a.countrycode).localeCompare(b.country || b.countrycode, 'fr'),
      );
    }
    return favoriteStations;
  }, [favoriteStations, sort]);
  const setSort = useFavoritesStore((s) => s.setSort);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const exportPayload = useFavoritesStore((s) => s.exportPayload);
  const current = usePlayerStore((s) => s.currentStation);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playStation = usePlayerStore((s) => s.playStation);
  const t = useT();

  const cycleSort = () => {
    const index = FAVORITE_SORT_OPTIONS.findIndex((item) => item.id === sort);
    const next = FAVORITE_SORT_OPTIONS[(index + 1) % FAVORITE_SORT_OPTIONS.length];
    setSort(next.id);
  };

  const exportFavorites = async () => {
    if (stations.length === 0) {
      Alert.alert(t('favorites.exportEmptyTitle'), t('favorites.exportEmptyBody'));
      return;
    }
    await Share.share({
      title: t('favorites.exportTitle'),
      message: exportPayload(),
    });
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        right={
          <View style={styles.headerActions}>
            <PressableScale
              accessibilityLabel={t('a11y.exportFavorites')}
              onPress={() => void exportFavorites()}
              style={styles.iconBtn}
            >
              <Icon name="save-alt" size={20} color={colors.onSurfaceVariant} />
            </PressableScale>
            <PressableScale
              accessibilityLabel={t('a11y.sortFavorites')}
              onPress={cycleSort}
              style={styles.iconBtn}
            >
              <Icon name="swap-vert" size={20} color={colors.onSurfaceVariant} />
            </PressableScale>
          </View>
        }
      />
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
          <View style={styles.localBadge}>
            <Text style={styles.localText}>{t('favorites.localHud')}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{t('favorites.subtitle')}</Text>
        <View style={styles.storage}>
          <View style={styles.storageLeft}>
            <View style={styles.lock}>
              <Icon name="lock" size={15} color={colors.primaryFixed} />
            </View>
            <Text style={styles.storageText}>
              {t(stations.length > 1 ? 'favorites.savedMany' : 'favorites.savedOne', {
                count: stations.length,
              })}
            </Text>
          </View>
          <Icon name="storage" size={18} color={colors.white60} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {stations.length === 0 ? (
          <EmptyState
            icon="favorite-border"
            title={t('favorites.emptyTitle')}
            subtitle={t('favorites.emptySubtitle')}
          />
        ) : (
          stations.map((station) => (
            <FavoriteStationCard
              key={station.stationuuid}
              station={station}
              isPlaying={isPlaying && current?.stationuuid === station.stationuuid}
              onOpen={() => {
                void playStation(station, stations);
                navigation.navigate('Player');
              }}
              onRemove={() => removeFavorite(station.stationuuid)}
            />
          ))
        )}
        {stations.length > 0 ? (
          <View style={styles.hint}>
            <Icon name="swipe" size={16} color={colors.white40} />
            <Text style={styles.hintText}>{t('favorites.hint')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.white05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    color: colors.onSurface,
    textAlign: 'left',
  },
  localBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  localText: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.primaryFixed,
  },
  subtitle: {
    fontFamily: fonts.hanken.regular,
    fontSize: 12,
    color: 'rgba(196,201,175,0.8)',
    marginTop: 2,
    textAlign: 'left',
  },
  storage: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.white06,
  },
  storageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lock: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageText: {
    fontFamily: fonts.hanken.medium,
    fontSize: 11,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'left',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 160,
    gap: 10,
  },
  hint: {
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hintText: {
    fontFamily: fonts.hanken.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.white40,
  },
});

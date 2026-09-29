import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { MiniPlayer } from '../components/MiniPlayer';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { layoutDirection } from '../i18n';
import type { RootStackParamList, TabParamList } from './types';
import { navigationRef } from './navigationRef';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.surfaceContainerLowest,
    card: colors.surfaceContainerLowest,
    text: colors.onSurface,
    border: colors.surfaceContainer,
    primary: colors.primaryFixed,
  },
};

function TabLayout() {
  const hasStation = usePlayerStore((s) => Boolean(s.currentStation));
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <Tab.Navigator
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.surfaceContainerLowest,
            paddingTop: insets.top,
          },
        }}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Explorer" component={ExploreScreen} />
        <Tab.Screen name="Favoris" component={FavoritesScreen} />
      </Tab.Navigator>
      {hasStation ? (
        <MiniPlayer
          onExpand={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Player');
            }
          }}
        />
      ) : null}
    </View>
  );
}

export function RootNavigator() {
  const locale = useSettingsStore((s) => s.locale);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} direction={layoutDirection(locale)}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surfaceContainerLowest },
        }}
      >
        <Stack.Screen name="Tabs" component={TabLayout} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
});

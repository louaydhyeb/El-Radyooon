import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Accueil: undefined;
  Explorer: { query?: string; tag?: string; countrycode?: string } | undefined;
  Favoris: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Player: undefined;
  Settings: undefined;
};

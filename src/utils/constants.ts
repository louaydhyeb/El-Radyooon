export const HOME_GENRES = [
  { id: 'all', label: 'Tous' },
  { id: 'jazz', label: 'Jazz', tag: 'jazz' },
  { id: 'electronic', label: 'Électro', tag: 'electronic' },
  { id: 'rock', label: 'Rock', tag: 'rock' },
  { id: 'news', label: 'Infos & Débats', tag: 'news' },
  { id: 'france', label: 'France 🇫🇷', countrycode: 'FR' },
  { id: 'lofi', label: 'Lo-Fi', tag: 'lofi' },
] as const;

export type HomeGenre = (typeof HOME_GENRES)[number];

export const SLEEP_TIMER_OPTIONS = [
  { minutes: 0, label: 'Désactiver' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '60 min' },
] as const;

export const FAVORITE_SORT_OPTIONS = [
  { id: 'recent', label: 'Ajout récent' },
  { id: 'name', label: 'Nom' },
  { id: 'country', label: 'Pays' },
] as const;

export type FavoriteSort = (typeof FAVORITE_SORT_OPTIONS)[number]['id'];

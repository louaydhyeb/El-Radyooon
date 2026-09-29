import type { RadioStation } from '../types/radio';
import { t } from '../i18n';

const CREST_PALETTE = [
  { bg: '#E20038', fg: '#ffffff' },
  { bg: '#E3A824', fg: '#0e0e12' },
  { bg: '#1B2F23', fg: '#74E39A' },
  { bg: '#0E3A53', fg: '#45D1FD' },
  { bg: '#2E202B', fg: '#EAA6C7' },
  { bg: '#2B2317', fg: '#F3BA66' },
  { bg: '#1F2A44', fg: '#c6f340' },
  { bg: '#3A1D2E', fg: '#ffb4ab' },
];

export function countryFlag(code?: string): string {
  if (!code || code.length !== 2) {
    return '🌐';
  }
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    return '🌐';
  }
  return String.fromCodePoint(...[...upper].map((char) => 127397 + char.charCodeAt(0)));
}

export function formatBitrate(bitrate?: number): string {
  if (!bitrate || bitrate <= 0) {
    return 'Live';
  }
  return `${bitrate} kbps`;
}

export function formatCodec(codec?: string): string {
  if (!codec) {
    return 'STREAM';
  }
  return codec.toUpperCase();
}

export function formatBitrateCodec(station: Pick<RadioStation, 'bitrate' | 'codec'>): string {
  const rate = formatBitrate(station.bitrate);
  const codec = formatCodec(station.codec);
  if (rate === 'Live') {
    return codec;
  }
  return `${rate} ${codec}`;
}

export function stationTags(station: Pick<RadioStation, 'tags'>): string[] {
  return station.tags.filter(Boolean).slice(0, 6);
}

export function stationLocation(
  station: Pick<RadioStation, 'state' | 'country' | 'countrycode'>,
): string {
  const parts = [station.state, station.country || station.countrycode].filter(Boolean);
  return parts.join(', ') || t('common.world');
}

export function stationSubtitle(
  station: Pick<RadioStation, 'tags' | 'state' | 'country' | 'countrycode'>,
): string {
  const genre = station.tags[0];
  const place = station.state || station.country || station.countrycode;
  return [genre, place].filter(Boolean).join(' • ') || t('common.live');
}

export function stationInitials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'FM';
  }
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function crestColors(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CREST_PALETTE[hash % CREST_PALETTE.length];
}

export function streamUrl(station: Pick<RadioStation, 'url' | 'urlResolved'>): string {
  return station.urlResolved || station.url;
}

export function parseTags(raw?: string): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

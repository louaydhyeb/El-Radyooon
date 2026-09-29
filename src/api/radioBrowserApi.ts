import type {
  ClickResponse,
  CodecInfo,
  CountryInfo,
  RadioStation,
  StationSearchParams,
  TagInfo,
} from '../types/radio';
import { parseTags } from '../utils/station';
import {
  APP_USER_AGENT,
  BOOTSTRAP_SERVERS,
  RadioBrowserError,
  REQUEST_TIMEOUT_MS,
  normalizeHost,
  shuffle,
} from './radioBrowserClient';

type RawStation = {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  hls?: number | boolean;
  votes?: number;
  clickcount?: number;
  clicktrend?: number;
  lastcheckok?: number | boolean;
};

type ServerInfo = {
  name?: string;
};

let serverPool: string[] = shuffle(BOOTSTRAP_SERVERS);
let serversReady: Promise<void> | null = null;

function mapStation(raw: RawStation): RadioStation {
  return {
    stationuuid: raw.stationuuid,
    name: (raw.name || 'Radio').trim(),
    url: raw.url,
    urlResolved: raw.url_resolved || raw.url,
    homepage: raw.homepage || '',
    favicon: raw.favicon || '',
    tags: parseTags(raw.tags),
    country: raw.country || '',
    countrycode: (raw.countrycode || '').toUpperCase(),
    state: raw.state || '',
    language: raw.language || '',
    codec: raw.codec || '',
    bitrate: Number(raw.bitrate) || 0,
    hls: Boolean(raw.hls),
    votes: Number(raw.votes) || 0,
    clickcount: Number(raw.clickcount) || 0,
    clicktrend: Number(raw.clicktrend) || 0,
    lastcheckok: raw.lastcheckok === 1 || raw.lastcheckok === true,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': APP_USER_AGENT,
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RadioBrowserError('Délai d’attente dépassé. Vérifiez votre connexion.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function discoverServers(): Promise<void> {
  const candidates = shuffle(BOOTSTRAP_SERVERS);
  for (const base of candidates) {
    try {
      const response = await fetchWithTimeout(`${base}/json/servers`, { method: 'GET' }, 8000);
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json()) as ServerInfo[];
      const hosts = payload
        .map((server) => (server.name ? normalizeHost(server.name) : ''))
        .filter(Boolean);
      if (hosts.length > 0) {
        serverPool = shuffle(Array.from(new Set([...hosts, ...BOOTSTRAP_SERVERS])));
        return;
      }
    } catch {
      // Try the next bootstrap host.
    }
  }
  serverPool = candidates;
}

function ensureServers(): Promise<void> {
  if (!serversReady) {
    serversReady = discoverServers();
  }
  return serversReady;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  await ensureServers();
  const errors: string[] = [];

  for (const base of serverPool) {
    try {
      const response = await fetchWithTimeout(`${base}${path}`, init);
      if (!response.ok) {
        errors.push(`${base}: HTTP ${response.status}`);
        continue;
      }
      return (await response.json()) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur réseau';
      errors.push(`${base}: ${message}`);
    }
  }

  throw new RadioBrowserError(
    `Impossible de joindre Radio Browser. ${errors[0] ?? 'Aucun serveur disponible.'}`,
  );
}

function toSearchBody(params: StationSearchParams): Record<string, string | number | boolean> {
  const body: Record<string, string | number | boolean> = {
    hidebroken: params.hidebroken ?? true,
    limit: params.limit ?? 30,
    offset: params.offset ?? 0,
    order: params.order ?? 'clickcount',
    reverse: params.reverse ?? true,
  };

  if (params.name) body.name = params.name;
  if (params.tag) body.tag = params.tag;
  if (params.tagList) body.tagList = params.tagList;
  if (params.country) body.country = params.country;
  if (params.countrycode) body.countrycode = params.countrycode;
  if (params.codec) body.codec = params.codec;
  if (params.language) body.language = params.language;
  if (params.state) body.state = params.state;
  if (typeof params.bitrateMin === 'number') body.bitrateMin = params.bitrateMin;
  if (typeof params.bitrateMax === 'number') body.bitrateMax = params.bitrateMax;

  return body;
}

export const radioBrowserApi = {
  async searchStations(params: StationSearchParams = {}): Promise<RadioStation[]> {
    const payload = await request<RawStation[]>('/json/stations/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSearchBody(params)),
    });
    return payload.map(mapStation);
  },

  async getTopStations(limit = 20): Promise<RadioStation[]> {
    const payload = await request<RawStation[]>(`/json/stations/topclick/${limit}`);
    return payload.map(mapStation).filter((station) => station.lastcheckok);
  },

  async getTrendingStations(limit = 20): Promise<RadioStation[]> {
    return this.searchStations({
      order: 'clicktrend',
      reverse: true,
      hidebroken: true,
      limit,
    });
  },

  async getStationByUuid(uuid: string): Promise<RadioStation | null> {
    const payload = await request<RawStation[]>(
      `/json/stations/byuuid?uuids=${encodeURIComponent(uuid)}`,
    );
    return payload[0] ? mapStation(payload[0]) : null;
  },

  async getStationsByUuid(uuids: string[]): Promise<RadioStation[]> {
    if (uuids.length === 0) {
      return [];
    }
    const payload = await request<RawStation[]>('/json/stations/byuuid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids: uuids.join(',') }),
    });
    return payload.map(mapStation);
  },

  async clickStation(uuid: string): Promise<ClickResponse | null> {
    try {
      return await request<ClickResponse>(`/json/url/${encodeURIComponent(uuid)}`);
    } catch {
      return null;
    }
  },

  async getCountries(): Promise<CountryInfo[]> {
    const payload = await request<CountryInfo[]>('/json/countries');
    return payload.sort((a, b) => b.stationcount - a.stationcount);
  },

  async getTags(limit = 80): Promise<TagInfo[]> {
    const payload = await request<TagInfo[]>(
      `/json/tags?order=stationcount&reverse=true&limit=${limit}`,
    );
    return payload.filter((tag) => Boolean(tag.name));
  },

  async getCodecs(): Promise<CodecInfo[]> {
    const payload = await request<CodecInfo[]>('/json/codecs');
    return payload.sort((a, b) => b.stationcount - a.stationcount);
  },
};

import type { RadioStation } from '../types/radio';

export type NowPlaying = {
  artist: string;
  title: string;
};

const ICY_TIMEOUT_MS = 7000;
const MAX_METAINT = 48_000;
const MAX_READ = MAX_METAINT + 16 + 4080;
const IGNORE_TITLE = /^(unknown|n\/?a|-|–|—|\.|null|undefined)?$/i;
const USER_AGENT = 'ElRadyooon/1.1';

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUselessTitle(value: string, stationName: string): boolean {
  const normalized = value.trim();
  if (!normalized || IGNORE_TITLE.test(normalized)) {
    return true;
  }
  return normalized.localeCompare(stationName.trim(), undefined, { sensitivity: 'accent' }) === 0;
}

export function splitNowPlaying(raw: string, stationName: string): NowPlaying | null {
  const cleaned = decodeEntities(raw);
  if (isUselessTitle(cleaned, stationName)) {
    return null;
  }
  const parts = cleaned.split(/\s[-–—]\s+/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (!title || isUselessTitle(title, stationName)) {
      return { artist: stationName, title: cleaned };
    }
    return { artist: artist || stationName, title };
  }
  return { artist: stationName, title: cleaned };
}

export function formatNowPlaying(nowPlaying: NowPlaying | null | undefined): string | null {
  if (!nowPlaying?.title) {
    return null;
  }
  if (nowPlaying.artist && nowPlaying.artist !== nowPlaying.title) {
    return `${nowPlaying.artist} — ${nowPlaying.title}`;
  }
  return nowPlaying.title;
}

function isHls(url: string, station?: Pick<RadioStation, 'hls' | 'codec'>): boolean {
  if (station?.hls) {
    return true;
  }
  if ((station?.codec || '').toLowerCase() === 'hls') {
    return true;
  }
  return url.split('?')[0].toLowerCase().endsWith('.m3u8');
}

function header(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

async function withTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
  parent?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ICY_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  parent?.addEventListener('abort', onAbort);
  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener('abort', onAbort);
  }
}

function concatBytes(chunks: Uint8Array[], max: number): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(Math.min(max, total));
  let offset = 0;
  for (const chunk of chunks) {
    const room = out.byteLength - offset;
    if (room <= 0) {
      break;
    }
    const slice = chunk.byteLength > room ? chunk.subarray(0, room) : chunk;
    out.set(slice, offset);
    offset += slice.byteLength;
  }
  return out;
}

async function readPrefix(
  response: Response,
  maxBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const body = response.body;
  if (!body || typeof body.getReader !== 'function') {
    return new Uint8Array();
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes && !signal.aborted) {
      const { done, value } = await reader.read();
      if (done || !value) {
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Already closed.
    }
  }
  return concatBytes(chunks, maxBytes);
}

function parseIcyBlock(bytes: Uint8Array, offset: number): string | null {
  if (offset >= bytes.byteLength) {
    return null;
  }
  const length = bytes[offset] * 16;
  if (length <= 0 || offset + 1 + length > bytes.byteLength) {
    return null;
  }
  const text = new TextDecoder('latin1').decode(bytes.subarray(offset + 1, offset + 1 + length));
  const match = text.match(/StreamTitle='([^']*)'/i);
  return match?.[1]?.trim() || null;
}

function firstHttpUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match?.[0]?.replace(/[),.;]+$/, '') ?? null;
}

async function resolvePlaylist(url: string, signal: AbortSignal): Promise<string> {
  const path = url.split('?')[0].toLowerCase();
  if (!path.endsWith('.m3u') && !path.endsWith('.pls') && !path.endsWith('.xspf')) {
    return url;
  }
  try {
    const response = await fetch(url, {
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain,*/*' },
    });
    if (!response.ok) {
      return url;
    }
    const text = await response.text();
    return firstHttpUrl(text) ?? url;
  } catch {
    return url;
  }
}

function icecastStatusUrl(streamUrl: string): string | null {
  try {
    const parsed = new URL(streamUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}/status-json.xsl`;
  } catch {
    return null;
  }
}

type IcecastSource = {
  listenurl?: string;
  title?: string;
  yp_currently_playing?: string;
  server_name?: string;
};

function icecastSources(payload: unknown): IcecastSource[] {
  const stats = (payload as { icestats?: { source?: IcecastSource | IcecastSource[] } })?.icestats;
  const source = stats?.source;
  if (!source) {
    return [];
  }
  return Array.isArray(source) ? source : [source];
}

function pickIcecastTitle(payload: unknown, streamUrl: string): string | null {
  const sources = icecastSources(payload);
  if (sources.length === 0) {
    return null;
  }
  let pathname = '';
  try {
    pathname = new URL(streamUrl).pathname;
  } catch {
    pathname = '';
  }
  const matched = pathname
    ? sources.find(
        (source) => typeof source.listenurl === 'string' && source.listenurl.includes(pathname),
      )
    : undefined;
  const ordered = matched ? [matched, ...sources] : sources;
  for (const source of ordered) {
    const title = source.yp_currently_playing || source.title;
    if (title && title.trim()) {
      return title.trim();
    }
  }
  return null;
}

async function fetchIcecastTitle(streamUrl: string, signal: AbortSignal): Promise<string | null> {
  const statusUrl = icecastStatusUrl(streamUrl);
  if (!statusUrl) {
    return null;
  }
  try {
    const response = await fetch(statusUrl, {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!response.ok) {
      return null;
    }
    const json: unknown = await response.json();
    return pickIcecastTitle(json, streamUrl);
  } catch {
    return null;
  }
}

async function fetchIcyTitle(streamUrl: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(streamUrl, {
      method: 'GET',
      signal,
      headers: {
        'Icy-MetaData': '1',
        'icy-metadata': '1',
        'User-Agent': USER_AGENT,
        Accept: '*/*',
      },
    });
    const metaint = Number(header(response.headers, 'icy-metaint'));
    if (!Number.isFinite(metaint) || metaint <= 0 || metaint > MAX_METAINT) {
      const fallback =
        header(response.headers, 'icy-description') || header(response.headers, 'ice-audio-info');
      try {
        await response.body?.cancel();
      } catch {
        // Ignore.
      }
      return fallback && fallback.includes(' - ') ? fallback : null;
    }
    const bytes = await readPrefix(response, Math.min(MAX_READ, metaint + 1 + 4080), signal);
    return parseIcyBlock(bytes, metaint);
  } catch {
    return null;
  }
}

export async function fetchNowPlaying(
  url: string,
  station: Pick<RadioStation, 'name' | 'hls' | 'codec'>,
  signal?: AbortSignal,
): Promise<NowPlaying | null> {
  if (!url || isHls(url, station)) {
    return null;
  }
  return withTimeout(async (timeoutSignal) => {
    const resolved = await resolvePlaylist(url, timeoutSignal);
    if (isHls(resolved, station)) {
      return null;
    }
    const icecast = await fetchIcecastTitle(resolved, timeoutSignal);
    const parsedIcecast = icecast ? splitNowPlaying(icecast, station.name) : null;
    if (parsedIcecast) {
      return parsedIcecast;
    }
    const icy = await fetchIcyTitle(resolved, timeoutSignal);
    return icy ? splitNowPlaying(icy, station.name) : null;
  }, signal);
}

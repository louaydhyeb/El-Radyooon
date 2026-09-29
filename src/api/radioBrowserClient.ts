export class RadioBrowserError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RadioBrowserError';
    this.status = status;
  }
}

const APP_USER_AGENT = 'ElRadyooon/1.0';
const REQUEST_TIMEOUT_MS = 12000;
const BOOTSTRAP_SERVERS = [
  'https://de2.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeHost(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/^http:\/\//, 'https://');
  }
  return `https://${trimmed}`;
}

export { APP_USER_AGENT, REQUEST_TIMEOUT_MS, BOOTSTRAP_SERVERS, shuffle, normalizeHost };

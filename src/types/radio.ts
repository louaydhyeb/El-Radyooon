export type RadioStation = {
  stationuuid: string;
  name: string;
  url: string;
  urlResolved: string;
  homepage: string;
  favicon: string;
  tags: string[];
  country: string;
  countrycode: string;
  state: string;
  language: string;
  codec: string;
  bitrate: number;
  hls: boolean;
  votes: number;
  clickcount: number;
  clicktrend: number;
  lastcheckok: boolean;
};

export type StationSearchParams = {
  name?: string;
  tag?: string;
  tagList?: string;
  country?: string;
  countrycode?: string;
  codec?: string;
  language?: string;
  state?: string;
  bitrateMin?: number;
  bitrateMax?: number;
  order?:
    'name' | 'votes' | 'codec' | 'bitrate' | 'clickcount' | 'clicktrend' | 'random' | 'country';
  reverse?: boolean;
  offset?: number;
  limit?: number;
  hidebroken?: boolean;
};

export type CountryInfo = {
  name: string;
  iso_3166_1: string;
  stationcount: number;
};

export type TagInfo = {
  name: string;
  stationcount: number;
};

export type CodecInfo = {
  name: string;
  stationcount: number;
};

export type ClickResponse = {
  ok: boolean | string;
  message: string;
  stationuuid: string;
  name: string;
  url: string;
};

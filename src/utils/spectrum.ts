export const SPECTRUM_BARS = 12;
export const LIVE_ENERGY = 0.045;

export type SpectrumFrame = {
  bars: number[];
  energy: number;
};

function rms(frames: number[], start: number, end: number): number {
  const n = end - start;
  if (n <= 0) {
    return 0;
  }
  let sum = 0;
  for (let i = start; i < end; i++) {
    const sample = frames[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / n);
}

export function mixChannels(channels: { frames: number[] }[]): number[] {
  const primary = channels[0]?.frames;
  if (!primary?.length) {
    return [];
  }
  const secondary = channels[1]?.frames;
  if (!secondary?.length) {
    return primary;
  }
  const length = Math.min(primary.length, secondary.length);
  const mixed = new Array<number>(length);
  for (let i = 0; i < length; i++) {
    mixed[i] = ((primary[i] ?? 0) + (secondary[i] ?? 0)) * 0.5;
  }
  return mixed;
}

export function spectrumFromFrames(frames: number[], barCount = SPECTRUM_BARS): SpectrumFrame {
  if (!frames.length) {
    return { bars: Array.from({ length: barCount }, () => 0), energy: 0 };
  }

  const energy = Math.min(1, Math.pow(rms(frames, 0, frames.length), 0.5) * 2.4);
  const size = Math.max(1, Math.floor(frames.length / barCount));
  const bars = new Array<number>(barCount);

  for (let i = 0; i < barCount; i++) {
    const start = i * size;
    const end = i === barCount - 1 ? frames.length : Math.min(frames.length, start + size);
    const level = Math.min(1, Math.pow(rms(frames, start, end), 0.55) * 2.6);
    bars[i] = 0.08 + level * 0.92;
  }

  return { bars, energy };
}

export function smoothSpectrum(previous: SpectrumFrame | null, next: SpectrumFrame): SpectrumFrame {
  if (!previous) {
    return next;
  }
  const bars = next.bars.map((level, index) => {
    const prior = previous.bars[index] ?? 0.08;
    return level > prior ? prior * 0.32 + level * 0.68 : prior * 0.72 + level * 0.28;
  });
  const energy =
    next.energy > previous.energy
      ? previous.energy * 0.35 + next.energy * 0.65
      : previous.energy * 0.7 + next.energy * 0.3;
  return { bars, energy };
}

export function takeBars(source: number[], count: number): number[] {
  if (count === source.length) {
    return source;
  }
  if (count <= 0) {
    return [];
  }
  const out = new Array<number>(count);
  const stride = source.length / count;
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * stride);
    const end = Math.max(start + 1, Math.floor((i + 1) * stride));
    let sum = 0;
    for (let j = start; j < end && j < source.length; j++) {
      sum += source[j] ?? 0;
    }
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export function centerDistance(index: number, count: number): number {
  if (count <= 1) {
    return 0;
  }
  const mid = (count - 1) / 2;
  return Math.abs(index - mid) / mid;
}

export function shapeEqualizerBars(levels: number[]): number[] {
  return levels.map((level, index) => {
    const dist = centerDistance(index, levels.length);
    const weight = 1 - dist * 0.52;
    return Math.min(1, 0.1 + level * (0.5 + weight * 0.5));
  });
}

export function idleEqualizerBars(count: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const dist = centerDistance(index, count);
    return 0.16 + (1 - dist) * 0.44;
  });
}

export function barOpacity(index: number, count: number): number {
  if (count <= 4) {
    return 0.72 + (1 - centerDistance(index, count)) * 0.28;
  }
  return 0.38 + (1 - centerDistance(index, count)) * 0.62;
}

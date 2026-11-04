import {
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioMetadata,
  type AudioPlayer,
  type AudioSample,
  type AudioStatus,
} from 'expo-audio';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  LIVE_ENERGY,
  mixChannels,
  smoothSpectrum,
  spectrumFromFrames,
  type SpectrumFrame,
} from '../utils/spectrum';

type StatusHandler = (playing: boolean, buffering: boolean, error?: string) => void;
type SpectrumHandler = (frame: SpectrumFrame | null) => void;

const isExpoGo = Constants.appOwnership === 'expo';
const SAMPLE_THROTTLE_MS = 33;

class AudioService {
  private player: AudioPlayer | null = null;
  private subscription: { remove: () => void } | null = null;
  private sampleSubscription: { remove: () => void } | null = null;
  private loadToken = 0;
  private configured = false;
  private samplingReady = false;
  private samplingDenied = false;
  private samplingLock = false;
  private lastSampleAt = 0;
  private smoothed: SpectrumFrame | null = null;
  private onStatus: StatusHandler | null = null;
  private spectrumListeners = new Set<SpectrumHandler>();

  setStatusHandler(handler: StatusHandler | null) {
    this.onStatus = handler;
  }

  isReady() {
    return this.player != null;
  }

  subscribeSpectrum(handler: SpectrumHandler): () => void {
    this.spectrumListeners.add(handler);
    if (this.smoothed) {
      handler(this.smoothed);
    }
    return () => {
      this.spectrumListeners.delete(handler);
    };
  }

  private emitSpectrum(frame: SpectrumFrame | null) {
    this.spectrumListeners.forEach((listener) => listener(frame));
  }

  private handleStatus = (status: AudioStatus) => {
    this.onStatus?.(status.playing, status.isBuffering, status.error ?? undefined);
    if (status.playing) {
      void this.attachSampling();
    } else {
      this.smoothed = null;
      this.emitSpectrum(null);
    }
  };

  private handleSample = (sample: AudioSample) => {
    const now = Date.now();
    if (now - this.lastSampleAt < SAMPLE_THROTTLE_MS) {
      return;
    }
    this.lastSampleAt = now;
    const frames = mixChannels(sample.channels);
    if (!frames.length) {
      return;
    }
    const next = smoothSpectrum(this.smoothed, spectrumFromFrames(frames));
    if (next.energy < LIVE_ENERGY) {
      return;
    }
    this.smoothed = next;
    this.emitSpectrum(this.smoothed);
  };

  private ensurePlayer() {
    if (this.player) {
      return this.player;
    }

    const player = createAudioPlayer(null, {
      updateInterval: 800,
      keepAudioSessionActive: true,
    });
    this.subscription = player.addListener('playbackStatusUpdate', this.handleStatus);
    this.sampleSubscription = player.addListener('audioSampleUpdate', this.handleSample);
    this.player = player;
    return player;
  }

  private async configureMode() {
    if (this.configured) {
      return;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    });
    if (Platform.OS === 'android' && !isExpoGo) {
      try {
        await requestNotificationPermissionsAsync();
      } catch {
        // Native permission prompt is unavailable in some runtimes.
      }
    }
    this.configured = true;
  }

  private applyLockScreen(player: AudioPlayer, metadata?: AudioMetadata) {
    if (isExpoGo) {
      return;
    }
    try {
      player.setActiveForLockScreen(true, metadata, {
        isLiveStream: true,
        showSeekBackward: false,
        showSeekForward: false,
      });
    } catch {
      // Lock screen service is only available in a native/dev build.
    }
  }

  private async attachSampling() {
    if (isExpoGo || this.samplingReady || this.samplingDenied || this.samplingLock) {
      return;
    }
    const player = this.player;
    if (!player?.isAudioSamplingSupported) {
      return;
    }
    this.samplingLock = true;
    try {
      if (Platform.OS === 'android') {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          this.samplingDenied = true;
          return;
        }
      }
      player.setAudioSamplingEnabled(true);
      this.samplingReady = true;
    } catch {
      this.samplingDenied = true;
    } finally {
      this.samplingLock = false;
    }
  }

  async play(uri: string, metadata?: AudioMetadata) {
    const token = (this.loadToken += 1);
    await this.configureMode();
    if (token !== this.loadToken) {
      return;
    }

    const player = this.ensurePlayer();
    this.samplingReady = false;
    this.smoothed = null;
    player.replace({ uri });
    player.volume = 1;
    player.play();
    this.applyLockScreen(player, metadata);
    void this.attachSampling();
  }

  async pause() {
    this.player?.pause();
  }

  async resume() {
    this.player?.play();
    void this.attachSampling();
  }

  updateNowPlaying(metadata: AudioMetadata) {
    if (isExpoGo || !this.player) {
      return;
    }
    try {
      this.player.updateLockScreenMetadata(metadata);
    } catch {
      this.applyLockScreen(this.player, metadata);
    }
  }

  async setVolume(volume: number) {
    if (this.player) {
      this.player.volume = Math.min(1, Math.max(0, volume));
    }
  }

  async unload() {
    this.loadToken += 1;
    this.subscription?.remove();
    this.subscription = null;
    this.sampleSubscription?.remove();
    this.sampleSubscription = null;
    this.samplingReady = false;
    this.smoothed = null;
    this.emitSpectrum(null);
    if (!this.player) {
      return;
    }
    const current = this.player;
    this.player = null;
    try {
      current.pause();
      if (!isExpoGo) {
        try {
          current.setAudioSamplingEnabled(false);
        } catch {
          // Sampling was never enabled.
        }
        current.clearLockScreenControls();
      }
      current.remove();
    } catch {
      // Already released.
    }
  }
}

export const audioService = new AudioService();

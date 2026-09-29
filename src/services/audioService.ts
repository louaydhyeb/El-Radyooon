import {
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  type AudioMetadata,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type StatusHandler = (playing: boolean, buffering: boolean, error?: string) => void;

const isExpoGo = Constants.appOwnership === 'expo';

class AudioService {
  private player: AudioPlayer | null = null;
  private subscription: { remove: () => void } | null = null;
  private loadToken = 0;
  private configured = false;
  private onStatus: StatusHandler | null = null;

  setStatusHandler(handler: StatusHandler | null) {
    this.onStatus = handler;
  }

  private handleStatus = (status: AudioStatus) => {
    this.onStatus?.(status.playing, status.isBuffering, status.error ?? undefined);
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

  async play(uri: string, metadata?: AudioMetadata) {
    const token = (this.loadToken += 1);
    await this.configureMode();
    if (token !== this.loadToken) {
      return;
    }

    const player = this.ensurePlayer();
    player.replace({ uri });
    player.volume = 1;
    player.play();
    this.applyLockScreen(player, metadata);
  }

  async pause() {
    this.player?.pause();
  }

  async resume() {
    this.player?.play();
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
    if (!this.player) {
      return;
    }
    const current = this.player;
    this.player = null;
    try {
      current.pause();
      if (!isExpoGo) {
        current.clearLockScreenControls();
      }
      current.remove();
    } catch {
      // Already released.
    }
  }
}

export const audioService = new AudioService();

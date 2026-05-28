// Minimal ambient typings for the Spotify Web Playback SDK. The official
// @types/spotify-web-playback-sdk package pulls in a huge surface area we
// don't use; we declare only the bits useSpotifyPlayer touches. Augmenting
// the global `Window` requires `interface` for declaration merging, so the
// local lint rule is disabled below where unavoidable.

export {};

declare global {
  namespace Spotify {
    type PlayerInit = {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    };

    type PlaybackState = {
      paused: boolean;
      position: number;
      duration: number;
      track_window: {
        current_track: { id: string | null; uri: string };
      };
    };

    type Player = {
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(
        event: "ready" | "not_ready",
        cb: (args: { device_id: string }) => void,
      ): void;
      addListener(
        event: "player_state_changed",
        cb: (state: PlaybackState | null) => void,
      ): void;
      addListener(
        event:
          | "initialization_error"
          | "authentication_error"
          | "account_error"
          | "playback_error",
        cb: (args: { message: string }) => void,
      ): void;
      removeListener(event: string): void;
      pause(): Promise<void>;
      resume(): Promise<void>;
      togglePlay(): Promise<void>;
      seek(positionMs: number): Promise<void>;
      getCurrentState(): Promise<PlaybackState | null>;
    };

    type PlayerConstructor = new (options: PlayerInit) => Player;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    Spotify?: { Player: Spotify.PlayerConstructor };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

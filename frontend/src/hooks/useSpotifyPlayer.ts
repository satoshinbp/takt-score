"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getValidAccessToken } from "@/lib/spotify/auth";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

// Ensures the Web Playback SDK script is loaded exactly once per session.
// The SDK invokes window.onSpotifyWebPlaybackSDKReady when it has wired up
// window.Spotify; we resolve a single shared promise from that callback.
let sdkReadyPromise: Promise<void> | null = null;

const loadSpotifySDK = (): Promise<void> => {
  if (sdkReadyPromise) return sdkReadyPromise;
  sdkReadyPromise = new Promise((resolve, reject) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Spotify SDK"));
    document.body.appendChild(script);
  });
  return sdkReadyPromise;
};

const startTrackPlayback = async (
  deviceId: string,
  trackUri: string,
  accessToken: string,
): Promise<void> => {
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    },
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`Spotify play failed (${res.status})`);
  }
};

export type SpotifyPlayerState = {
  isReady: boolean;
  isPlaying: boolean;
  // Set when Spotify rejects auth/account/playback; null otherwise.
  errorMessage: string | null;
  playTrack: (trackUri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  onStateChange: (
    cb: (state: Spotify.PlaybackState | null) => void,
  ) => () => void;
};

type Options = {
  deviceName?: string;
};

// useSpotifyPlayer initializes a Web Playback SDK instance for the page and
// exposes a small command surface. The hook does NOT auto-play anything; the
// caller decides when to call playTrack. State callbacks include the raw SDK
// PlaybackState so callers can read paused/position fields for sync.
export const useSpotifyPlayer = ({
  deviceName = "TaktScore",
}: Options = {}): SpotifyPlayerState => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const stateListenersRef = useRef<
    ((state: Spotify.PlaybackState | null) => void)[]
  >([]);
  const [isReady, setReady] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        await loadSpotifySDK();
        if (isCancelled) return;
        if (!window.Spotify) throw new Error("Spotify SDK unavailable");

        const player = new window.Spotify.Player({
          name: deviceName,
          getOAuthToken: (cb) => {
            void (async () => {
              const token = await getValidAccessToken();
              if (token) cb(token);
            })();
          },
          volume: 0.7,
        });

        player.addListener("ready", ({ device_id }) => {
          deviceIdRef.current = device_id;
          setReady(true);
        });
        player.addListener("not_ready", () => {
          setReady(false);
        });
        player.addListener("player_state_changed", (state) => {
          setPlaying(!!state && !state.paused);
          for (const cb of stateListenersRef.current) cb(state);
        });
        const handleError = ({ message }: { message: string }) =>
          setError(message);
        player.addListener("initialization_error", handleError);
        player.addListener("authentication_error", handleError);
        player.addListener("account_error", handleError);
        player.addListener("playback_error", handleError);

        const isConnected = await player.connect();
        if (!isConnected) throw new Error("Spotify player failed to connect");
        playerRef.current = player;
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      isCancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
      setReady(false);
      setPlaying(false);
    };
  }, [deviceName]);

  const playTrack = useCallback(async (trackUri: string) => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) throw new Error("Spotify device not ready");
    const token = await getValidAccessToken();
    if (!token) throw new Error("Spotify session expired");
    await startTrackPlayback(deviceId, trackUri, token);
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const onStateChange = useCallback(
    (cb: (state: Spotify.PlaybackState | null) => void) => {
      stateListenersRef.current.push(cb);
      return () => {
        stateListenersRef.current = stateListenersRef.current.filter(
          (l) => l !== cb,
        );
      };
    },
    [],
  );

  return {
    isReady,
    isPlaying,
    errorMessage,
    playTrack,
    pause,
    resume,
    onStateChange,
  };
};

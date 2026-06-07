"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getValidAccessToken } from "@/lib/spotify/auth";
import { sleep } from "@/lib/utils";

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
    /* v8 ignore next -- happy-dom does not trigger script.onerror in tests */
    script.onerror = () => reject(new Error("Failed to load Spotify SDK"));
    document.body.appendChild(script);
  });
  return sdkReadyPromise;
};

// The Web Playback SDK fires "ready" before Spotify's backend finishes
// registering the device as a transfer target, so a transfer sent immediately
// after ready returns 404 "Device not found". Retry with a short backoff until
// the backend catches up; a persistent 404 means the device is genuinely gone.
const TRANSFER_MAX_ATTEMPTS = 5;
const TRANSFER_RETRY_BASE_MS = 400;

const transferPlayback = async (
  deviceId: string,
  accessToken: string,
): Promise<void> => {
  for (let attempt = 0; attempt < TRANSFER_MAX_ATTEMPTS; attempt++) {
    const res = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
    if (res.ok || res.status === 204) return;
    const isLastAttempt = attempt === TRANSFER_MAX_ATTEMPTS - 1;
    if (res.status !== 404 || isLastAttempt) {
      throw new Error(`Spotify transfer failed (${res.status})`);
    }
    await sleep(TRANSFER_RETRY_BASE_MS * (attempt + 1));
  }
};

const startTrackPlayback = async (
  deviceId: string,
  trackUri: string,
  accessToken: string,
): Promise<void> => {
  await transferPlayback(deviceId, accessToken);
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
  // Current playback position and track length.
  positionMs: number;
  durationMs: number;
  // Set when Spotify rejects auth/account/playback; null otherwise.
  errorMessage: string | null;
  playTrack: (trackUri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
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
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [errorMessage, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        await loadSpotifySDK();
        /* v8 ignore next -- unmount-during-load race */
        if (isCancelled) return;
        /* v8 ignore next -- SDK ready callback fires without window.Spotify */
        if (!window.Spotify) throw new Error("Spotify SDK unavailable");

        const player = new window.Spotify.Player({
          name: deviceName,
          getOAuthToken: (cb) => {
            // Always invoke cb — passing "" when no valid token is available
            // makes the SDK fire authentication_error so the UI can surface a
            // re-login prompt instead of silently stalling.
            void (async () => {
              const token = await getValidAccessToken();
              cb(token ?? "");
            })();
          },
          volume: 0.7,
        });

        player.addListener("ready", ({ device_id }) => {
          deviceIdRef.current = device_id;
          setReady(true);
        });
        player.addListener("not_ready", () => {
          // Drop the device id so a later command cannot target a device that
          // Spotify no longer lists (which would 404).
          deviceIdRef.current = null;
          setReady(false);
        });
        player.addListener("player_state_changed", (state) => {
          setPlaying(!!state && !state.paused);
          if (state) {
            setPositionMs(state.position);
            setDurationMs(state.duration);
          }
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
        /* v8 ignore next -- guard against errors arriving after unmount */
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
    // Resume in place when the SDK already holds this track (e.g. it was
    // paused) so play does not restart it from the beginning.
    const state = await playerRef.current?.getCurrentState();
    if (state?.track_window.current_track.uri === trackUri) {
      await playerRef.current?.resume();
      return;
    }
    await startTrackPlayback(deviceId, trackUri, token);
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const seek = useCallback(async (toPositionMs: number) => {
    await playerRef.current?.seek(toPositionMs);
    setPositionMs(toPositionMs);
  }, []);

  // player_state_changed does not fire as playback advances, so poll the
  // current position while playing to keep the progress bar moving.
  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = setInterval(() => {
      void (async () => {
        const state = await playerRef.current?.getCurrentState();
        if (state) {
          setPositionMs(state.position);
          setDurationMs(state.duration);
        }
      })();
    }, 500);
    return () => clearInterval(intervalId);
  }, [isPlaying]);

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
    positionMs,
    durationMs,
    errorMessage,
    playTrack,
    pause,
    resume,
    seek,
    onStateChange,
  };
};

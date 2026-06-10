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

// The Web Playback SDK reliably supports a single active Player per browser
// session. Creating a second Player while the first is still tearing down
// leaves the backend confused: the new Player fires "ready" but transfers to
// its device id return 404 "Device not found" indefinitely (#34). We share a
// single Player across all useSpotifyPlayer mounts via this module-level
// singleton and never disconnect it on hook unmount — view/edit toggles
// (which remount the viewer) keep reusing the same registered device.
type ReadyListener = (deviceId: string) => void;
type NotReadyListener = () => void;
type StateChangeListener = (state: Spotify.PlaybackState | null) => void;
type ErrorListener = (message: string) => void;

type PlayerInstance = {
  player: Spotify.Player;
  deviceId: string | null;
  isReady: boolean;
  lastState: Spotify.PlaybackState | null;
  readyListeners: Set<ReadyListener>;
  notReadyListeners: Set<NotReadyListener>;
  stateChangeListeners: Set<StateChangeListener>;
  errorListeners: Set<ErrorListener>;
};

let instancePromise: Promise<PlayerInstance> | null = null;

const createPlayer = async (deviceName: string): Promise<PlayerInstance> => {
  try {
    await loadSpotifySDK();
    /* v8 ignore next -- SDK ready callback fires without window.Spotify */
    if (!window.Spotify) throw new Error("Spotify SDK unavailable");

    const instance: PlayerInstance = {
      player: null as unknown as Spotify.Player,
      deviceId: null,
      isReady: false,
      lastState: null,
      readyListeners: new Set(),
      notReadyListeners: new Set(),
      stateChangeListeners: new Set(),
      errorListeners: new Set(),
    };

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
      instance.deviceId = device_id;
      instance.isReady = true;
      for (const cb of instance.readyListeners) cb(device_id);
    });
    player.addListener("not_ready", () => {
      // Drop the device id so a later command cannot target a device that
      // Spotify no longer lists (which would 404).
      instance.deviceId = null;
      instance.isReady = false;
      for (const cb of instance.notReadyListeners) cb();
    });
    player.addListener("player_state_changed", (state) => {
      instance.lastState = state;
      for (const cb of instance.stateChangeListeners) cb(state);
    });
    const handleError = ({ message }: { message: string }) => {
      for (const cb of instance.errorListeners) cb(message);
    };
    player.addListener("initialization_error", handleError);
    player.addListener("authentication_error", handleError);
    player.addListener("account_error", handleError);
    player.addListener("playback_error", handleError);

    instance.player = player;
    const isConnected = await player.connect();
    if (!isConnected) throw new Error("Spotify player failed to connect");
    return instance;
  } catch (e) {
    // Let a future mount retry initialization rather than leaving a rejected
    // promise cached forever.
    instancePromise = null;
    throw e;
  }
};

const getOrCreatePlayer = (deviceName: string): Promise<PlayerInstance> => {
  if (instancePromise) return instancePromise;
  instancePromise = createPlayer(deviceName);
  return instancePromise;
};

// Exposed only for vitest to clear the singleton between cases — production
// code should never call this. vi.resetModules() does not affect bindings
// already imported via static `import` at the top of a test file, so the
// singleton would otherwise leak across tests.
export const __resetSpotifyPlayerForTests = () => {
  instancePromise = null;
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
  // Halt playback and rewind to the start so a later play begins from the top.
  stop: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  onStateChange: (
    cb: (state: Spotify.PlaybackState | null) => void,
  ) => () => void;
};

type Options = {
  deviceName?: string;
};

// useSpotifyPlayer attaches to the module-level Web Playback SDK singleton
// and exposes a small command surface. The hook does NOT auto-play anything;
// the caller decides when to call playTrack. State callbacks include the raw
// SDK PlaybackState so callers can read paused/position fields for sync.
export const useSpotifyPlayer = ({
  deviceName = "TaktScore",
}: Options = {}): SpotifyPlayerState => {
  const instanceRef = useRef<PlayerInstance | null>(null);
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
    let unsubscribe: (() => void) | null = null;

    void (async () => {
      try {
        const instance = await getOrCreatePlayer(deviceName);
        /* v8 ignore next -- unmount-during-load race */
        if (isCancelled) return;
        instanceRef.current = instance;

        // Mirror the live singleton state into local React state so a fresh
        // mount picks up where the previous one left off (already-ready,
        // already-playing) without waiting for the next SDK event.
        if (instance.isReady) setReady(true);
        if (instance.lastState) {
          setPlaying(!instance.lastState.paused);
          setPositionMs(instance.lastState.position);
          setDurationMs(instance.lastState.duration);
        }

        const onReady = () => setReady(true);
        const onNotReady = () => setReady(false);
        const onStateChange = (state: Spotify.PlaybackState | null) => {
          setPlaying(!!state && !state.paused);
          if (state) {
            setPositionMs(state.position);
            setDurationMs(state.duration);
          }
          for (const cb of stateListenersRef.current) cb(state);
        };
        const onError = (message: string) => setError(message);

        instance.readyListeners.add(onReady);
        instance.notReadyListeners.add(onNotReady);
        instance.stateChangeListeners.add(onStateChange);
        instance.errorListeners.add(onError);
        unsubscribe = () => {
          instance.readyListeners.delete(onReady);
          instance.notReadyListeners.delete(onNotReady);
          instance.stateChangeListeners.delete(onStateChange);
          instance.errorListeners.delete(onError);
        };
      } catch (e) {
        /* v8 ignore next -- guard against errors arriving after unmount */
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      isCancelled = true;
      unsubscribe?.();
      instanceRef.current = null;
      setReady(false);
      setPlaying(false);
    };
  }, [deviceName]);

  const playTrack = useCallback(async (trackUri: string) => {
    const instance = instanceRef.current;
    const deviceId = instance?.deviceId ?? null;
    if (!instance || !deviceId) throw new Error("Spotify device not ready");
    // Resume in place when the SDK already holds this track (e.g. it was
    // paused) so play does not restart it from the beginning. current_track
    // can be absent during ads or transitions, so guard the whole access chain.
    const state = await instance.player.getCurrentState();
    if (state?.track_window?.current_track?.uri === trackUri) {
      await instance.player.resume();
      return;
    }
    const token = await getValidAccessToken();
    if (!token) throw new Error("Spotify session expired");
    await startTrackPlayback(deviceId, trackUri, token);
  }, []);

  const pause = useCallback(async () => {
    await instanceRef.current?.player.pause();
  }, []);

  const resume = useCallback(async () => {
    await instanceRef.current?.player.resume();
  }, []);

  const stop = useCallback(async () => {
    await instanceRef.current?.player.pause();
    await instanceRef.current?.player.seek(0);
    setPositionMs(0);
  }, []);

  const seek = useCallback(async (toPositionMs: number) => {
    await instanceRef.current?.player.seek(toPositionMs);
    setPositionMs(toPositionMs);
  }, []);

  // player_state_changed does not fire as playback advances, so poll the
  // current position while playing to keep the progress bar moving.
  useEffect(() => {
    if (!isPlaying) return;
    // getCurrentState() can resolve after the interval is cleared (unmount or
    // pause), so drop late results to avoid the progress bar jumping back.
    let isCancelled = false;
    const intervalId = setInterval(() => {
      void (async () => {
        const state = await instanceRef.current?.player.getCurrentState();
        if (isCancelled || !state) return;
        setPositionMs(state.position);
        setDurationMs(state.duration);
      })();
    }, 500);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
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
    stop,
    seek,
    onStateChange,
  };
};

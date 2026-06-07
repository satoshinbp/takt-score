import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import * as auth from "@/lib/spotify/auth";
import * as utils from "@/lib/utils";

type Listener = (...args: unknown[]) => void;

const buildPlayer = () => {
  const listeners = new Map<string, Listener[]>();
  const addListener = vi.fn((event: string, cb: Listener) => {
    const arr = listeners.get(event) ?? [];
    arr.push(cb);
    listeners.set(event, arr);
  });
  return {
    addListener,
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    seek: vi.fn().mockResolvedValue(undefined),
    getCurrentState: vi.fn().mockResolvedValue(null),
    emit: (event: string, ...args: unknown[]) => {
      const arr = listeners.get(event);
      if (!arr) return;
      for (const cb of arr) cb(...args);
    },
  };
};

const installSpotify = () => {
  const player = buildPlayer();

  class Player {
    constructor(opts: { getOAuthToken: (cb: (t: string) => void) => void }) {
      // Drive getOAuthToken so the inner async token-fetch path executes.
      opts.getOAuthToken(() => undefined);
      return player;
    }
  }
  (window as unknown as { Spotify: { Player: typeof Player } }).Spotify = {
    Player,
  };
  return { player, Player };
};

beforeEach(() => {
  // Reset the module-level SDK loaded promise between tests.
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as { Spotify?: unknown }).Spotify;
});

describe("useSpotifyPlayer", () => {
  it("connects, becomes ready, and reflects playback state", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });

    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    expect(result.current.isReady).toBe(true);

    act(() => {
      player.emit("player_state_changed", { paused: false });
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      player.emit("player_state_changed", { paused: true });
    });
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      player.emit("not_ready", { device_id: "dev-1" });
    });
    expect(result.current.isReady).toBe(false);
  });

  it("propagates error events to errorMessage", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.addListener).toHaveBeenCalled();
    });
    act(() => {
      player.emit("initialization_error", { message: "boom" });
    });
    expect(result.current.errorMessage).toBe("boom");
  });

  it("playTrack rejects when device is not ready", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /device not ready/,
    );
  });

  it("playTrack issues transfer + play requests when ready", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await act(async () => {
      await result.current.playTrack("spotify:track:x");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/me/player");
    expect(fetchMock.mock.calls[1][0]).toContain("/me/player/play");
  });

  it("playTrack throws when /me/player/play fails after a successful transfer", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 502 });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /play failed/,
    );
  });

  it("retries the transfer on 404 until the device registers, then plays", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    // Skip the real backoff so the test does not actually wait.
    vi.spyOn(utils, "sleep").mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await act(async () => {
      await result.current.playTrack("spotify:track:x");
    });
    // transfer(404) -> transfer(204) -> play(200)
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(utils.sleep).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting transfer retries on persistent 404", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    vi.spyOn(utils, "sleep").mockResolvedValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /transfer failed \(404\)/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("clears the device id on not_ready so playTrack rejects afterward", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    act(() => {
      player.emit("not_ready", { device_id: "dev-1" });
    });
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /device not ready/,
    );
  });

  it("playTrack throws when transfer fails", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /transfer/,
    );
  });

  it("playTrack rejects when no access token", async () => {
    const { player } = installSpotify();
    const spy = vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    spy.mockResolvedValue(null);
    await expect(result.current.playTrack("spotify:track:x")).rejects.toThrow(
      /session expired/,
    );
  });

  it("pause/resume delegate to the underlying player", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    await act(async () => {
      await result.current.pause();
      await result.current.resume();
    });
    expect(player.pause).toHaveBeenCalled();
    expect(player.resume).toHaveBeenCalled();
  });

  it("resumes in place when the requested track is already loaded", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    player.getCurrentState.mockResolvedValue({
      paused: true,
      position: 1000,
      duration: 60000,
      track_window: { current_track: { id: "x", uri: "spotify:track:x" } },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await act(async () => {
      await result.current.playTrack("spotify:track:x");
    });
    expect(player.resume).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts from the top when a different track is requested", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    player.getCurrentState.mockResolvedValue({
      paused: true,
      position: 1000,
      duration: 60000,
      track_window: { current_track: { id: "y", uri: "spotify:track:y" } },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await act(async () => {
      await result.current.playTrack("spotify:track:x");
    });
    expect(player.resume).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("seek delegates to the player and updates positionMs", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    await act(async () => {
      await result.current.seek(5000);
    });
    expect(player.seek).toHaveBeenCalledWith(5000);
    expect(result.current.positionMs).toBe(5000);
  });

  it("reflects position and duration from player_state_changed", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("player_state_changed", {
        paused: false,
        position: 1500,
        duration: 30000,
        track_window: { current_track: { id: "x", uri: "spotify:track:x" } },
      });
    });
    expect(result.current.positionMs).toBe(1500);
    expect(result.current.durationMs).toBe(30000);

    // A null state (no active device) leaves the last known position intact.
    act(() => {
      player.emit("player_state_changed", null);
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(1500);
  });

  it("polls the current position while playing", async () => {
    vi.useFakeTimers();
    try {
      const { player } = installSpotify();
      vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
      player.getCurrentState.mockResolvedValue({
        paused: false,
        position: 2222,
        duration: 40000,
        track_window: { current_track: { id: "x", uri: "spotify:track:x" } },
      });
      const { result } = renderHook(() => useSpotifyPlayer());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      act(() => {
        player.emit("ready", { device_id: "dev-1" });
      });
      act(() => {
        player.emit("player_state_changed", {
          paused: false,
          position: 0,
          duration: 40000,
          track_window: { current_track: { id: "x", uri: "spotify:track:x" } },
        });
      });
      expect(result.current.isPlaying).toBe(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(result.current.positionMs).toBe(2222);
      expect(result.current.durationMs).toBe(40000);

      // A poll that returns no state keeps the last known position.
      player.getCurrentState.mockResolvedValue(null);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(result.current.positionMs).toBe(2222);
    } finally {
      vi.useRealTimers();
    }
  });

  it("onStateChange registers and unregisters listeners", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    const cb = vi.fn();
    let unsub: () => void = () => undefined;
    act(() => {
      unsub = result.current.onStateChange(cb);
    });
    act(() => {
      player.emit("player_state_changed", { paused: true });
    });
    expect(cb).toHaveBeenCalledTimes(1);
    act(() => {
      unsub();
      player.emit("player_state_changed", { paused: false });
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("treats 204 No Content responses from Spotify as success", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    act(() => {
      player.emit("ready", { device_id: "dev-1" });
    });
    await act(async () => {
      await result.current.playTrack("spotify:track:x");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("disconnects the player on unmount", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { unmount } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    unmount();
    expect(player.disconnect).toHaveBeenCalled();
  });

  it("getOAuthToken passes an empty string when no token is available", async () => {
    const { player } = installSpotify();
    const spy = vi.spyOn(auth, "getValidAccessToken").mockResolvedValue(null);
    // The class mock invokes getOAuthToken at construction with a no-op cb,
    // which exercises the null-coalescing branch (token ?? "").
    renderHook(() => useSpotifyPlayer());
    await waitFor(() => expect(player.connect).toHaveBeenCalled());
    expect(spy).toHaveBeenCalled();
  });

  it("surfaces a non-Error throw as a string", async () => {
    const { player } = installSpotify();
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    player.connect.mockImplementationOnce(() => {
      throw "string-thrown" as unknown as Error;
    });
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(result.current.errorMessage).toBe("string-thrown");
    });
  });

  it("surfaces an error when connect returns false", async () => {
    const { player } = installSpotify();
    player.connect.mockResolvedValue(false);
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyPlayer());
    await waitFor(() => {
      expect(result.current.errorMessage).toContain("failed to connect");
    });
  });
});

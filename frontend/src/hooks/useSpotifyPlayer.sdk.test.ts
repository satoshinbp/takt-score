import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as auth from "@/lib/spotify/auth";

// This file is intentionally separate from useSpotifyPlayer.test.ts so it gets
// its own fresh module instance with sdkReadyPromise = null.

beforeEach(() => {
  delete (window as { Spotify?: unknown }).Spotify;
  delete (window as { onSpotifyWebPlaybackSDKReady?: unknown })
    .onSpotifyWebPlaybackSDKReady;
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Capture script tags before happy-dom tries to fetch them (it refuses remote scripts).
const captureScripts = (): HTMLScriptElement[] => {
  const captured: HTMLScriptElement[] = [];
  vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
    captured.push(node as HTMLScriptElement);
    return node;
  });
  return captured;
};

describe("useSpotifyPlayer SDK loading", () => {
  it("injects the SDK script when window.Spotify is missing", async () => {
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const scripts = captureScripts();

    const { useSpotifyPlayer } = await import("@/hooks/useSpotifyPlayer");
    const { result } = renderHook(() => useSpotifyPlayer());

    const win = window as unknown as {
      onSpotifyWebPlaybackSDKReady?: () => void;
      Spotify?: unknown;
    };
    await waitFor(() => {
      expect(scripts.length).toBeGreaterThan(0);
      expect(win.onSpotifyWebPlaybackSDKReady).toBeTruthy();
    });

    const player = {
      addListener: vi.fn(),
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    };

    class FakePlayer {
      constructor() {
        return player;
      }
    }
    win.Spotify = { Player: FakePlayer };

    act(() => {
      win.onSpotifyWebPlaybackSDKReady!();
    });
    await waitFor(() => {
      expect(player.connect).toHaveBeenCalled();
    });
    expect(result.current.errorMessage).toBeNull();
  });

});

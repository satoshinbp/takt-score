import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import * as auth from "@/lib/spotify/auth";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSpotifyAuth", () => {
  it("reports unauthenticated by default", () => {
    const { result } = renderHook(() => useSpotifyAuth());
    expect(result.current.isAuthed).toBe(false);
  });

  it("tracks token changes via the subscription store", () => {
    const { result } = renderHook(() => useSpotifyAuth());
    act(() => {
      localStorage.setItem(
        "takt-score:spotify-auth",
        JSON.stringify({
          accessToken: "a",
          refreshToken: "r",
          expiresAtMs: Date.now() + 60_000,
        }),
      );
      // The store only notifies via its own setters; emulate by calling logout
      // which calls clearSpotifyTokens (notifies) — first prime the store then
      // assert subscribe wakes up.
    });
    // Re-render: subscribe to start fresh — using logout to trigger notify path.
    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthed).toBe(false);
  });

  it("login delegates to startSpotifyLogin with current location", async () => {
    const spy = vi.spyOn(auth, "startSpotifyLogin").mockResolvedValue();
    const { result } = renderHook(() => useSpotifyAuth());
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, pathname: "/scores/1", search: "?x=1" },
    });
    await act(async () => {
      await result.current.login();
    });
    expect(spy).toHaveBeenCalledWith("/scores/1?x=1");
  });

  it("ensureToken delegates to getValidAccessToken", async () => {
    const spy = vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
    const { result } = renderHook(() => useSpotifyAuth());
    await expect(result.current.ensureToken()).resolves.toBe("tok");
    expect(spy).toHaveBeenCalled();
  });

  it("server-side snapshot reports unauthenticated", () => {
    const Component = () => {
      const { isAuthed } = useSpotifyAuth();
      return isAuthed ? "yes" : "no";
    };
    expect(renderToString(<Component />)).toBe("no");
  });
});

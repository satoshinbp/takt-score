import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSpotifyTokens,
  completeSpotifyLogin,
  consumeReturnTo,
  getValidAccessToken,
  hasSpotifySession,
  startSpotifyLogin,
  subscribeSpotifyAuth,
} from "@/lib/spotify/auth";

const STORAGE_KEY = "takt-score:spotify-auth";
const VERIFIER_KEY = "takt-score:spotify-verifier";
const STATE_KEY = "takt-score:spotify-state";
const RETURN_TO_KEY = "takt-score:spotify-return-to";

const setTokens = (overrides: Partial<Record<string, unknown>> = {}) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: "atk",
      refreshToken: "rtk",
      expiresAtMs: Date.now() + 60_000_000,
      ...overrides,
    }),
  );
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("hasSpotifySession", () => {
  it("returns false when nothing is stored", () => {
    expect(hasSpotifySession()).toBe(false);
  });

  it("returns true when tokens are stored", () => {
    setTokens();
    expect(hasSpotifySession()).toBe(true);
  });

  it("returns false on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(hasSpotifySession()).toBe(false);
  });

  it("returns false when stored shape is invalid", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: 42 }));
    expect(hasSpotifySession()).toBe(false);
  });

  it("returns false when window is undefined (SSR)", () => {
    setTokens();
    vi.stubGlobal("window", undefined);
    expect(hasSpotifySession()).toBe(false);
  });
});

describe("subscribeSpotifyAuth", () => {
  it("fires on clear and stops after unsubscribe", () => {
    setTokens();
    const cb = vi.fn();
    const unsub = subscribeSpotifyAuth(cb);
    clearSpotifyTokens();
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    setTokens();
    clearSpotifyTokens();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe("clearSpotifyTokens", () => {
  it("removes auth + verifier + state", () => {
    setTokens();
    sessionStorage.setItem(VERIFIER_KEY, "v");
    sessionStorage.setItem(STATE_KEY, "s");
    clearSpotifyTokens();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(VERIFIER_KEY)).toBeNull();
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });
});

describe("consumeReturnTo", () => {
  it("returns the stored value and removes it", () => {
    localStorage.setItem(RETURN_TO_KEY, "/scores/1");
    expect(consumeReturnTo()).toBe("/scores/1");
    expect(localStorage.getItem(RETURN_TO_KEY)).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(consumeReturnTo()).toBeNull();
  });
});

describe("startSpotifyLogin", () => {
  it("throws when client id is not configured", async () => {
    await expect(startSpotifyLogin("/foo")).rejects.toThrow(
      /NEXT_PUBLIC_SPOTIFY_CLIENT_ID/,
    );
  });

  it("redirects to the authorize URL with PKCE params", async () => {
    vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "cid");
    // Re-import to pick up the new env value.
    vi.resetModules();
    const mod = await import("@/lib/spotify/auth");

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign, origin: "https://app.test" },
    });

    await mod.startSpotifyLogin("/return");

    expect(assign).toHaveBeenCalledOnce();
    const url = assign.mock.calls[0][0] as string;
    expect(url).toContain("https://accounts.spotify.com/authorize?");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain("response_type=code");
    expect(sessionStorage.getItem(VERIFIER_KEY)).toBeTruthy();
    expect(sessionStorage.getItem(STATE_KEY)).toBeTruthy();
    expect(localStorage.getItem(RETURN_TO_KEY)).toBe("/return");
  });
});

describe("completeSpotifyLogin", () => {
  it("throws on state mismatch and clears verifier/state", async () => {
    sessionStorage.setItem(STATE_KEY, "expected");
    sessionStorage.setItem(VERIFIER_KEY, "v");
    await expect(completeSpotifyLogin("code", "bad")).rejects.toThrow(
      /state mismatch/,
    );
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
    expect(sessionStorage.getItem(VERIFIER_KEY)).toBeNull();
  });

  it("throws when verifier is missing", async () => {
    sessionStorage.setItem(STATE_KEY, "s");
    await expect(completeSpotifyLogin("code", "s")).rejects.toThrow(
      /verifier missing/,
    );
  });

  it("stores tokens on successful exchange", async () => {
    sessionStorage.setItem(STATE_KEY, "s");
    sessionStorage.setItem(VERIFIER_KEY, "v");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "atk",
            refresh_token: "rtk",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "",
          }),
      }),
    );
    await completeSpotifyLogin("code", "s");
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect((JSON.parse(raw!) as { accessToken: string }).accessToken).toBe(
      "atk",
    );
  });

  it("throws when the exchange fails", async () => {
    sessionStorage.setItem(STATE_KEY, "s");
    sessionStorage.setItem(VERIFIER_KEY, "v");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400 }),
    );
    await expect(completeSpotifyLogin("code", "s")).rejects.toThrow(/400/);
  });

  it("falls back to empty refresh token when omitted by Spotify", async () => {
    sessionStorage.setItem(STATE_KEY, "s");
    sessionStorage.setItem(VERIFIER_KEY, "v");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "atk",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "",
          }),
      }),
    );
    await completeSpotifyLogin("code", "s");
    expect(
      (
        JSON.parse(localStorage.getItem(STORAGE_KEY)!) as {
          refreshToken: string;
        }
      ).refreshToken,
    ).toBe("");
  });
});

describe("getValidAccessToken", () => {
  it("returns null when nothing stored", async () => {
    expect(await getValidAccessToken()).toBeNull();
  });

  it("returns the stored token when still valid", async () => {
    setTokens();
    expect(await getValidAccessToken()).toBe("atk");
  });

  it("refreshes when expired and returns the new token", async () => {
    setTokens({ expiresAtMs: Date.now() - 1000 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new",
            refresh_token: "newr",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "",
          }),
      }),
    );
    expect(await getValidAccessToken()).toBe("new");
    expect(
      (
        JSON.parse(localStorage.getItem(STORAGE_KEY)!) as {
          refreshToken: string;
        }
      ).refreshToken,
    ).toBe("newr");
  });

  it("keeps the old refresh token when Spotify omits it", async () => {
    setTokens({ expiresAtMs: Date.now() - 1000, refreshToken: "rtk-old" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "",
          }),
      }),
    );
    await getValidAccessToken();
    expect(
      (
        JSON.parse(localStorage.getItem(STORAGE_KEY)!) as {
          refreshToken: string;
        }
      ).refreshToken,
    ).toBe("rtk-old");
  });

  it("clears tokens and returns null when refresh fails", async () => {
    setTokens({ expiresAtMs: Date.now() - 1000 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    expect(await getValidAccessToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null when expired and no refresh token", async () => {
    setTokens({ expiresAtMs: Date.now() - 1000, refreshToken: "" });
    expect(await getValidAccessToken()).toBeNull();
  });
});

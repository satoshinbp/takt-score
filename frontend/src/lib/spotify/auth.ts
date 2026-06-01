// Spotify Authorization Code with PKCE flow for SPAs. Tokens are stored in
// localStorage so they survive page reloads; the refresh token is rotated on
// every refresh per Spotify's spec.
//
// Security note: access and refresh tokens in localStorage are reachable from
// any script that runs on this origin and are therefore exposed to XSS. This
// is the standard SPA OAuth tradeoff; tightening it would require a backend
// session or an httpOnly cookie proxy. Short-lived per-login secrets (PKCE
// verifier, OAuth state) live in sessionStorage instead so they cannot leak
// across tabs and are discarded as soon as the tab closes.

import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_SCOPES,
  spotifyRedirectUri,
} from "@/lib/spotify/config";

const STORAGE_KEY = "takt-score:spotify-auth";
const VERIFIER_KEY = "takt-score:spotify-verifier";
const STATE_KEY = "takt-score:spotify-state";
const RETURN_TO_KEY = "takt-score:spotify-return-to";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

// Refresh slightly before actual expiry so a request that fires right at the
// boundary still has a valid token.
const REFRESH_SKEW_SEC = 60;

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const randomVerifier = (): string => {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

// OAuth state is a per-flow nonce echoed back on the callback. Comparing the
// stored value against the returned one closes the CSRF gap that PKCE alone
// does not cover (RFC 6749 §10.12).
const randomState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

const sha256 = async (input: string): Promise<Uint8Array> => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
};

const loadStoredTokens = (): SpotifyTokens | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SpotifyTokens;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.expiresAtMs !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const storeTokens = (tokens: SpotifyTokens): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  notify();
};

// Subscribers fire whenever the in-memory or stored tokens change (login,
// logout, refresh). Used by useSpotifyAuth to drive React state without
// polling.
const subscribers = new Set<() => void>();
const notify = () => {
  for (const cb of subscribers) cb();
};

export const subscribeSpotifyAuth = (cb: () => void): (() => void) => {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
};

export const clearSpotifyTokens = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  notify();
};

// Kicks off the PKCE flow. Stores the verifier so the callback can complete it,
// and remembers where to return after auth so the user lands back on the same
// page.
export const startSpotifyLogin = async (returnTo: string): Promise<void> => {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error(
      "NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set; Spotify integration is disabled.",
    );
  }
  const verifier = randomVerifier();
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomState();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  localStorage.setItem(RETURN_TO_KEY, returnTo);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: spotifyRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES,
    state,
  });
  window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
};

export const consumeReturnTo = (): string | null => {
  const v = localStorage.getItem(RETURN_TO_KEY);
  if (v) localStorage.removeItem(RETURN_TO_KEY);
  return v;
};

const exchangeCodeForTokens = async (
  code: string,
  verifier: string,
): Promise<SpotifyTokens> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: spotifyRedirectUri(),
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed (${res.status})`);
  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresAtMs: Date.now() + data.expires_in * 1000,
  };
};

// Called by the OAuth callback route to finalize the flow. The state arg comes
// from the redirect URL and is compared against the value stashed before the
// authorize redirect — a mismatch means the callback didn't originate from our
// own startSpotifyLogin, so we refuse the exchange.
export const completeSpotifyLogin = async (
  code: string,
  state: string | null,
): Promise<void> => {
  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!expectedState || expectedState !== state) {
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    throw new Error("Spotify auth state mismatch");
  }
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Spotify auth verifier missing");
  const tokens = await exchangeCodeForTokens(code, verifier);
  storeTokens(tokens);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
};

const refreshTokens = async (refreshToken: string): Promise<SpotifyTokens> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed (${res.status})`);
  const data = (await res.json()) as TokenResponse;
  // Spotify may rotate the refresh token; fall back to the previous one if not.
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAtMs: Date.now() + data.expires_in * 1000,
  };
};

// Returns a valid access token, refreshing if the stored one is close to
// expiring. Returns null when the user has not logged in or the refresh fails;
// callers should prompt for re-login in that case.
export const getValidAccessToken = async (): Promise<string | null> => {
  const stored = loadStoredTokens();
  if (!stored) return null;
  if (Date.now() < stored.expiresAtMs - REFRESH_SKEW_SEC * 1000) {
    return stored.accessToken;
  }
  if (!stored.refreshToken) return null;
  try {
    const refreshed = await refreshTokens(stored.refreshToken);
    storeTokens(refreshed);
    return refreshed.accessToken;
  } catch {
    clearSpotifyTokens();
    return null;
  }
};

export const hasSpotifySession = (): boolean => loadStoredTokens() !== null;

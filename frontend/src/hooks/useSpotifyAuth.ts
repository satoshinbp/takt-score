"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  clearSpotifyTokens,
  getValidAccessToken,
  hasSpotifySession,
  startSpotifyLogin,
  subscribeSpotifyAuth,
} from "@/lib/spotify/auth";

const getAuthSnapshot = (): boolean => hasSpotifySession();
const getServerAuthSnapshot = (): boolean => false;

// useSpotifyAuth surfaces the bare minimum auth state to UI: are we logged in
// right now, and an action that kicks off the login flow with the current URL
// as the post-auth return target.
export const useSpotifyAuth = () => {
  const isAuthed = useSyncExternalStore(
    subscribeSpotifyAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const login = useCallback(async () => {
    const returnTo = window.location.pathname + window.location.search;
    await startSpotifyLogin(returnTo);
  }, []);

  const logout = useCallback(() => {
    clearSpotifyTokens();
  }, []);

  // Lazily verify the session is still healthy when callers need a token. The
  // refresh path inside getValidAccessToken updates storage and notifies
  // subscribers, so isAuthed will track the result without manual setState.
  const ensureToken = useCallback(() => getValidAccessToken(), []);

  return { isAuthed, login, logout, ensureToken };
};

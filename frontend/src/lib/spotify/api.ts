// Thin wrapper over the Spotify Web API endpoints we need: track search and
// per-track lookup. Every call goes through getValidAccessToken so callers
// don't have to handle refresh themselves.

import { getValidAccessToken } from "@/lib/spotify/auth";

const API_BASE = "https://api.spotify.com/v1";

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  albumImageUrl: string | null;
  durationMs: number;
  uri: string;
};

type SpotifyTrackResponse = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string; width: number; height: number }[] };
  duration_ms: number;
  uri: string;
};

type SpotifySearchResponse = {
  tracks: { items: SpotifyTrackResponse[] };
};

const parseTrack = (t: SpotifyTrackResponse): SpotifyTrack => ({
  id: t.id,
  name: t.name,
  artists: t.artists.map((a) => a.name),
  // Spotify returns images largest first; the smallest one is fine for thumbs.
  albumImageUrl: t.album.images.at(-1)?.url ?? null,
  durationMs: t.duration_ms,
  uri: t.uri,
});

const fetchWithToken = async (path: string): Promise<Response> => {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Spotify session expired");
  return fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const params = new URLSearchParams({
    q: trimmed,
    type: "track",
  });
  const res = await fetchWithToken(`/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Spotify search failed (${res.status})`);
  const data = (await res.json()) as SpotifySearchResponse;
  return data.tracks.items.map(parseTrack);
};

export const getTrack = async (trackId: string): Promise<SpotifyTrack> => {
  const res = await fetchWithToken(`/tracks/${trackId}`);
  if (!res.ok) throw new Error(`Spotify track lookup failed (${res.status})`);
  return parseTrack((await res.json()) as SpotifyTrackResponse);
};

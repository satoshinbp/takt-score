// Thin wrapper over the Spotify Web API endpoints we need: track search,
// per-track lookup, and audio-features (for BPM). Every call goes through
// getValidAccessToken so callers don't have to handle refresh themselves.

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

export type SpotifyAudioFeatures = {
  tempo: number;
  timeSignature: number;
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

type AudioFeaturesResponse = {
  tempo: number;
  time_signature: number;
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

// audio-features is deprecated for new Spotify apps as of late 2024 — apps
// without extended access will see 403. Callers must handle null and fall back
// to the score's own bpm.
export const getAudioFeatures = async (
  trackId: string,
): Promise<SpotifyAudioFeatures | null> => {
  const res = await fetchWithToken(`/audio-features/${trackId}`);
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Spotify audio-features failed (${res.status})`);
  }
  const data = (await res.json()) as AudioFeaturesResponse;
  return { tempo: data.tempo, timeSignature: data.time_signature };
};

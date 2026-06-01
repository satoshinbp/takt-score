// Spotify integration runtime config. Client ID is exposed to the browser; the
// PKCE flow makes that safe. Redirect URI must match a URI registered on the
// Spotify developer dashboard exactly (scheme + host + port + path).

export const SPOTIFY_CLIENT_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

export const SPOTIFY_REDIRECT_PATH = "/spotify/callback";

export const spotifyRedirectUri = (): string =>
  `${window.location.origin}${SPOTIFY_REDIRECT_PATH}`;

// streaming + read-private are required by the Web Playback SDK to register a
// device and play. user-read-email is required by the SDK on init. The search
// endpoint is included in the user-grant default and needs no extra scope.
export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

export const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/;

// Parse a Spotify track ID out of either a bare ID, a spotify:track:ID URI, or
// an https://open.spotify.com/track/ID URL (with optional query). Returns null
// when the input does not name a track.
export const parseSpotifyTrackId = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const directMatch = trimmed.match(SPOTIFY_TRACK_ID_PATTERN);
  if (directMatch) return directMatch[0];

  const uriMatch = trimmed.match(/^spotify:track:([A-Za-z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  const urlMatch = trimmed.match(
    /open\.spotify\.com\/track\/([A-Za-z0-9]{22})/,
  );
  if (urlMatch) return urlMatch[1];

  return null;
};

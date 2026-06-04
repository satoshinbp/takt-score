import { describe, expect, it } from "vitest";
import {
  parseSpotifyTrackId,
  SPOTIFY_REDIRECT_PATH,
  SPOTIFY_SCOPES,
  SPOTIFY_TRACK_ID_PATTERN,
  spotifyRedirectUri,
} from "@/lib/spotify/config";

describe("SPOTIFY_TRACK_ID_PATTERN", () => {
  it("matches 22-char alphanumeric ids", () => {
    expect(SPOTIFY_TRACK_ID_PATTERN.test("0123456789abcdefghijkl")).toBe(true);
  });

  it("rejects shorter or longer ids", () => {
    expect(SPOTIFY_TRACK_ID_PATTERN.test("short")).toBe(false);
  });
});

describe("SPOTIFY_SCOPES", () => {
  it("includes the scopes required by the Web Playback SDK", () => {
    expect(SPOTIFY_SCOPES).toContain("streaming");
    expect(SPOTIFY_SCOPES).toContain("user-read-email");
    expect(SPOTIFY_SCOPES).toContain("user-modify-playback-state");
  });
});

describe("spotifyRedirectUri", () => {
  it("derives the URI from window.location.origin", () => {
    expect(spotifyRedirectUri()).toBe(
      `${window.location.origin}${SPOTIFY_REDIRECT_PATH}`,
    );
  });
});

describe("parseSpotifyTrackId", () => {
  const id = "0123456789abcdefghijkl";

  it("returns null for empty input", () => {
    expect(parseSpotifyTrackId("")).toBeNull();
    expect(parseSpotifyTrackId("   ")).toBeNull();
  });

  it("extracts a bare id", () => {
    expect(parseSpotifyTrackId(id)).toBe(id);
  });

  it("extracts from a spotify:track:ID URI", () => {
    expect(parseSpotifyTrackId(`spotify:track:${id}`)).toBe(id);
  });

  it("extracts from an https URL", () => {
    expect(
      parseSpotifyTrackId(`https://open.spotify.com/track/${id}?si=xxx`),
    ).toBe(id);
  });

  it("returns null for an unrecognized string", () => {
    expect(parseSpotifyTrackId("not a spotify thing")).toBeNull();
  });
});

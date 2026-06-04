import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTrack, searchTracks } from "@/lib/spotify/api";
import * as auth from "@/lib/spotify/auth";

const trackResponse = {
  id: "abc",
  name: "Song",
  artists: [{ name: "A1" }, { name: "A2" }],
  album: {
    images: [
      { url: "big.jpg", width: 640, height: 640 },
      { url: "small.jpg", width: 64, height: 64 },
    ],
  },
  duration_ms: 120000,
  uri: "spotify:track:abc",
};

beforeEach(() => {
  vi.spyOn(auth, "getValidAccessToken").mockResolvedValue("tok");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("searchTracks", () => {
  it("returns [] for empty input", async () => {
    expect(await searchTracks("  ")).toEqual([]);
  });

  it("calls /search with from_token market and parses tracks", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tracks: { items: [trackResponse] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchTracks("hello");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: { Authorization: string } },
    ];
    expect(url).toContain("/v1/search?");
    expect(url).toContain("market=from_token");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(result).toEqual([
      {
        id: "abc",
        name: "Song",
        artists: ["A1", "A2"],
        albumImageUrl: "small.jpg",
        durationMs: 120000,
        uri: "spotify:track:abc",
      },
    ]);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(searchTracks("x")).rejects.toThrow(/500/);
  });

  it("throws when there is no access token", async () => {
    vi.spyOn(auth, "getValidAccessToken").mockResolvedValue(null);
    await expect(searchTracks("x")).rejects.toThrow(/session expired/);
  });

  it("returns null albumImageUrl when no images", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tracks: {
              items: [{ ...trackResponse, album: { images: [] } }],
            },
          }),
      }),
    );
    const [t] = await searchTracks("x");
    expect(t.albumImageUrl).toBeNull();
  });
});

describe("getTrack", () => {
  it("calls /tracks/{id} and parses the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(trackResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    const t = await getTrack("abc");
    expect(fetchMock.mock.calls[0][0]).toContain("/v1/tracks/abc");
    expect(t.id).toBe("abc");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    await expect(getTrack("abc")).rejects.toThrow(/404/);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("music-tempo", () => ({
  default: class {
    tempo = 123.6;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("detectBpm", () => {
  it("decodes audio, runs MusicTempo, and returns a rounded BPM", async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const decodeAudioData = vi.fn().mockResolvedValue({
      getChannelData: () => new Float32Array(1024),
    });

    class FakeAudioContext {
      decodeAudioData = decodeAudioData;
      close = close;
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);

    const { detectBpm } = await import("@/lib/detect-bpm");

    const file = {
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as File;
    const bpm = await detectBpm(file);

    expect(decodeAudioData).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(bpm).toBe(124);
  });
});

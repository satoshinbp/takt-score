import { describe, expect, it, vi } from "vitest";
import { SOUNDS } from "@/lib/audio";

type SpyCtx = {
  ctx: AudioContext;
  sources: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }[];
  oscs: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    frequency: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    type: OscillatorType;
  }[];
  bufferCalls: [number, number, number][];
};

const createCtx = (sampleRate = 44100): SpyCtx => {
  const sources: SpyCtx["sources"] = [];
  const oscs: SpyCtx["oscs"] = [];
  const bufferCalls: SpyCtx["bufferCalls"] = [];

  const makeParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });

  const ctx = {
    currentTime: 0,
    destination: {},
    sampleRate,
    createBuffer: (channels: number, len: number, rate: number) => {
      bufferCalls.push([channels, len, rate]);
      return { getChannelData: () => new Float32Array(len) };
    },
    createBufferSource: () => {
      const node = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      sources.push(node);
      return node;
    },
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: makeParam(),
      Q: makeParam(),
      connect: vi.fn(),
    }),
    createGain: () => ({ gain: makeParam(), connect: vi.fn() }),
    createOscillator: () => {
      const osc = {
        type: "sine" as OscillatorType,
        frequency: makeParam(),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscs.push(osc);
      return osc;
    },
  } as unknown as AudioContext;

  return { ctx, sources, oscs, bufferCalls };
};

describe("SOUNDS", () => {
  it.each(Object.keys(SOUNDS))("%s plays without throwing", (id) => {
    const { ctx } = createCtx();
    SOUNDS[id]!(ctx, 0, 1);
  });

  it("caches the noise buffer per (sampleRate, duration)", () => {
    const { ctx, bufferCalls } = createCtx();
    SOUNDS.HH!(ctx, 0, 1); // 0.052s
    const firstCount = bufferCalls.length;
    SOUNDS.HH!(ctx, 1, 1); // same params → cached
    expect(bufferCalls.length).toBe(firstCount);
  });

  it("creates a new buffer when the duration differs", () => {
    const { ctx, bufferCalls } = createCtx(48000); // distinct sample rate, fresh cache key
    SOUNDS.HH!(ctx, 0, 1); // 0.052
    SOUNDS.HH_OPEN!(ctx, 0, 1); // 0.32
    expect(bufferCalls.length).toBeGreaterThanOrEqual(2);
  });
});

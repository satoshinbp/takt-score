import { describe, expect, it, vi } from "vitest";
import { playClick } from "@/lib/metronome-audio";

const createCtx = () => {
  const makeParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const osc = {
    type: "sine" as OscillatorType,
    frequency: makeParam(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = { gain: makeParam(), connect: vi.fn() };
  const ctx = {
    currentTime: 0,
    destination: {},
    createOscillator: () => osc,
    createGain: () => gain,
  } as unknown as AudioContext;
  return { ctx, osc, gain };
};

describe("playClick", () => {
  it("uses triangle wave + frequency ramp on accents", () => {
    const { ctx, osc } = createCtx();
    playClick(ctx, 0, true);
    expect(osc.type).toBe("triangle");
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(osc.start).toHaveBeenCalledWith(0);
  });

  it("uses square wave without frequency ramp on non-accent", () => {
    const { ctx, osc } = createCtx();
    playClick(ctx, 0, false);
    expect(osc.type).toBe("square");
    expect(osc.frequency.exponentialRampToValueAtTime).not.toHaveBeenCalled();
  });

  it("scales the peak gain by the gain argument", () => {
    const { ctx, gain } = createCtx();
    playClick(ctx, 0, true, 0.5);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.55 * 0.5,
      expect.any(Number),
    );
  });
});

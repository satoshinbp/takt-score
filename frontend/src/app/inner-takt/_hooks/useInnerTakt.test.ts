import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InnerTaktConfig } from "./useBeatScheduler";
import { useInnerTakt } from "./useInnerTakt";

// The sub-hooks are unit-tested separately; here they are mocked so the
// composite's orchestration and cycle-progress math can be driven directly.
const scheduler = { start: vi.fn(), stop: vi.fn(), refs: {} };
const visual = { currentBeat: -1, beatIndex: 0, fadeAmount: 1, reset: vi.fn() };
const tap = { taps: [], recordTap: vi.fn(), resetTaps: vi.fn() };

vi.mock("./useBeatScheduler", () => ({
  useBeatScheduler: () => scheduler,
}));
vi.mock("./useVisualBeat", () => ({
  useVisualBeat: () => visual,
}));
vi.mock("./useTapRecorder", () => ({
  useTapRecorder: () => tap,
}));

const config: InnerTaktConfig = {
  bpm: 120,
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 1,
  silentBars: 1,
  fadeBeats: 0,
};

beforeEach(() => {
  visual.currentBeat = -1;
  visual.beatIndex = 0;
  visual.fadeAmount = 1;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useInnerTakt", () => {
  it("starts stopped with no cycle progress", () => {
    const { result } = renderHook(() => useInnerTakt(config));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleProgress).toBeNull();
    expect(result.current.isSilent).toBe(false);
  });

  it("start drives the sub-hooks and flips isRunning", () => {
    const { result } = renderHook(() => useInnerTakt(config));
    act(() => {
      result.current.start();
    });
    expect(scheduler.start).toHaveBeenCalled();
    expect(visual.reset).toHaveBeenCalled();
    expect(tap.resetTaps).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(true);
  });

  it("reports audible cycle progress while in the audible section", () => {
    visual.beatIndex = 2;
    const { result } = renderHook(() => useInnerTakt(config));
    act(() => {
      result.current.start();
    });
    expect(result.current.isSilent).toBe(false);
    expect(result.current.cycleProgress).toEqual({
      isAudible: true,
      pos: 2,
      total: 4,
    });
  });

  it("reports silent cycle progress while in the silent section", () => {
    visual.beatIndex = 5;
    const { result } = renderHook(() => useInnerTakt(config));
    act(() => {
      result.current.start();
    });
    expect(result.current.isSilent).toBe(true);
    expect(result.current.cycleProgress).toEqual({
      isAudible: false,
      pos: 1,
      total: 4,
    });
  });

  it("normalizes negative beat indices into the cycle", () => {
    visual.beatIndex = -1;
    const { result } = renderHook(() => useInnerTakt(config));
    act(() => {
      result.current.start();
    });
    // -1 wraps to position 7, which lands in the silent section.
    expect(result.current.cycleProgress?.isAudible).toBe(false);
  });

  it("stop resets the visual state and clears cycle progress", () => {
    const { result } = renderHook(() => useInnerTakt(config));
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(scheduler.stop).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleProgress).toBeNull();
  });

  it("exposes the tap recorder controls", () => {
    const { result } = renderHook(() => useInnerTakt(config));
    expect(result.current.recordTap).toBe(tap.recordTap);
    expect(result.current.resetTaps).toBe(tap.resetTaps);
    expect(result.current.taps).toBe(tap.taps);
  });
});

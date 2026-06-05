import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  InnerTaktConfig,
  ScheduledBeat,
  SchedulerRefs,
} from "./useBeatScheduler";
import { useVisualBeat } from "./useVisualBeat";

const config: InnerTaktConfig = {
  bpm: 120,
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 1,
  silentBars: 1,
  fadeBeats: 0,
};

const clock = { now: 0 };

// The RAF loop is driven manually: each requestAnimationFrame stores the next
// callback so the test can step the loop one frame at a time.
let nextFrame: FrameRequestCallback | null = null;

const makeRefs = (overrides: Partial<SchedulerRefs> = {}): SchedulerRefs => ({
  audioContextRef: {
    current: {
      get currentTime() {
        return clock.now;
      },
    } as AudioContext,
  },
  beatTimesRef: { current: [] },
  beatIndexRef: { current: 0 },
  nextBeatTimeRef: { current: 0 },
  configRef: { current: config },
  ...overrides,
});

const step = () =>
  act(() => {
    nextFrame?.(clock.now);
  });

beforeEach(() => {
  clock.now = 0;
  nextFrame = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    nextFrame = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useVisualBeat", () => {
  it("starts at a stopped visual state", () => {
    const { result } = renderHook(() => useVisualBeat(makeRefs()));
    expect(result.current.currentBeat).toBe(-1);
    expect(result.current.beatIndex).toBe(0);
    expect(result.current.fadeAmount).toBe(1);
  });

  it("stays idle while no AudioContext is present", () => {
    const refs = makeRefs({ audioContextRef: { current: null } });
    const { result } = renderHook(() => useVisualBeat(refs));
    step();
    expect(result.current.currentBeat).toBe(-1);
  });

  it("stays idle when no beat in the ring has elapsed yet", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 0, timeSec: 5 }];
    const refs = makeRefs({ beatTimesRef: { current: ring } });
    const { result } = renderHook(() => useVisualBeat(refs));
    step();
    expect(result.current.currentBeat).toBe(-1);
  });

  it("reflects the active beat position and index", () => {
    const ring: ScheduledBeat[] = [
      { beatIdx: 0, timeSec: 0 },
      { beatIdx: 1, timeSec: 0.5 },
    ];
    const refs = makeRefs({ beatTimesRef: { current: ring } });
    const { result } = renderHook(() => useVisualBeat(refs));
    clock.now = 0.5;
    step();
    expect(result.current.beatIndex).toBe(1);
    expect(result.current.currentBeat).toBe(1);
  });

  it("keeps the same currentBeat across frames within one beat", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 5, timeSec: 0 }];
    const refs = makeRefs({ beatTimesRef: { current: ring } });
    const { result } = renderHook(() => useVisualBeat(refs));
    clock.now = 0.1;
    step();
    // beatIdx 5 with beatsPerBar 4 maps to position 1 within the bar.
    expect(result.current.currentBeat).toBe(1);
    step();
    expect(result.current.currentBeat).toBe(1);
  });

  it("interpolates the fade amount between the current and next beat", () => {
    const fadeConfig = { ...config, fadeBeats: 2 };
    const ring: ScheduledBeat[] = [{ beatIdx: 0, timeSec: 0 }];
    const refs = makeRefs({
      beatTimesRef: { current: ring },
      configRef: { current: fadeConfig },
    });
    const { result } = renderHook(() => useVisualBeat(refs));
    // Halfway into beat 0: fade interpolates from 0 (beat 0) toward 0.5 (beat 1).
    clock.now = 60 / fadeConfig.bpm / 2;
    step();
    expect(result.current.fadeAmount).toBeGreaterThan(0);
    expect(result.current.fadeAmount).toBeLessThan(0.5);
  });

  it("cancels the animation frame on unmount", () => {
    const cancel = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const { unmount } = renderHook(() => useVisualBeat(makeRefs()));
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("reset returns the visual state to its stopped values", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 2, timeSec: 0 }];
    const refs = makeRefs({ beatTimesRef: { current: ring } });
    const { result } = renderHook(() => useVisualBeat(refs));
    clock.now = 0.1;
    step();
    expect(result.current.currentBeat).not.toBe(-1);
    act(() => {
      result.current.reset();
    });
    expect(result.current.currentBeat).toBe(-1);
    expect(result.current.fadeAmount).toBe(1);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  InnerTaktConfig,
  ScheduledBeat,
  SchedulerRefs,
} from "./useBeatScheduler";
import { useTapRecorder } from "./useTapRecorder";

const config: InnerTaktConfig = {
  bpm: 120, // beat length = 0.5s
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 1,
  silentBars: 1,
  fadeBeats: 0,
};

const clock = { now: 0 };

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

describe("useTapRecorder", () => {
  it("ignores taps when no AudioContext is present", () => {
    const refs = makeRefs({ audioContextRef: { current: null } });
    const { result } = renderHook(() => useTapRecorder(refs));
    act(() => {
      result.current.recordTap();
    });
    expect(result.current.taps).toEqual([]);
  });

  it("records the deviation against the nearest ring beat", () => {
    // Nearest beat first, farther beat second, so the scan keeps the running
    // minimum instead of overwriting it.
    const ring: ScheduledBeat[] = [
      { beatIdx: 1, timeSec: 0.5 },
      { beatIdx: 0, timeSec: 0 },
    ];
    const refs = makeRefs({
      beatTimesRef: { current: ring },
      nextBeatTimeRef: { current: 1 },
      beatIndexRef: { current: 2 },
    });
    const { result } = renderHook(() => useTapRecorder(refs));
    clock.now = 0.55; // 50ms after beat 1
    act(() => {
      result.current.recordTap();
    });
    expect(result.current.taps).toHaveLength(1);
    expect(result.current.taps[0].beatIdx).toBe(1);
    expect(result.current.taps[0].deviationMs).toBeCloseTo(50);
  });

  it("rejects taps that are too far from any beat to attribute", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 0, timeSec: 0 }];
    const refs = makeRefs({
      beatTimesRef: { current: ring },
      nextBeatTimeRef: { current: 0 },
    });
    const { result } = renderHook(() => useTapRecorder(refs));
    clock.now = 0.4; // > beatLen/2 (0.25) from both beat 0 and the projected beat
    act(() => {
      result.current.recordTap();
    });
    expect(result.current.taps).toEqual([]);
  });

  it("can attribute a tap to the projected upcoming beat", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 0, timeSec: 0 }];
    const refs = makeRefs({
      beatTimesRef: { current: ring },
      nextBeatTimeRef: { current: 1 },
      beatIndexRef: { current: 2 },
    });
    const { result } = renderHook(() => useTapRecorder(refs));
    clock.now = 0.95; // nearest to the projected beat at 1.0
    act(() => {
      result.current.recordTap();
    });
    expect(result.current.taps).toHaveLength(1);
    expect(result.current.taps[0].beatIdx).toBe(2);
  });

  it("resetTaps clears recorded taps", () => {
    const ring: ScheduledBeat[] = [{ beatIdx: 0, timeSec: 0 }];
    const refs = makeRefs({
      beatTimesRef: { current: ring },
      nextBeatTimeRef: { current: 1 },
    });
    const { result } = renderHook(() => useTapRecorder(refs));
    clock.now = 0;
    act(() => {
      result.current.recordTap();
    });
    expect(result.current.taps).toHaveLength(1);
    act(() => {
      result.current.resetTaps();
    });
    expect(result.current.taps).toEqual([]);
  });
});

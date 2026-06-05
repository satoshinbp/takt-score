import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fadeAt,
  type InnerTaktConfig,
  useBeatScheduler,
} from "./useBeatScheduler";

const playClick = vi.fn();
vi.mock("@/lib/metronome-audio", () => ({
  playClick: (...args: unknown[]) => {
    playClick(...args);
  },
}));

const baseConfig: InnerTaktConfig = {
  bpm: 120,
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 1,
  silentBars: 1,
  fadeBeats: 0,
};

// Mirrors usePlayback.test.ts: a minimal AudioContext whose clock the test drives.
const installFakeAudioContext = () => {
  let currentTime = 0;
  const instances: { resume: ReturnType<typeof vi.fn>; state: string }[] = [];

  class FakeAudioContext {
    state = "suspended";
    destination = {};
    resume = vi.fn().mockImplementation(() => {
      this.state = "running";
      return Promise.resolve();
    });
    get currentTime() {
      return currentTime;
    }
    constructor() {
      instances.push(this);
    }
  }

  vi.stubGlobal("AudioContext", FakeAudioContext);
  return {
    instances,
    setCurrentTime: (sec: number) => {
      currentTime = sec;
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  playClick.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fadeAt", () => {
  it("is fully silent throughout the silent section", () => {
    // beats 4-7 fall in the silent bar for a 1+1 bar cycle of 4 beats each.
    expect(fadeAt(4, baseConfig)).toBe(0);
    expect(fadeAt(7, baseConfig)).toBe(0);
  });

  it("is full volume in the audible section when no fade is configured", () => {
    expect(fadeAt(0, baseConfig)).toBe(1);
    expect(fadeAt(3, baseConfig)).toBe(1);
  });

  it("ramps in over the first fadeBeats of the audible section", () => {
    const config = { ...baseConfig, fadeBeats: 2 };
    expect(fadeAt(0, config)).toBe(0);
    expect(fadeAt(1, config)).toBe(0.5);
    expect(fadeAt(2, config)).toBe(1);
  });

  it("ramps out over the final fadeBeats of the audible section", () => {
    // 2 audible bars = 8 beats; fade-out covers beats 6 and 7.
    const config = { ...baseConfig, audibleBars: 2, fadeBeats: 2 };
    expect(fadeAt(7, config)).toBe(0.5);
    expect(fadeAt(6, config)).toBe(1);
  });

  it("normalizes negative beat indices into the cycle", () => {
    expect(fadeAt(-4, baseConfig)).toBe(0);
    expect(fadeAt(-8, baseConfig)).toBe(1);
  });
});

describe("useBeatScheduler", () => {
  it("creates an AudioContext on the first start", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    expect(audio.instances).toHaveLength(1);
  });

  it("schedules audible clicks while running", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    expect(playClick).toHaveBeenCalled();
  });

  it("caps the beat ring at RING_MAX even after a large clock jump", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() =>
      useBeatScheduler({ ...baseConfig, bpm: 6000 }),
    );
    act(() => {
      result.current.start();
    });
    // Jump the clock far ahead so the next tick drains far more than RING_MAX beats.
    act(() => {
      audio.setCurrentTime(10);
      vi.advanceTimersByTime(20);
    });
    expect(result.current.refs.beatTimesRef.current.length).toBeLessThanOrEqual(
      64,
    );
  });

  it("clears the ring and timer on stop", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.refs.beatTimesRef.current).toEqual([]);
    // A pending tick after stop must not reschedule.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.refs.beatTimesRef.current).toEqual([]);
  });

  it("is a no-op when stopped before ever starting", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.stop();
    });
    expect(result.current.refs.beatTimesRef.current).toEqual([]);
  });

  it("reuses an existing context and resumes it when suspended again", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    audio.instances[0].state = "suspended";
    act(() => {
      result.current.start();
    });
    // No new context is constructed; the suspended one is resumed instead.
    expect(audio.instances).toHaveLength(1);
    expect(audio.instances[0].resume).toHaveBeenCalledTimes(1);
  });

  it("reuses an already-running context without resuming it", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    audio.instances[0].state = "running";
    act(() => {
      result.current.start();
    });
    expect(audio.instances).toHaveLength(1);
    expect(audio.instances[0].resume).not.toHaveBeenCalled();
  });

  it("falls back to webkitAudioContext when the standard one is missing", () => {
    const audio = installFakeAudioContext();
    const Ctor = (globalThis as unknown as { AudioContext: unknown })
      .AudioContext;
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", Ctor);
    const { result } = renderHook(() => useBeatScheduler(baseConfig));
    act(() => {
      result.current.start();
    });
    expect(audio.instances).toHaveLength(1);
  });

  it("picks up config changes through rerenders", () => {
    installFakeAudioContext();
    const { result, rerender } = renderHook(
      (cfg: InnerTaktConfig) => useBeatScheduler(cfg),
      { initialProps: baseConfig },
    );
    rerender({ ...baseConfig, bpm: 90 });
    act(() => {
      result.current.start();
    });
    expect(result.current.refs.configRef.current.bpm).toBe(90);
  });
});

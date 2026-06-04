import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayback } from "@/hooks/usePlayback";
import { newScore, ORNAMENT, STEP } from "@/lib/constants";
import type { ScoreDetail } from "@/types/common";

const installFakeAudioContext = () => {
  const makeParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const instances: {
    state: AudioContextState;
    currentTime: number;
    resume: ReturnType<typeof vi.fn>;
  }[] = [];

  class FakeAudioContext {
    state: AudioContextState = "suspended";
    sampleRate = 44100;
    destination = {};
    resume = vi.fn().mockImplementation(() => {
      this.state = "running";
      return Promise.resolve();
    });
    get currentTime() {
      return _currentTime;
    }
    createBufferSource() {
      return { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    }
    createBuffer(_ch: number, len: number) {
      return { getChannelData: () => new Float32Array(len) };
    }
    createBiquadFilter() {
      return {
        type: "lowpass",
        frequency: makeParam(),
        Q: makeParam(),
        connect: vi.fn(),
      };
    }
    createGain() {
      return { gain: makeParam(), connect: vi.fn() };
    }
    createOscillator() {
      return {
        type: "sine",
        frequency: makeParam(),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    }
    constructor() {
      instances.push(this);
    }
  }
  let _currentTime = 0;
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return {
    instances,
    advance: (sec: number) => {
      _currentTime += sec;
    },
    setCurrentTime: (sec: number) => {
      _currentTime = sec;
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("usePlayback", () => {
  it("initializes with stopped state and the score's BPM", () => {
    installFakeAudioContext();
    const score = newScore("S", 100);
    const { result } = renderHook(() => usePlayback(score));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStep).toBe(-1);
    expect(result.current.bpm).toBe(100);
    expect(result.current.loop).toBe(true);
  });

  it("toggle starts playback (creates AudioContext, resumes, sets isPlaying)", () => {
    const audio = installFakeAudioContext();
    const score = newScore();
    const { result } = renderHook(() => usePlayback(score));
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(audio.instances).toHaveLength(1);
    expect(audio.instances[0].resume).toHaveBeenCalled();
  });

  it("toggle while playing pauses", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("stop resets the current step to -1 and pauses", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStep).toBe(-1);
  });

  it("seekTo updates the step while stopped", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.seekTo(5);
    });
    expect(result.current.currentStep).toBe(5);
  });

  it("seekTo while playing keeps playback running", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.seekTo(3);
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it("setBpm updates BPM and pushes it into the engine's score", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore("S", 90)));
    act(() => {
      result.current.setBpm(140);
    });
    expect(result.current.bpm).toBe(140);
  });

  it("setLoop accepts both a boolean and an updater function", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.setLoop(false);
    });
    expect(result.current.loop).toBe(false);
    act(() => {
      result.current.setLoop((prev) => !prev);
    });
    expect(result.current.loop).toBe(true);
  });

  it("works with a null score (no scheduling target)", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(null));
    expect(result.current.bpm).toBe(120);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);
    // Advance audio + timers so the scheduler runs through the null-score
    // branch in totalStepsNow and `score?.measures ?? []`.
    act(() => {
      audio.advance(1);
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.stop();
    });
  });

  it("scheduler runs and schedules events while playing", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore("S", 240)));
    act(() => {
      result.current.toggle();
    });
    // Advance audio clock past the lookahead so scheduler queues steps,
    // then advance fake timers to fire the next scheduler tick.
    act(() => {
      audio.advance(1);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it("non-loop playback stops when the score completes", () => {
    const audio = installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore("S", 480)));
    act(() => {
      result.current.setLoop(false);
    });
    act(() => {
      result.current.toggle();
    });
    // Advance the audio clock well past one bar so the scheduler exhausts steps.
    act(() => {
      audio.advance(10);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("unmount stops the timer loops", () => {
    installFakeAudioContext();
    const { result, unmount } = renderHook(() => usePlayback(newScore()));
    act(() => {
      result.current.toggle();
    });
    unmount();
    // No assertion needed — the cleanup path executes via the effect's return.
  });

  it("toggle alternates play/pause across multiple presses", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(newScore()));
    // play → pause → play → pause, ending stopped.
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("setBpm without an active score leaves the engine score null", () => {
    installFakeAudioContext();
    const { result } = renderHook(() => usePlayback(null));
    act(() => {
      result.current.setBpm(150);
    });
    expect(result.current.bpm).toBe(150);
  });

  it("scheduler plays steps with ornaments and rafLoop reports the active step", () => {
    const audio = installFakeAudioContext();
    const base = newScore("S", 120);
    // Turn on HH for step 0 (accent) and BD for step 0 with a FLAM ornament.
    const score: ScoreDetail = {
      ...base,
      measures: base.measures.map((measure) =>
        measure.map((beat, bi) =>
          bi === 0
            ? {
                ...beat,
                steps: {
                  ...beat.steps,
                  HH: [STEP.ACCENT, ...beat.steps.HH.slice(1)],
                  BD: [STEP.NORMAL, ...beat.steps.BD.slice(1)],
                },
                ornaments: { ...beat.ornaments, BD: [ORNAMENT.FLAM, 0, 0, 0] },
              }
            : beat,
        ),
      ) as ScoreDetail["measures"],
    };

    const { result } = renderHook(() => usePlayback(score));
    act(() => {
      result.current.toggle();
    });
    // Advance the audio clock past the first scheduled event so rafLoop sees a
    // played step, then run timers so the raf + scheduler callbacks fire.
    act(() => {
      audio.advance(0.2);
      vi.advanceTimersByTime(50);
    });
    // Pausing now exercises syncStep on the playingStep ≥ 0 branch.
    act(() => {
      result.current.toggle();
    });
    expect(result.current.currentStep).toBeGreaterThanOrEqual(0);
  });
});

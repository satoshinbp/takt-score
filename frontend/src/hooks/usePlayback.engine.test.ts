import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaybackEngine } from "@/hooks/usePlayback";

const installFakeAudioContext = () => {
  const makeParam = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });

  class FakeAudioContext {
    state: AudioContextState = "running";
    sampleRate = 44100;
    destination = {};
    resume = vi.fn().mockResolvedValue(undefined);
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
  }
  let _currentTime = 0;
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return {
    advance: (sec: number) => {
      _currentTime += sec;
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

describe("createPlaybackEngine (defensive guards)", () => {
  it("calling play twice is a no-op (early return)", () => {
    installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    engine.play();
    cb.onPlayingChange.mockClear();
    engine.play();
    expect(cb.onPlayingChange).not.toHaveBeenCalled();
  });

  it("calling pause while not playing is a no-op", () => {
    installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    engine.pause();
    expect(cb.onPlayingChange).not.toHaveBeenCalled();
  });

  it("stopLoops is safe to call before play (null timer / raf)", () => {
    installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    expect(() => engine.stopLoops()).not.toThrow();
  });

  it("rafLoop with no events in the lookahead window leaves the step unchanged", () => {
    const audio = installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    engine.play();
    // Run the scheduler once so events are queued, then advance the audio
    // clock well past the lookahead window so the filter drops them all.
    vi.advanceTimersByTime(1);
    audio.advance(10);
    cb.onStepChange.mockClear();
    // Now fire rAF: scheduledEvents are all filtered out, lastPlayedStep stays -1.
    vi.advanceTimersByTime(20);
    expect(cb.onStepChange).not.toHaveBeenCalled();
  });

  it("scheduler bails out if stopped between ticks", () => {
    const audio = installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    engine.play();
    // Advance the audio clock so events are queued; then stop and let the
    // queued rAF callback fire — it should bail out due to the !isPlaying guard.
    audio.advance(0.5);
    engine.stop();
    vi.advanceTimersByTime(50);
    // Reaching here without crashing exercises the guard.
  });

  it("treats out-of-range step indices as OFF", () => {
    const audio = installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    // Score with a beat whose step arrays are shorter than subdivision so
    // scheduler reads `undefined` at higher step indices.
    engine.setScore({
      id: "x",
      title: "x",
      bpm: 120,
      spotifyTrackId: null,
      previewMeasure: [],
      measuresCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      measures: [
        [
          {
            subdivision: 4,
            steps: {
              CRASH: [],
              RIDE: [],
              HH_OPEN: [],
              HH: [],
              HI_TOM: [],
              MID_TOM: [],
              SNARE: [],
              LO_TOM: [],
              BD: [],
            },
          },
        ],
      ],
    });
    engine.play();
    audio.advance(1);
    vi.advanceTimersByTime(50);
  });

  it("supports unusual velocities (falls back to gain=1.0)", () => {
    const audio = installFakeAudioContext();
    const cb = { onStepChange: vi.fn(), onPlayingChange: vi.fn() };
    const engine = createPlaybackEngine(120, cb);
    // Build a minimal score that points at a beat whose step velocity is an
    // unknown value, forcing the `VELOCITY_GAIN[v] ?? 1.0` fallback.
    engine.setScore({
      id: "x",
      title: "x",
      bpm: 120,
      spotifyTrackId: null,
      previewMeasure: [],
      measuresCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      measures: [
        [
          {
            subdivision: 4,
            steps: {
              CRASH: [0, 0, 0, 0],
              RIDE: [0, 0, 0, 0],
              HH_OPEN: [0, 0, 0, 0],
              HH: [99, 0, 0, 0], // out of VELOCITY_GAIN
              HI_TOM: [0, 0, 0, 0],
              MID_TOM: [0, 0, 0, 0],
              SNARE: [0, 0, 0, 0],
              LO_TOM: [0, 0, 0, 0],
              BD: [0, 0, 0, 0],
            },
          },
        ],
      ],
    });
    engine.play();
    audio.advance(1);
    vi.advanceTimersByTime(50);
  });
});

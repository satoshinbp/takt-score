"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/audio";
import type { Subdivision } from "@/lib/constants";
import { PART_IDS, STEP } from "@/lib/constants";
import {
  decodeStep,
  getTotalSteps,
  stepDurationSec,
} from "@/lib/playback-utils";
import type { Beat, Measure, ScoreDetail } from "@/types/common";

// Gain multiplier per STEP value. NORMAL=1.0, ACCENT=1.4, GHOST=0.35.
const VELOCITY_GAIN: Record<number, number> = { 1: 1.0, 2: 1.4, 3: 0.35 };

// Grace notes are placed starting 25ms before the main hit, at 0.4× its gain.
const GRACE_SEC = 0.025;
const GRACE_GAIN = 0.4;

export type PlaybackState = {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  setBpm: (v: number) => void;
  loop: boolean;
  setLoop: (v: boolean | ((prev: boolean) => boolean)) => void;
  toggle: () => void;
  stop: () => void;
  seekTo: (step: number) => void;
};

type EngineCallbacks = {
  onStepChange: (step: number) => void;
  onPlayingChange: (playing: boolean) => void;
};

type PlaybackEngine = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (step: number) => void;
  stopLoops: () => void;
  setBpm: (v: number) => void;
  setLoop: (v: boolean) => void;
  setScore: (s: ScoreDetail | null) => void;
  getScore: () => ScoreDetail | null;
};

export const createPlaybackEngine = (
  initialBpm: number,
  cb: EngineCallbacks,
): PlaybackEngine => {
  let ctx: AudioContext | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let raf: number | null = null;
  let scheduleStep = 0;
  let nextTime = 0;
  let scheduledEvents: { step: number; time: number }[] = [];
  let playingStep = -1;
  let bpm = initialBpm;
  let shouldLoop = true;
  let score: ScoreDetail | null = null;

  const isPlaying = () => timer !== null;

  const clearPlaybackState = () => {
    scheduledEvents = [];
    playingStep = -1;
  };

  const totalStepsNow = () => (score ? getTotalSteps(score.measures) : 4);

  const syncStep = () => {
    if (playingStep < 0) return;
    scheduleStep = (playingStep + 1) % totalStepsNow();
    cb.onStepChange(playingStep);
  };

  const rafLoop = () => {
    /* v8 ignore next */
    if (!ctx) return;

    const now = ctx.currentTime;

    // Drop events outside the lookahead window to prevent re-highlighting past steps.
    scheduledEvents = scheduledEvents.filter((e) => e.time > now - 0.05);

    let lastPlayedStep = -1;

    // Match the lookahead to start()'s initial offset (0.05s).
    // At 100ms the next step enters the window and causes an early jump.
    for (const e of scheduledEvents) {
      if (e.time <= now + 0.05) lastPlayedStep = e.step;
    }

    if (lastPlayedStep >= 0) {
      playingStep = lastPlayedStep;
      cb.onStepChange(lastPlayedStep);
    }

    raf = requestAnimationFrame(rafLoop);
  };

  const scheduler = () => {
    /* v8 ignore next */
    if (!ctx) return;

    const lookAhead = 0.12;
    const totalSteps = totalStepsNow();
    const measures: Measure[] = score?.measures ?? [];

    while (nextTime < ctx.currentTime + lookAhead) {
      const step = scheduleStep;
      const time = nextTime;

      scheduledEvents.push({ step, time });

      const { measureIndex, beatIndex, stepIndex } = decodeStep(step, measures);
      const beatMeasure: Measure | undefined = measures[measureIndex];
      const beat: Beat | undefined = beatMeasure?.[beatIndex];
      const subdivision: Subdivision = beat?.subdivision ?? 4;

      if (beat) {
        const audioCtx = ctx;
        PART_IDS.forEach((id) => {
          const v = beat.steps[id]?.[stepIndex] ?? STEP.OFF;
          if (v === STEP.OFF) return;
          const gain = VELOCITY_GAIN[v] ?? 1.0;
          // Grace notes are played softer before the main hit, spaced 25ms apart.
          const orn = beat.ornaments?.[id]?.[stepIndex] ?? 0;
          for (let g = orn; g >= 1; g--) {
            const t = Math.max(
              time - g * GRACE_SEC,
              audioCtx.currentTime + 0.001,
            );
            SOUNDS[id]?.(audioCtx, t, gain * GRACE_GAIN);
          }
          SOUNDS[id]?.(audioCtx, time, gain);
        });
      }

      scheduleStep = (scheduleStep + 1) % totalSteps;
      nextTime += stepDurationSec(bpm, subdivision);

      if (!shouldLoop && scheduleStep === 0) {
        stop();
        return;
      }
    }

    timer = setTimeout(scheduler, 25);
  };

  const start = (audioCtx: AudioContext) => {
    // Start slightly in the future to avoid timing drift on immediate playback.
    nextTime = audioCtx.currentTime + 0.05;
    timer = setTimeout(scheduler, 0);
    raf = requestAnimationFrame(rafLoop);
  };

  const stopLoops = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const play = () => {
    if (isPlaying()) return;
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    start(ctx);
    cb.onPlayingChange(true);
  };

  const pause = () => {
    if (!isPlaying()) return;
    stopLoops();
    syncStep();
    clearPlaybackState();
    cb.onPlayingChange(false);
  };

  const stop = () => {
    stopLoops();
    scheduleStep = 0;
    clearPlaybackState();
    cb.onPlayingChange(false);
    cb.onStepChange(-1);
  };

  const seekTo = (step: number) => {
    scheduleStep = step;
    scheduledEvents = [];
    cb.onStepChange(step);
    if (!isPlaying() || !ctx) return;
    stopLoops();
    start(ctx);
  };

  return {
    play,
    pause,
    stop,
    seekTo,
    stopLoops,
    setBpm: (v) => {
      bpm = v;
    },
    setLoop: (v) => {
      shouldLoop = v;
    },
    setScore: (s) => {
      score = s;
    },
    getScore: () => score,
  };
};

export const usePlayback = (score: ScoreDetail | null): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpmState] = useState(score?.bpm ?? 120);
  const [shouldLoop, setShouldLoop] = useState(true);

  const engineRef = useRef<PlaybackEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = createPlaybackEngine(score?.bpm ?? 120, {
      onStepChange: setCurrentStep,
      onPlayingChange: setIsPlaying,
    });
  }

  useEffect(() => {
    engineRef.current!.setScore(score);
  }, [score]);
  useEffect(() => {
    engineRef.current!.setBpm(bpm);
  }, [bpm]);
  useEffect(() => {
    engineRef.current!.setLoop(shouldLoop);
  }, [shouldLoop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);
    const eng = engineRef.current!;
    const current = eng.getScore();
    if (current) eng.setScore({ ...current, bpm: v });
  }, []);

  const stop = useCallback(() => engineRef.current!.stop(), []);
  const seekTo = useCallback(
    (step: number) => engineRef.current!.seekTo(step),
    [],
  );

  const toggle = useCallback(() => {
    if (isPlaying) engineRef.current!.pause();
    else engineRef.current!.play();
  }, [isPlaying]);

  useEffect(() => {
    return () => engineRef.current!.stopLoops();
  }, []);

  return {
    isPlaying,
    currentStep,
    bpm,
    setBpm,
    loop: shouldLoop,
    setLoop: setShouldLoop,
    toggle,
    stop,
    seekTo,
  };
};

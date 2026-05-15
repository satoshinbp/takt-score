"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/audio";
import type { Beat, Measure, Score, Subdivision } from "@/lib/constants";
import { PART_IDS, STEP } from "@/lib/constants";
import {
  decodeStep,
  getTotalSteps,
  stepDurationSec,
} from "@/lib/playback-utils";

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
  pause: () => void;
  seekTo: (step: number) => void;
};

type EngineCallbacks = {
  onStepChange: (step: number) => void;
  onPlayingChange: (playing: boolean) => void;
};

class PlaybackEngine {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private raf: number | null = null;
  private scheduleStep = 0;
  private nextTime = 0;
  private scheduledEvents: { step: number; time: number }[] = [];
  private playingStep = -1;
  private readonly cb: EngineCallbacks;
  bpm: number;
  loop = true;
  score: Score | null = null;

  constructor(bpm: number, callbacks: EngineCallbacks) {
    this.bpm = bpm;
    this.cb = callbacks;
  }

  play() {
    if (this.isPlaying()) return;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.start();
    this.cb.onPlayingChange(true);
  }

  pause() {
    if (!this.isPlaying()) return;
    this.stopLoops();
    this.syncStep();
    this.clearPlaybackState();
    this.cb.onPlayingChange(false);
  }

  stop() {
    this.stopLoops();
    this.scheduleStep = 0;
    this.clearPlaybackState();
    this.cb.onPlayingChange(false);
    this.cb.onStepChange(-1);
  }

  seekTo(step: number) {
    this.scheduleStep = step;
    this.scheduledEvents = [];
    this.cb.onStepChange(step);
    if (!this.isPlaying()) return;
    this.stopLoops();
    this.start();
  }

  stopLoops() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private start() {
    if (!this.ctx) return;
    // Start slightly in the future to avoid timing drift on immediate playback.
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = setTimeout(() => this.scheduler(), 0);
    this.raf = requestAnimationFrame(() => this.rafLoop());
  }

  private isPlaying() {
    return this.timer !== null;
  }

  private clearPlaybackState() {
    this.scheduledEvents = [];
    this.playingStep = -1;
  }

  private getTotalSteps() {
    return this.score ? getTotalSteps(this.score.measures) : 4;
  }

  private syncStep() {
    const playingStep = this.playingStep;
    if (playingStep < 0) return;
    const totalSteps = this.getTotalSteps();
    this.scheduleStep = (playingStep + 1) % totalSteps;
    this.cb.onStepChange(playingStep);
  }

  /**
   * ===== UI update loop (requestAnimationFrame) =====
   * Computes which step is currently sounding and reflects it into React state.
   */
  private rafLoop() {
    if (!this.isPlaying() || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Drop events outside the lookahead window to prevent re-highlighting past steps.
    this.scheduledEvents = this.scheduledEvents.filter(
      (e) => e.time > now - 0.05
    );

    let lastPlayedStep = -1;

    // Match the lookahead to start()'s initial offset (0.05s).
    // At 100ms the next step enters the window and causes an early jump.
    for (const e of this.scheduledEvents) {
      if (e.time <= now + 0.05) lastPlayedStep = e.step;
    }

    if (lastPlayedStep >= 0) {
      this.playingStep = lastPlayedStep;
      this.cb.onStepChange(lastPlayedStep);
    }

    this.raf = requestAnimationFrame(() => this.rafLoop());
  }

  /**
   * ===== Scheduler =====
   * Pre-schedules future sounds in batches. This is the core of jitter-free playback.
   */
  private scheduler() {
    if (!this.timer || !this.ctx) return;

    const lookAhead = 0.12;
    const totalSteps = this.getTotalSteps();
    const measures: Measure[] = this.score?.measures ?? [];

    while (this.nextTime < this.ctx.currentTime + lookAhead) {
      const step = this.scheduleStep;
      const time = this.nextTime;

      this.scheduledEvents.push({ step, time });

      const { measureIndex, beatIndex, stepIndex } = decodeStep(step, measures);
      const beatMeasure: Measure | undefined = measures[measureIndex];
      const beat: Beat | undefined = beatMeasure?.[beatIndex];
      const subdivision: Subdivision = beat?.subdivision ?? 4;

      if (beat) {
        const ctx = this.ctx;
        PART_IDS.forEach((id) => {
          const v = beat.steps[id]?.[stepIndex] ?? STEP.OFF;
          if (v === STEP.OFF) return;
          const gain = VELOCITY_GAIN[v] ?? 1.0;
          // Grace notes are played softer before the main hit, spaced 25ms apart.
          const orn = beat.ornaments?.[id]?.[stepIndex] ?? 0;
          for (let g = orn; g >= 1; g--) {
            const t = Math.max(time - g * GRACE_SEC, ctx.currentTime + 0.001);
            SOUNDS[id]?.(ctx, t, gain * GRACE_GAIN);
          }
          SOUNDS[id]?.(ctx, time, gain);
        });
      }

      this.scheduleStep = (this.scheduleStep + 1) % totalSteps;
      this.nextTime += stepDurationSec(this.bpm, subdivision);

      if (!this.loop && this.scheduleStep === 0) {
        this.stop();
        return;
      }
    }

    this.timer = setTimeout(() => this.scheduler(), 25);
  }
}

export const usePlayback = (score: Score | null): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpmState] = useState(score?.bpm ?? 120);
  const [shouldLoop, setShouldLoop] = useState(true);

  const engineRef = useRef<PlaybackEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = new PlaybackEngine(score?.bpm ?? 120, {
      onStepChange: setCurrentStep,
      onPlayingChange: setIsPlaying,
    });
  }

  useEffect(() => {
    engineRef.current!.score = score;
  }, [score]);
  useEffect(() => {
    engineRef.current!.bpm = bpm;
  }, [bpm]);
  useEffect(() => {
    engineRef.current!.loop = shouldLoop;
  }, [shouldLoop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);
    const eng = engineRef.current!;
    if (eng.score) eng.score = { ...eng.score, bpm: v };
  }, []);

  const pause = useCallback(() => engineRef.current!.pause(), []);
  const stop = useCallback(() => engineRef.current!.stop(), []);
  const seekTo = useCallback(
    (step: number) => engineRef.current!.seekTo(step),
    []
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
    pause,
    seekTo,
  };
};

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/audio";
import { PARTS, type Score, SUBDIVISIONS } from "@/lib/constants";

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
    // 少し未来から開始（即時再生のズレ防止）
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
    return (this.score?.measures?.length ?? 1) * SUBDIVISIONS;
  }

  private syncStep() {
    const playingStep = this.playingStep;
    if (playingStep < 0) return;
    const totalSteps = this.getTotalSteps();
    this.scheduleStep = (playingStep + 1) % totalSteps;
    this.cb.onStepChange(playingStep);
  }

  /**
   * ===== UI更新ループ（requestAnimationFrame）=====
   * 「今どのstepが鳴っているか」を計算してReactに反映する
   */
  private rafLoop() {
    if (!this.isPlaying() || !this.ctx) return;

    const now = this.ctx.currentTime;

    // 古い予約イベントを削除（メモリ＆精度対策）
    this.scheduledEvents = this.scheduledEvents.filter(
      (e) => e.time > now - 0.05,
    );

    // 「今鳴っているはずのstep」を探す
    let lastPlayedStep = -1;

    for (const e of this.scheduledEvents) {
      if (e.time <= now + 0.01) lastPlayedStep = e.step;
    }

    if (lastPlayedStep >= 0) {
      this.playingStep = lastPlayedStep;
      this.cb.onStepChange(lastPlayedStep);
    }

    this.raf = requestAnimationFrame(() => this.rafLoop());
  }

  /**
   * ===== スケジューラ =====
   * 未来の音をまとめて予約する（これが音ズレ防止の核心）
   */
  private scheduler() {
    if (!this.timer || !this.ctx) return;

    const lookAhead = 0.12; // どれくらい未来まで予約するか
    const stepDuration = 60 / this.bpm / 4; // 16分音符の長さ
    const totalSteps = this.getTotalSteps();

    // 未来分をまとめて予約
    while (this.nextTime < this.ctx.currentTime + lookAhead) {
      const step = this.scheduleStep;
      const time = this.nextTime;

      // UI用に記録
      this.scheduledEvents.push({ step, time });

      // 対応する小節・位置を取得
      const measureIndex = Math.floor(step / SUBDIVISIONS);
      const stepIndex = step % SUBDIVISIONS;
      const measure = this.score?.measures?.[measureIndex];

      // 音を予約
      if (measure) {
        PARTS.forEach((part) => {
          if (measure[part.id][stepIndex]) {
            SOUNDS[part.id]?.(this.ctx!, time);
          }
        });
      }

      this.scheduleStep = (this.scheduleStep + 1) % totalSteps;
      this.nextTime += stepDuration;
      if (!this.loop && this.scheduleStep === 0) {
        this.stop();
        return;
      }
    }

    // 次のスケジューリング
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
    pause,
    seekTo,
  };
};

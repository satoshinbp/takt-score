"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/audio";
import { PARTS, type Score, SUBDIVISIONS } from "@/lib/constants";

export type PlaybackState = {
  isPlaying: boolean;
  currentStep: number; // 現在再生中のステップ（16分音符単位）
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

  private step = 0;
  private nextTime = 0;
  private scheduledEvents: { step: number; time: number }[] = [];
  private lastPlayedStep = -1;

  isPlaying = false;
  bpm: number;
  loop = true;
  score: Score | null = null;

  private readonly cb: EngineCallbacks;

  constructor(initialBpm: number, callbacks: EngineCallbacks) {
    this.bpm = initialBpm;
    this.cb = callbacks;
  }

  play() {
    if (!this.ctx) this.ctx = new AudioContext();

    if (this.ctx.state === "suspended") void this.ctx.resume();

    this.isPlaying = true;
    // 少し未来から開始（即時再生のズレ防止）
    this.nextTime = this.ctx.currentTime + 0.05;

    this.cb.onPlayingChange(true);
    this.scheduler();
    this.raf = requestAnimationFrame(() => this.rafLoop());
  }

  pause() {
    // 先に止める（race condition防止）
    this.isPlaying = false;

    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }

    // schedulerは未来まで進んでいるので巻き戻す
    const playingStep = this.lastPlayedStep;

    if (playingStep >= 0) {
      const total = (this.score?.measures?.length ?? 1) * SUBDIVISIONS;
      this.step = (playingStep + 1) % total;
      this.cb.onStepChange(playingStep);
    }

    this.scheduledEvents = [];
    this.lastPlayedStep = -1;
    this.cb.onPlayingChange(false);
  }

  stop() {
    this.isPlaying = false;

    if (this.timer) clearTimeout(this.timer);

    if (this.raf) cancelAnimationFrame(this.raf);

    this.step = 0;
    this.scheduledEvents = [];
    this.lastPlayedStep = -1;

    this.cb.onPlayingChange(false);
    this.cb.onStepChange(-1);
  }

  seekTo(step: number) {
    this.step = step;
    this.scheduledEvents = [];
    this.cb.onStepChange(step);

    if (this.isPlaying && this.ctx) {
      if (this.timer) clearTimeout(this.timer);

      if (this.raf) cancelAnimationFrame(this.raf);

      this.nextTime = this.ctx.currentTime + 0.05;
      this.scheduler();
      this.raf = requestAnimationFrame(() => this.rafLoop());
    }
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);

    if (this.raf) cancelAnimationFrame(this.raf);
  }

  /**
   * ===== UI更新ループ（requestAnimationFrame）=====
   * 「今どのstepが鳴っているか」を計算してReactに反映する
   */
  private rafLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;

    // 古い予約イベントを削除（メモリ＆精度対策）
    this.scheduledEvents = this.scheduledEvents.filter(
      (e) => e.time > now - 0.05,
    );

    // 「今鳴っているはずのstep」を探す
    let currentDisplayStep = -1;

    for (const e of this.scheduledEvents) {
      if (e.time <= now + 0.01) currentDisplayStep = e.step;
    }

    if (currentDisplayStep >= 0) {
      this.lastPlayedStep = currentDisplayStep;
      this.cb.onStepChange(currentDisplayStep);
    }

    this.raf = requestAnimationFrame(() => this.rafLoop());
  }

  /**
   * ===== スケジューラ =====
   * 未来の音をまとめて予約する（これが音ズレ防止の核心）
   */
  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    const lookAhead = 0.12; // どれくらい未来まで予約するか
    const stepDuration = 60 / this.bpm / 4; // 16分音符の長さ
    const totalSteps = (this.score?.measures?.length ?? 1) * SUBDIVISIONS;

    // 未来分をまとめて予約
    while (this.nextTime < this.ctx.currentTime + lookAhead) {
      const step = this.step;
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

      this.step = (this.step + 1) % totalSteps;
      this.nextTime += stepDuration;

      // loopしない場合、1周で停止
      if (!this.loop && this.step === 0) {
        this.isPlaying = false;
        this.cb.onPlayingChange(false);
        this.cb.onStepChange(-1);

        if (this.timer) clearTimeout(this.timer);

        if (this.raf) cancelAnimationFrame(this.raf);

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

  if (engineRef.current == null) {
    engineRef.current = new PlaybackEngine(score?.bpm ?? 120, {
      onStepChange: setCurrentStep,
      onPlayingChange: setIsPlaying,
    });
  }

  // React state → engine 同期
  useEffect(() => { engineRef.current!.score = score; }, [score]);
  useEffect(() => { engineRef.current!.bpm = bpm; }, [bpm]);
  useEffect(() => { engineRef.current!.loop = shouldLoop; }, [shouldLoop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);

    // scoreにも反映（外部と整合性を取るため）
    const eng = engineRef.current!;

    if (eng.score) eng.score = { ...eng.score, bpm: v };
  }, []);

  const pause = useCallback(() => engineRef.current!.pause(), []);
  const stop = useCallback(() => engineRef.current!.stop(), []);
  const seekTo = useCallback((step: number) => engineRef.current!.seekTo(step), []);

  const toggle = useCallback(() => {
    if (engineRef.current!.isPlaying) engineRef.current!.pause();
    else engineRef.current!.play();
  }, []);

  useEffect(() => {
    return () => engineRef.current!.dispose();
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

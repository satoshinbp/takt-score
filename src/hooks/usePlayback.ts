"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SOUNDS } from "@/lib/audio";
import { PARTS, type Score, SUBDIVISIONS } from "@/lib/constants";

/**
 * UIに公開する再生状態
 */
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

/**
 * React外で管理する「リアルタイム再生エンジンの状態」
 * ※ React stateは遅いので全部ここに入れる
 */
type EngineRefs = {
  ctx: AudioContext | null;

  timer: ReturnType<typeof setTimeout> | null; // scheduler用
  raf: number | null; // UI更新用

  step: number; // 次に再生するステップ
  nextTime: number; // 次の音を鳴らすAudioContext時間

  scheduledEvents: { step: number; time: number }[];
  // ↑ 「このstepはこのtimeで鳴る予定」という予約リスト

  isPlaying: boolean;

  bpm: number;
  loop: boolean;
  score: Score | null;

  lastPlayedStep: number; // rafLoopで確定した「実際に鳴ったstep」
};

export const usePlayback = (score: Score | null): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpmState] = useState(score?.bpm ?? 120);
  const [shouldLoop, setShouldLoop] = useState(true);

  /**
   * メインの状態（React外）
   */
  const engine = useRef<EngineRefs>({
    ctx: null,
    timer: null,
    raf: null,

    step: 0,
    nextTime: 0,
    scheduledEvents: [],

    isPlaying: false,
    bpm: 120,
    loop: true,
    score: null,

    lastPlayedStep: -1,
  });

  /**
   * React state → engine同期
   */
  useEffect(() => {
    engine.current.score = score;
  }, [score]);

  useEffect(() => {
    engine.current.bpm = bpm;
  }, [bpm]);

  useEffect(() => {
    engine.current.loop = shouldLoop;
  }, [shouldLoop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);

    // scoreにも反映（外部と整合性を取るため）
    if (engine.current.score) {
      engine.current.score = { ...engine.current.score, bpm: v };
    }
  }, []);

  /**
   * ===== UI更新ループ（requestAnimationFrame）=====
   * 「今どのstepが鳴っているか」を計算してReactに反映する
   */
  const rafLoopRef = useRef<(() => void) | null>(null);

  const rafLoop = useCallback(() => {
    const ref = engine.current;

    if (!ref.isPlaying || !ref.ctx) return;

    const now = ref.ctx.currentTime;

    // 古い予約イベントを削除（メモリ＆精度対策）
    ref.scheduledEvents = ref.scheduledEvents.filter(
      (e) => e.time > now - 0.05,
    );

    // 「今鳴っているはずのstep」を探す
    let currentDisplayStep = -1;

    for (const e of ref.scheduledEvents) {
      if (e.time <= now + 0.01) {
        currentDisplayStep = e.step;
      }
    }

    // UI更新
    if (currentDisplayStep >= 0) {
      ref.lastPlayedStep = currentDisplayStep;
      setCurrentStep(currentDisplayStep);
    }

    // 次フレームへ
    ref.raf = requestAnimationFrame(rafLoopRef.current!);
  }, []);

  /**
   * ===== スケジューラ =====
   * 未来の音をまとめて予約する（これが音ズレ防止の核心）
   */
  const schedulerRef = useRef<(() => void) | null>(null);

  const scheduler = useCallback(() => {
    const ref = engine.current;

    if (!ref.isPlaying || !ref.ctx) return;

    const lookAhead = 0.12; // どれくらい未来まで予約するか
    const stepDuration = 60 / ref.bpm / 4; // 16分音符の長さ

    const totalMeasures = ref.score?.measures?.length ?? 1;
    const totalSteps = totalMeasures * SUBDIVISIONS;

    // 未来分をまとめて予約
    while (ref.nextTime < ref.ctx.currentTime + lookAhead) {
      const step = ref.step;
      const time = ref.nextTime;

      // UI用に記録
      ref.scheduledEvents.push({ step, time });

      // 対応する小節・位置を取得
      const measureIndex = Math.floor(step / SUBDIVISIONS);
      const stepIndex = step % SUBDIVISIONS;
      const measure = ref.score?.measures?.[measureIndex];

      // 音を予約
      if (measure) {
        PARTS.forEach((part) => {
          if (measure[part.id][stepIndex]) {
            SOUNDS[part.id]?.(ref.ctx!, time);
          }
        });
      }

      // 次のstepへ
      ref.step = (ref.step + 1) % totalSteps;
      ref.nextTime += stepDuration;

      // loopしない場合、1周で停止
      if (!ref.loop && ref.step === 0) {
        ref.isPlaying = false;
        setIsPlaying(false);
        setCurrentStep(-1);

        if (ref.timer) clearTimeout(ref.timer);

        if (ref.raf) cancelAnimationFrame(ref.raf);

        return;
      }
    }

    // 次のスケジューリング
    ref.timer = setTimeout(schedulerRef.current!, 25);
  }, []);

  useLayoutEffect(() => {
    rafLoopRef.current = rafLoop;
    schedulerRef.current = scheduler;
  });

  /**
   * ===== controls =====
   */

  const stop = useCallback(() => {
    const ref = engine.current;

    ref.isPlaying = false;

    if (ref.timer) clearTimeout(ref.timer);

    if (ref.raf) cancelAnimationFrame(ref.raf);

    ref.step = 0;
    ref.scheduledEvents = [];
    ref.lastPlayedStep = -1;

    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const play = useCallback(() => {
    const ref = engine.current;

    if (!ref.ctx) {
      ref.ctx = new AudioContext();
    }

    if (ref.ctx.state === "suspended") {
      void ref.ctx.resume();
    }

    ref.isPlaying = true;

    // 少し未来から開始（即時再生のズレ防止）
    ref.nextTime = ref.ctx.currentTime + 0.05;

    setIsPlaying(true);

    scheduler();
    ref.raf = requestAnimationFrame(rafLoop);
  }, [scheduler, rafLoop]);

  const pause = useCallback(() => {
    const ref = engine.current;

    // 先に止める（race condition防止）
    ref.isPlaying = false;

    if (ref.timer) {
      clearTimeout(ref.timer);
      ref.timer = null;
    }

    if (ref.raf) {
      cancelAnimationFrame(ref.raf);
      ref.raf = null;
    }

    // schedulerは未来まで進んでいるので巻き戻す
    const playingStep = ref.lastPlayedStep;

    if (playingStep >= 0) {
      const total = (ref.score?.measures?.length ?? 1) * SUBDIVISIONS;

      ref.step = (playingStep + 1) % total;
      setCurrentStep(playingStep);
    }

    ref.scheduledEvents = [];
    ref.lastPlayedStep = -1;

    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (step: number) => {
      const ref = engine.current;

      ref.step = step;
      ref.scheduledEvents = [];

      setCurrentStep(step);

      if (ref.isPlaying && ref.ctx) {
        if (ref.timer) clearTimeout(ref.timer);

        if (ref.raf) cancelAnimationFrame(ref.raf);

        ref.nextTime = ref.ctx.currentTime + 0.05;

        scheduler();
        ref.raf = requestAnimationFrame(rafLoop);
      }
    },
    [scheduler, rafLoop],
  );

  const toggle = useCallback(() => {
    if (engine.current.isPlaying) pause();
    else play();
  }, [play, pause]);

  useEffect(() => {
    return () => {
      const ref = engine.current;

      if (ref.timer) clearTimeout(ref.timer);

      if (ref.raf) cancelAnimationFrame(ref.raf);
    };
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

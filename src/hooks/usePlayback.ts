"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/audio";
import { PARTS, type Score, SUBDIVISIONS } from "@/lib/constants";

export type PlaybackState = {
  isPlaying: boolean;
  currentStep: number;
  currentMeasure: number;
  currentBeat: number;
  bpm: number;
  setBpm: (v: number) => void;
  loop: boolean;
  setLoop: (v: boolean | ((prev: boolean) => boolean)) => void;
  toggle: () => void;
  stop: () => void;
  pause: () => void;
  seekTo: (step: number) => void;
};

type Refs = {
  ctx: AudioContext | null;
  timer: ReturnType<typeof setTimeout> | null;
  raf: number | null;
  step: number;
  nextT: number;
  scheduled: { step: number; time: number }[];
  isPlaying: boolean;
  bpm: number;
  loop: boolean;
  score: Score | null;
  lastPlayingStep: number;
};

export const usePlayback = (score: Score | null): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpmState] = useState(score?.bpm ?? 120);
  const [shouldLoop, setShouldLoop] = useState(true);

  const r = useRef<Refs>({
    ctx: null,
    timer: null,
    raf: null,
    step: 0,
    nextT: 0,
    scheduled: [],
    isPlaying: false,
    bpm: 120,
    loop: true,
    score: null,
    lastPlayingStep: -1,
  });

  useEffect(() => {
    r.current.score = score;
  }, [score]);
  useEffect(() => {
    r.current.bpm = bpm;
  }, [bpm]);
  useEffect(() => {
    r.current.loop = shouldLoop;
  }, [shouldLoop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);

    if (r.current.score) r.current.score = { ...r.current.score, bpm: v };
  }, []);

  const rafLoopRef = useRef<(() => void) | null>(null);
  const schedulerRef = useRef<(() => void) | null>(null);

  const rafLoop = useCallback(() => {
    const ref = r.current;

    if (!ref.isPlaying || !ref.ctx) return;

    const now = ref.ctx.currentTime;
    ref.scheduled = ref.scheduled.filter((e) => e.time > now - 0.05);

    let disp = -1;

    for (const e of ref.scheduled) if (e.time <= now + 0.01) disp = e.step;

    if (disp >= 0) {
      ref.lastPlayingStep = disp;
      setCurrentStep(disp);
    }

    ref.raf = requestAnimationFrame(rafLoopRef.current!);
  }, []);

  const scheduler = useCallback(() => {
    const ref = r.current;

    if (!ref.isPlaying || !ref.ctx) return;
    const look = 0.12;
    const dur = 60 / ref.bpm / 4;
    const totalMeasures = ref.score?.measures?.length ?? 1;
    const total = totalMeasures * SUBDIVISIONS;
    while (ref.nextT < ref.ctx.currentTime + look) {
      const step = ref.step;
      const time = ref.nextT;
      ref.scheduled.push({ step, time });
      const mIdx = Math.floor(step / SUBDIVISIONS);
      const sIdx = step % SUBDIVISIONS;
      const measure = ref.score?.measures?.[mIdx];

      if (measure) {
        PARTS.forEach((part) => {
          if (measure[part.id][sIdx]) {
            SOUNDS[part.id]?.(ref.ctx!, time);
          }
        });
      }
      ref.step = (ref.step + 1) % total;
      ref.nextT += dur;

      if (!ref.loop && ref.step === 0) {
        ref.isPlaying = false;
        setIsPlaying(false);
        setCurrentStep(-1);

        if (ref.timer) clearTimeout(ref.timer);

        if (ref.raf) cancelAnimationFrame(ref.raf);

        return;
      }
    }
    ref.timer = setTimeout(schedulerRef.current!, 25);
  }, []);

  useLayoutEffect(() => {
    rafLoopRef.current = rafLoop;
    schedulerRef.current = scheduler;
  });

  const stop = useCallback(() => {
    const ref = r.current;
    ref.isPlaying = false;

    if (ref.timer) clearTimeout(ref.timer);

    if (ref.raf) cancelAnimationFrame(ref.raf);
    ref.step = 0;
    ref.scheduled = [];
    ref.lastPlayingStep = -1;
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const play = useCallback(() => {
    const ref = r.current;

    if (!ref.ctx) {
      ref.ctx = new AudioContext();
    }

    if (ref.ctx.state === "suspended") void ref.ctx.resume();
    ref.isPlaying = true;
    ref.nextT = ref.ctx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
    ref.raf = requestAnimationFrame(rafLoop);
  }, [scheduler, rafLoop]);

  const pause = useCallback(() => {
    const ref = r.current;

    // タイマー・rAF を先に止めてから位置を確定する。後続のコールバックが
    // ref.step / currentStep を上書きして再開位置がずれるのを防ぐため。
    ref.isPlaying = false;

    if (ref.timer) {
      clearTimeout(ref.timer);
      ref.timer = null;
    }

    if (ref.raf) {
      cancelAnimationFrame(ref.raf);
      ref.raf = null;
    }

    // scheduler は look-ahead 分だけ ref.step を先送りするため、
    // そのまま再開すると表示・音が先のステップへ飛んでしまう。
    // rafLoop が毎フレーム確定した lastPlayingStep を使って巻き戻す。
    // scheduled への依存を避けることで、タブ非アクティブ時に rAF が
    // 止まって scheduled が蓄積・フィルタされない状況でも正しく動く。
    const playingStep = ref.lastPlayingStep;
    if (playingStep >= 0) {
      const total = (ref.score?.measures?.length ?? 1) * SUBDIVISIONS;
      ref.step = (playingStep + 1) % total;
      setCurrentStep(playingStep);
    }

    ref.scheduled = [];
    ref.lastPlayingStep = -1;
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (step: number) => {
      const ref = r.current;
      ref.step = step;
      ref.scheduled = [];
      setCurrentStep(step);

      if (ref.isPlaying && ref.ctx) {
        if (ref.timer) clearTimeout(ref.timer);

        if (ref.raf) cancelAnimationFrame(ref.raf);

        ref.nextT = ref.ctx.currentTime + 0.05;
        scheduler();
        ref.raf = requestAnimationFrame(rafLoop);
      }
    },
    [scheduler, rafLoop],
  );

  const toggle = useCallback(() => {
    if (r.current.isPlaying) pause();
    else play();
  }, [play, pause]);

  useEffect(() => {
    const ref = r.current;

    return () => {
      if (ref.timer) clearTimeout(ref.timer);

      if (ref.raf) cancelAnimationFrame(ref.raf);
    };
  }, []);

  const currentMeasure =
    currentStep >= 0 ? Math.floor(currentStep / SUBDIVISIONS) : -1;
  const currentBeat =
    currentStep >= 0 ? Math.floor((currentStep % SUBDIVISIONS) / 4) : -1;

  return {
    isPlaying,
    currentStep,
    currentMeasure,
    currentBeat,
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

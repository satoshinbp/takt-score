"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PARTS, SUBDIVISIONS, type Score } from "@/lib/constants";
import { SOUNDS } from "@/lib/audio";

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
};

export const usePlayback = (score: Score | null): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpmState] = useState(score?.bpm ?? 120);
  const [loop, setLoop] = useState(true);

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
  });

  useEffect(() => { r.current.score = score; }, [score]);
  useEffect(() => { r.current.bpm = bpm; }, [bpm]);
  useEffect(() => { r.current.loop = loop; }, [loop]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);
    if (r.current.score) r.current.score = { ...r.current.score, bpm: v };
  }, []);

  const rafLoop = useCallback(() => {
    const ref = r.current;
    if (!ref.isPlaying || !ref.ctx) return;
    const now = ref.ctx.currentTime;
    ref.scheduled = ref.scheduled.filter((e) => e.time > now - 0.05);
    let disp = -1;
    for (const e of ref.scheduled) if (e.time <= now + 0.01) disp = e.step;
    setCurrentStep(disp);
    ref.raf = requestAnimationFrame(rafLoop);
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
    ref.timer = setTimeout(scheduler, 25);
  }, []);

  const stop = useCallback(() => {
    const ref = r.current;
    ref.isPlaying = false;
    if (ref.timer) clearTimeout(ref.timer);
    if (ref.raf) cancelAnimationFrame(ref.raf);
    ref.step = 0;
    ref.scheduled = [];
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const play = useCallback(() => {
    const ref = r.current;
    if (!ref.ctx) {
      ref.ctx = new AudioContext();
    }
    if (ref.ctx.state === "suspended") ref.ctx.resume();
    ref.isPlaying = true;
    ref.nextT = ref.ctx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
    ref.raf = requestAnimationFrame(rafLoop);
  }, [scheduler, rafLoop]);

  const toggle = useCallback(() => {
    r.current.isPlaying ? stop() : play();
  }, [play, stop]);

  useEffect(() => {
    return () => {
      const ref = r.current;
      if (ref.timer) clearTimeout(ref.timer);
      if (ref.raf) cancelAnimationFrame(ref.raf);
    };
  }, []);

  const currentMeasure = currentStep >= 0 ? Math.floor(currentStep / SUBDIVISIONS) : -1;
  const currentBeat = currentStep >= 0 ? Math.floor((currentStep % SUBDIVISIONS) / 4) : -1;

  return {
    isPlaying,
    currentStep,
    currentMeasure,
    currentBeat,
    bpm,
    setBpm,
    loop,
    setLoop,
    toggle,
    stop,
  };
}

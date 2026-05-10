"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { playClick } from "@/lib/metronome-audio";

export type InnerTaktCfg = {
  bpm: number;
  beatsPerBar: number;
  accentEvery: number;
  audibleBars: number;
  silentBars: number;
  fadeBeats: number;
};

export type Tap = {
  deviationMs: number;
  globalBeatIndex: number;
  timeSec: number;
};

type Phase = { silent: boolean; fade: number };

const phaseAt = (globalBeatIndex: number, c: InnerTaktCfg): Phase => {
  const totalBeats = (c.audibleBars + c.silentBars) * c.beatsPerBar;
  const pos = ((globalBeatIndex % totalBeats) + totalBeats) % totalBeats;
  const audibleBeats = c.audibleBars * c.beatsPerBar;
  if (pos < audibleBeats) {
    if (c.fadeBeats > 0 && pos >= audibleBeats - c.fadeBeats) {
      return { silent: false, fade: (audibleBeats - pos) / c.fadeBeats };
    }
    return { silent: false, fade: 1 };
  }
  const silentPos = pos - audibleBeats;
  const silentTotal = c.silentBars * c.beatsPerBar;
  if (c.fadeBeats > 0 && silentPos >= silentTotal - c.fadeBeats) {
    return {
      silent: false,
      fade: 1 - (silentTotal - silentPos) / c.fadeBeats,
    };
  }
  return { silent: true, fade: 0 };
};

type ScheduledBeat = { globalBeatIndex: number; timeSec: number };

const SCHEDULE_AHEAD_SEC = 0.15;
const SCHEDULER_TICK_MS = 20;
const RING_MAX = 64;

export const useInnerTakt = (cfg: InnerTaktCfg) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(0);
  const [isSilent, setIsSilent] = useState(false);
  const [fadeAmount, setFadeAmount] = useState(1);
  const [taps, setTaps] = useState<Tap[]>([]);

  const cfgRef = useRef(cfg);
  const runningRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const beatTimesRef = useRef<ScheduledBeat[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const schedulerRef = useRef<() => void>(() => {
    return;
  });
  useLayoutEffect(() => {
    schedulerRef.current = () => {
      if (!runningRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      const c = cfgRef.current;
      const beatLen = 60 / c.bpm;

      while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
        const gbi = beatIndexRef.current;
        const beatInBar = gbi % c.beatsPerBar;
        const isAccent = beatInBar % c.accentEvery === 0;
        const ph = phaseAt(gbi, c);
        const t = nextBeatTimeRef.current;

        beatTimesRef.current.push({ globalBeatIndex: gbi, timeSec: t });
        if (beatTimesRef.current.length > RING_MAX) {
          beatTimesRef.current.shift();
        }

        if (ph.fade > 0.001) {
          playClick(ctx, t, isAccent, ph.fade);
        }

        nextBeatTimeRef.current += beatLen;
        beatIndexRef.current += 1;
      }
      timerRef.current = setTimeout(
        () => schedulerRef.current(),
        SCHEDULER_TICK_MS,
      );
    };
  });

  // RAF loop drives the visual beat indicator + fade interpolation
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (runningRef.current && ctxRef.current) {
        const ctx = ctxRef.current;
        const c = cfgRef.current;
        const beatLen = 60 / c.bpm;
        const now = ctx.currentTime;

        let bi = -1;
        let beatTime = now;
        for (let i = beatTimesRef.current.length - 1; i >= 0; i--) {
          const entry = beatTimesRef.current[i];
          if (entry.timeSec <= now) {
            bi = entry.globalBeatIndex;
            beatTime = entry.timeSec;
            break;
          }
        }
        if (bi >= 0) {
          const beatInBar = bi % c.beatsPerBar;
          setCurrentBeat((prev) => (prev === beatInBar ? prev : beatInBar));
          setBeatIndex(bi);
          const ph = phaseAt(bi, c);
          const nextPh = phaseAt(bi + 1, c);
          const intoBeat = Math.min(1, Math.max(0, (now - beatTime) / beatLen));
          const fade = ph.fade + (nextPh.fade - ph.fade) * intoBeat;
          setFadeAmount(fade);
          setIsSilent(fade < 0.5);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = useCallback(() => {
    const ctx = ensureCtx();
    runningRef.current = true;
    nextBeatTimeRef.current = ctx.currentTime + 0.1;
    beatIndexRef.current = 0;
    beatTimesRef.current = [];
    setIsRunning(true);
    setTaps([]);
    setCurrentBeat(-1);
    schedulerRef.current();
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    setCurrentBeat(-1);
    setIsSilent(false);
    setFadeAmount(1);
  }, []);

  const recordTap = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const c = cfgRef.current;
    const beatLen = 60 / c.bpm;

    let nearest: ScheduledBeat | null = null;
    let minDiff = Infinity;
    for (const bt of beatTimesRef.current) {
      const d = Math.abs(now - bt.timeSec);
      if (d < minDiff) {
        minDiff = d;
        nearest = bt;
      }
    }
    const projDiff = Math.abs(now - nextBeatTimeRef.current);
    if (projDiff < minDiff) {
      minDiff = projDiff;
      nearest = {
        globalBeatIndex: beatIndexRef.current,
        timeSec: nextBeatTimeRef.current,
      };
    }
    if (!nearest) return;
    if (minDiff > beatLen / 2) return;

    const deviationMs = (now - nearest.timeSec) * 1000;
    const tap: Tap = {
      deviationMs,
      globalBeatIndex: nearest.globalBeatIndex,
      timeSec: now,
    };
    setTaps((prev) => [...prev, tap]);
  }, []);

  const resetTaps = useCallback(() => setTaps([]), []);

  // Cycle progress for the status banner
  const cycleProgress = (() => {
    if (!isRunning) return null;
    const c = cfg;
    const totalBeats = (c.audibleBars + c.silentBars) * c.beatsPerBar;
    const gbi = beatIndex;
    const pos = ((gbi % totalBeats) + totalBeats) % totalBeats;
    const audibleBeats = c.audibleBars * c.beatsPerBar;
    const isAudible = pos < audibleBeats;
    return {
      isAudible,
      pos: isAudible ? pos : pos - audibleBeats,
      total: isAudible ? audibleBeats : c.silentBars * c.beatsPerBar,
    };
  })();

  return {
    isRunning,
    currentBeat,
    isSilent,
    fadeAmount,
    taps,
    cycleProgress,
    start,
    stop,
    recordTap,
    resetTaps,
  };
};

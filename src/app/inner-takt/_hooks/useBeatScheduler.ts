"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { playClick } from "@/lib/metronome-audio";

export type InnerTaktConfig = {
  bpm: number;
  beatsPerBar: number;
  accentEvery: number;
  audibleBars: number;
  silentBars: number;
  fadeBeats: number;
};

export type Tap = {
  deviationMs: number;
  beatIdx: number;
  timeSec: number;
};

export type ScheduledBeat = { beatIdx: number; timeSec: number };

export type SchedulerRefs = {
  audioContextRef: RefObject<AudioContext | null>;
  beatTimesRef: RefObject<ScheduledBeat[]>;
  beatIndexRef: RefObject<number>;
  nextBeatTimeRef: RefObject<number>;
  configRef: RefObject<InnerTaktConfig>;
};

const RING_MAX = 64;
// JavaScript's setTimeout has timing jitter.
// As long as beats are queued within a lookahead window larger than that jitter, audio stays continuous.
const SCHEDULE_AHEAD_SEC = 0.15;
const SCHEDULER_TICK_MS = 20;
// Scheduling exactly at currentTime risks the playback head already being past it, dropping the note,
// so we start slightly in the future.
const START_OFFSET_SEC = 0.1;

// Returns the fade amount for the given beat (0 = silent, 1 = full volume).
export const fadeAt = (beatIdx: number, config: InnerTaktConfig): number => {
  const totalBeats =
    (config.audibleBars + config.silentBars) * config.beatsPerBar;
  const pos = ((beatIdx % totalBeats) + totalBeats) % totalBeats;
  const audibleBeats = config.audibleBars * config.beatsPerBar;

  // Audible section: linearly fade 1 → 0 over the final fadeBeats beats.
  if (pos < audibleBeats) {
    if (config.fadeBeats > 0 && pos >= audibleBeats - config.fadeBeats) {
      return (audibleBeats - pos) / config.fadeBeats;
    }
    return 1;
  }

  // Silent section: linearly ramp 0 → 1 over the final fadeBeats beats.
  const silentPos = pos - audibleBeats;
  const silentTotal = config.silentBars * config.beatsPerBar;
  if (config.fadeBeats > 0 && silentPos >= silentTotal - config.fadeBeats) {
    return 1 - (silentTotal - silentPos) / config.fadeBeats;
  }
  return 0;
};

const ensureAudioCtx = (existing: AudioContext | null): AudioContext => {
  if (existing) {
    if (existing.state === "suspended") void existing.resume();
    return existing;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  return new Ctor();
};

export type BeatScheduler = {
  start: () => void;
  stop: () => void;
  refs: SchedulerRefs;
};

export const useBeatScheduler = (cfg: InnerTaktConfig): BeatScheduler => {
  const configRef = useRef(cfg);
  const runningRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIdxRef = useRef(0);
  const beatTimesRef = useRef<ScheduledBeat[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulerRef = useRef<() => void>(() => {
    return;
  });

  useEffect(() => {
    configRef.current = cfg;
  }, [cfg]);

  const scheduleOneBeat = useCallback(
    (audioContext: AudioContext, config: InnerTaktConfig) => {
      const beatIdx = beatIdxRef.current;
      const beatIdxInBar = beatIdx % config.beatsPerBar;
      const isAccent = beatIdxInBar % config.accentEvery === 0;
      const timeSec = nextBeatTimeRef.current;
      const fade = fadeAt(beatIdx, config);

      beatTimesRef.current.push({ beatIdx, timeSec });
      if (beatTimesRef.current.length > RING_MAX) {
        beatTimesRef.current.shift();
      }

      if (fade > 0.001) {
        playClick(audioContext, timeSec, isAccent, fade);
      }

      nextBeatTimeRef.current += 60 / config.bpm;
      beatIdxRef.current += 1;
    },
    []
  );

  useLayoutEffect(() => {
    schedulerRef.current = () => {
      if (!runningRef.current) return;
      const audioContext = audioContextRef.current;
      if (!audioContext) return;
      const config = configRef.current;

      while (
        nextBeatTimeRef.current <
        audioContext.currentTime + SCHEDULE_AHEAD_SEC
      ) {
        scheduleOneBeat(audioContext, config);
      }
      timerRef.current = setTimeout(
        () => schedulerRef.current(),
        SCHEDULER_TICK_MS
      );
    };
  });

  const start = useCallback(() => {
    const audioContext = ensureAudioCtx(audioContextRef.current);
    audioContextRef.current = audioContext;
    runningRef.current = true;
    nextBeatTimeRef.current = audioContext.currentTime + START_OFFSET_SEC;
    beatIdxRef.current = 0;
    beatTimesRef.current = [];
    schedulerRef.current();
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = null;
    beatTimesRef.current = [];
  }, []);

  const refs: SchedulerRefs = {
    audioContextRef,
    beatTimesRef,
    beatIndexRef: beatIdxRef,
    nextBeatTimeRef,
    configRef,
  };

  return { start, stop, refs };
};

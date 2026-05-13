"use client";

import { useCallback, useState } from "react";
import {
  type ScheduledBeat,
  type SchedulerRefs,
  type Tap,
} from "./useBeatScheduler";

const findNearestBeat = (
  now: number,
  ring: ScheduledBeat[],
  projected: ScheduledBeat
): { beat: ScheduledBeat; diffSec: number } | null => {
  let nearest: ScheduledBeat | null = null;
  let minDiff = Infinity;
  for (const bt of ring) {
    const d = Math.abs(now - bt.timeSec);
    if (d < minDiff) {
      minDiff = d;
      nearest = bt;
    }
  }
  const projDiff = Math.abs(now - projected.timeSec);
  if (projDiff < minDiff) {
    minDiff = projDiff;
    nearest = projected;
  }
  return nearest ? { beat: nearest, diffSec: minDiff } : null;
};

export const useTapRecorder = (refs: SchedulerRefs) => {
  const [taps, setTaps] = useState<Tap[]>([]);

  const recordTap = useCallback(() => {
    const audioContext = refs.audioContextRef.current;
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const config = refs.configRef.current;
    const beatLen = 60 / config.bpm;

    const projected: ScheduledBeat = {
      beatIdx: refs.beatIndexRef.current,
      timeSec: refs.nextBeatTimeRef.current,
    };
    const targetBeat = findNearestBeat(
      now,
      refs.beatTimesRef.current,
      projected
    );
    if (!targetBeat) return;

    const isTargetBeatAmbiguous = targetBeat.diffSec > beatLen / 2;
    if (isTargetBeatAmbiguous) return;

    const deviationMs = (now - targetBeat.beat.timeSec) * 1000;
    setTaps((prev) => [
      ...prev,
      {
        deviationMs,
        beatIdx: targetBeat.beat.beatIdx,
        timeSec: now,
      },
    ]);
  }, [refs]);

  const resetTaps = useCallback(() => setTaps([]), []);

  return { taps, recordTap, resetTaps };
};

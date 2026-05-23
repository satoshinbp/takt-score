"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fadeAt,
  type ScheduledBeat,
  type SchedulerRefs,
} from "./useBeatScheduler";

// Finds the beat that should currently be sounding, called from the RAF loop.
// The ring is ordered by time, so scanning from the tail and taking the first entry <= now is sufficient.
const findActiveBeat = (
  now: number,
  ring: ScheduledBeat[],
): ScheduledBeat | null => {
  for (let i = ring.length - 1; i >= 0; i--) {
    if (ring[i].timeSec <= now) return ring[i];
  }
  return null;
};

// Display-only hook. Reads the ring written by the scheduler via RAF and
// reflects "the current beat position" and "fade amount" into React state.
// It does not produce audio, nor decide whether audio plays.
// reset is called explicitly by the caller (composite hook) at start/stop boundaries.
export const useVisualBeat = (refs: SchedulerRefs) => {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(0);
  const [fadeAmount, setFadeAmount] = useState(1);

  // The scheduler clears the ring on stop by contract, so this hook only needs to
  // "read the ring and render if an active beat exists".
  // While stopped, findActiveBeat returns null, which naturally makes this a no-op.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const ctx = refs.audioContextRef.current;
      if (ctx) {
        const c = refs.configRef.current;
        const now = ctx.currentTime;
        const active = findActiveBeat(now, refs.beatTimesRef.current);
        if (active) {
          const bi = active.beatIdx;
          const beatInBar = bi % c.beatsPerBar;
          setCurrentBeat((prev) => (prev === beatInBar ? prev : beatInBar));
          setBeatIndex(bi);

          // Linearly interpolate between the current and next beat's fade values for smooth visuals.
          const beatLen = 60 / c.bpm;
          const fadeNow = fadeAt(bi, c);
          const fadeNext = fadeAt(bi + 1, c);
          const intoBeat = Math.min(
            1,
            Math.max(0, (now - active.timeSec) / beatLen),
          );
          const fade = fadeNow + (fadeNext - fadeNow) * intoBeat;
          setFadeAmount(fade);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [refs]);

  const reset = useCallback(() => {
    setCurrentBeat(-1);
    setFadeAmount(1);
  }, []);

  return { currentBeat, beatIndex, fadeAmount, reset };
};

"use client";

import { useCallback, useState } from "react";
import type { InnerTaktConfig } from "./useBeatScheduler";
import { useBeatScheduler } from "./useBeatScheduler";
import { useTapRecorder } from "./useTapRecorder";
import { useVisualBeat } from "./useVisualBeat";

export type { InnerTaktConfig, Tap } from "./useBeatScheduler";

const calcCycleProgress = (beatIndex: number, config: InnerTaktConfig) => {
  const totalBeats =
    (config.audibleBars + config.silentBars) * config.beatsPerBar;
  const pos = ((beatIndex % totalBeats) + totalBeats) % totalBeats;
  const audibleBeats = config.audibleBars * config.beatsPerBar;
  const isAudible = pos < audibleBeats;
  return {
    isAudible,
    pos: isAudible ? pos : pos - audibleBeats,
    total: isAudible ? audibleBeats : config.silentBars * config.beatsPerBar,
  };
};

export const useInnerTakt = (config: InnerTaktConfig) => {
  const [isRunning, setIsRunning] = useState(false);
  const scheduler = useBeatScheduler(config);
  const visual = useVisualBeat(scheduler.refs);
  const tap = useTapRecorder(scheduler.refs);

  const start = useCallback(() => {
    scheduler.start();
    visual.reset();
    tap.resetTaps();
    setIsRunning(true);
  }, [scheduler, visual, tap]);

  const stop = useCallback(() => {
    scheduler.stop();
    visual.reset();
    setIsRunning(false);
  }, [scheduler, visual]);

  const cycleProgress = isRunning
    ? calcCycleProgress(visual.beatIndex, config)
    : null;

  return {
    isRunning,
    currentBeat: visual.currentBeat,
    isSilent: visual.isSilent,
    fadeAmount: visual.fadeAmount,
    taps: tap.taps,
    cycleProgress,
    start,
    stop,
    recordTap: tap.recordTap,
    resetTaps: tap.resetTaps,
  };
};

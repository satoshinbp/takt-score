"use client";

import { useCallback, useState } from "react";
import type { Subdivision } from "@/lib/constants";
import {
  cloneMeasure,
  emptyBeat,
  ORNAMENT,
  PART_IDS,
  STEP,
} from "@/lib/constants";
import { readOrnament, writeOrnament } from "@/lib/ornament";
import type { ScoreDetail } from "@/types/common";

type NextStep = { velocity: number; ornament: number };

export const useDraftScore = (score: ScoreDetail) => {
  const [draft, setDraft] = useState<ScoreDetail>(() => ({
    ...score,
    measures: score.measures.map(cloneMeasure),
  }));

  const updateBeatStep = useCallback(
    (
      measureIdx: number,
      partIdx: number,
      beatIdx: number,
      stepIdx: number,
      computeNext: (currVelocity: number, currOrnament: number) => NextStep,
    ) => {
      const partId = PART_IDS[partIdx];
      setDraft((d) => {
        const measures = d.measures.map(cloneMeasure);
        const beat = measures[measureIdx][beatIdx];
        const currVelocity = beat.steps[partId][stepIdx];
        const currOrnament = readOrnament(beat, partId, stepIdx);
        const { velocity, ornament } = computeNext(currVelocity, currOrnament);
        beat.steps[partId][stepIdx] = velocity;
        measures[measureIdx][beatIdx] = writeOrnament(
          beat,
          partId,
          stepIdx,
          ornament,
        );
        return { ...d, measures };
      });
    },
    [],
  );

  const handleToggle = useCallback(
    (measureIdx: number, partIdx: number, beatIdx: number, stepIdx: number) => {
      updateBeatStep(measureIdx, partIdx, beatIdx, stepIdx, (vel, orn) => {
        const isTurningOff = vel !== STEP.OFF;
        return {
          velocity: isTurningOff ? STEP.OFF : STEP.NORMAL,
          ornament: isTurningOff ? ORNAMENT.NONE : orn,
        };
      });
    },
    [updateBeatStep],
  );

  const handleSetStep = useCallback(
    (
      measureIdx: number,
      partIdx: number,
      beatIdx: number,
      stepIdx: number,
      velocity: number,
      ornament: number,
    ) => {
      updateBeatStep(measureIdx, partIdx, beatIdx, stepIdx, () => ({
        velocity,
        ornament: velocity === STEP.OFF ? ORNAMENT.NONE : ornament,
      }));
    },
    [updateBeatStep],
  );

  const handleSubdivisionChange = useCallback(
    (measureIdx: number, beatIdx: number, subdivision: Subdivision) => {
      setDraft((d) => {
        const measures = d.measures.map(cloneMeasure);
        measures[measureIdx][beatIdx] = emptyBeat(subdivision);
        return { ...d, measures };
      });
    },
    [],
  );

  return {
    draft,
    setDraft,
    handleToggle,
    handleSetStep,
    handleSubdivisionChange,
  };
};

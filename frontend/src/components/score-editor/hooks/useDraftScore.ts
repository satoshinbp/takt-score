"use client";

import type { Dispatch, SetStateAction } from "react";
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
import type { Measure, ScoreDetail } from "@/types/common";

type NextStep = { velocity: number; ornament: number };

// Older measure snapshots are unbounded otherwise; cap so a long editing
// session cannot grow the undo stack without limit.
const MAX_HISTORY = 100;

type DraftHistory = {
  draft: ScoreDetail;
  past: Measure[][];
  future: Measure[][];
};

export const useDraftScore = (score: ScoreDetail) => {
  const [history, setHistory] = useState<DraftHistory>(() => ({
    draft: { ...score, measures: score.measures.map(cloneMeasure) },
    past: [],
    future: [],
  }));
  const { draft } = history;

  // A measure edit always replaces the measures array, while title/bpm/Spotify
  // edits keep the same reference. Checkpoint only the former so undo/redo
  // operate on musical content and ambient metadata changes pass through.
  const setDraft = useCallback<Dispatch<SetStateAction<ScoreDetail>>>(
    (updater) => {
      setHistory((h) => {
        const nextDraft =
          typeof updater === "function" ? updater(h.draft) : updater;
        if (nextDraft === h.draft) return h;
        if (nextDraft.measures === h.draft.measures) {
          return { ...h, draft: nextDraft };
        }
        return {
          draft: nextDraft,
          past: [...h.past, h.draft.measures].slice(-MAX_HISTORY),
          future: [],
        };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      const previousMeasures = h.past[h.past.length - 1];
      return {
        draft: { ...h.draft, measures: previousMeasures },
        past: h.past.slice(0, -1),
        future: [h.draft.measures, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      const nextMeasures = h.future[0];
      return {
        draft: { ...h.draft, measures: nextMeasures },
        past: [...h.past, h.draft.measures],
        future: h.future.slice(1),
      };
    });
  }, []);

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
    [setDraft],
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
    [setDraft],
  );

  return {
    draft,
    setDraft,
    handleToggle,
    handleSetStep,
    handleSubdivisionChange,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};

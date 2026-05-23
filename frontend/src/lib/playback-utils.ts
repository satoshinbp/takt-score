import type { Subdivision } from "@/lib/constants";
import type { Measure } from "@/types/common";

export const getMeasureTotalSteps = (measure: Measure): number =>
  measure.reduce((acc, beat) => acc + beat.subdivision, 0);

export const getTotalSteps = (measures: Measure[]): number =>
  measures.reduce((acc, m) => acc + getMeasureTotalSteps(m), 0);

export const getMeasureStepOffset = (measures: Measure[], mi: number): number =>
  measures.slice(0, mi).reduce((acc, m) => acc + getMeasureTotalSteps(m), 0);

export const decodeStep = (
  globalStep: number,
  measures: Measure[],
): { measureIndex: number; beatIndex: number; stepIndex: number } => {
  let remaining = globalStep;
  for (let mi = 0; mi < measures.length; mi++) {
    for (let bi = 0; bi < measures[mi].length; bi++) {
      const sub = measures[mi][bi].subdivision;
      if (remaining < sub) {
        return { measureIndex: mi, beatIndex: bi, stepIndex: remaining };
      }
      remaining -= sub;
    }
  }
  return { measureIndex: 0, beatIndex: 0, stepIndex: 0 };
};

export const stepDurationSec = (
  bpm: number,
  subdivision: Subdivision,
): number => 60 / bpm / subdivision;

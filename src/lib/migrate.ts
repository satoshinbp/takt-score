import {
  BEATS_PER_MEASURE,
  emptyBeat,
  type Measure,
  PART_IDS,
} from "@/lib/constants";

type LegacyMeasure = Record<string, number[]>;

export const isMeasureLegacy = (m: unknown): m is LegacyMeasure =>
  typeof m === "object" && m !== null && !Array.isArray(m);

export const migrateMeasureV1 = (old: LegacyMeasure): Measure =>
  Array.from({ length: BEATS_PER_MEASURE }, (_, bi) => {
    const beat = emptyBeat(4);
    PART_IDS.forEach((id) => {
      const src = old[id];
      if (Array.isArray(src)) {
        beat.steps[id] = src.slice(bi * 4, bi * 4 + 4);
      }
    });
    return beat;
  });

import type { PartId, Subdivision } from "@/lib/constants";

export type ScoreSummary = {
  id: string;
  title: string;
  bpm: number;
  previewMeasure: Measure | null;
  measuresCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ScoreDetail = ScoreSummary & {
  measures: Measure[];
};

export type Beat = {
  subdivision: Subdivision;
  steps: Record<PartId, number[]>; // length === subdivision; values are one of STEP
  ornaments?: Record<PartId, number[]>; // omitted means all NONE
};

/** Beat[] length === BEATS_PER_MEASURE */
export type Measure = Beat[];

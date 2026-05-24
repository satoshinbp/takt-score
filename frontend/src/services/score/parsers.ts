import type { ScoreDetail, ScoreSummary } from "@/types/common";

type ScoreSummaryDTO = Omit<
  ScoreSummary,
  "previewMeasure" | "measuresCount" | "createdAt" | "updatedAt"
> & {
  preview_measure: ScoreSummary["previewMeasure"];
  measures_count: number;
  created_at: string;
  updated_at: string;
};

type ScoreDetailDTO = Omit<
  ScoreDetail,
  "previewMeasure" | "measuresCount" | "createdAt" | "updatedAt"
> & {
  preview_measure: ScoreDetail["previewMeasure"];
  measures_count: number;
  created_at: string;
  updated_at: string;
};

export const parseScoreSummary = (dto: ScoreSummaryDTO): ScoreSummary => ({
  id: dto.id,
  title: dto.title,
  bpm: dto.bpm,
  previewMeasure: dto.preview_measure,
  measuresCount: dto.measures_count,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

export const parseScore = (dto: ScoreDetailDTO): ScoreDetail => ({
  ...parseScoreSummary(dto),
  measures: dto.measures,
});

export const isScoreSummaryDTO = (value: unknown): value is ScoreSummaryDTO =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ScoreSummaryDTO).id === "string" &&
  typeof (value as ScoreSummaryDTO).title === "string" &&
  typeof (value as ScoreSummaryDTO).bpm === "number" &&
  ((value as ScoreSummaryDTO).preview_measure === null ||
    Array.isArray((value as ScoreSummaryDTO).preview_measure)) &&
  typeof (value as ScoreSummaryDTO).measures_count === "number" &&
  typeof (value as ScoreSummaryDTO).created_at === "string" &&
  typeof (value as ScoreSummaryDTO).updated_at === "string";

export const isScoreDTO = (value: unknown): value is ScoreDetailDTO =>
  isScoreSummaryDTO(value) && Array.isArray((value as ScoreDetailDTO).measures);

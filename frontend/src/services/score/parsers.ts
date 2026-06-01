import type { Beat, Measure, ScoreDetail, ScoreSummary } from "@/types/common";

// The backend returns camelCase JSON; only createdAt/updatedAt arrive as ISO
// strings and need to be revived into Date instances. The rest of the payload
// is consumed structurally, so type guards focus on shape, not exhaustive
// per-field validation.

type WireScoreSummary = Omit<ScoreSummary, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type WireScoreDetail = WireScoreSummary & { measures: Measure[] };

const isMeasureLike = (v: unknown): v is Measure =>
  Array.isArray(v) &&
  v.every(
    (b) =>
      typeof b === "object" &&
      b !== null &&
      typeof (b as Beat).subdivision === "number" &&
      typeof (b as Beat).steps === "object",
  );

export const isScoreSummaryDTO = (value: unknown): value is WireScoreSummary =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as WireScoreSummary).id === "string" &&
  typeof (value as WireScoreSummary).title === "string" &&
  typeof (value as WireScoreSummary).bpm === "number" &&
  ((value as WireScoreSummary).spotifyTrackId === null ||
    typeof (value as WireScoreSummary).spotifyTrackId === "string") &&
  ((value as WireScoreSummary).previewMeasure === null ||
    isMeasureLike((value as WireScoreSummary).previewMeasure)) &&
  typeof (value as WireScoreSummary).measuresCount === "number" &&
  typeof (value as WireScoreSummary).createdAt === "string" &&
  typeof (value as WireScoreSummary).updatedAt === "string";

export const isScoreDTO = (value: unknown): value is WireScoreDetail =>
  isScoreSummaryDTO(value) &&
  Array.isArray((value as WireScoreDetail).measures);

export const parseScoreSummary = (dto: WireScoreSummary): ScoreSummary => ({
  id: dto.id,
  title: dto.title,
  bpm: dto.bpm,
  spotifyTrackId: dto.spotifyTrackId,
  previewMeasure: dto.previewMeasure,
  measuresCount: dto.measuresCount,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const parseScore = (dto: WireScoreDetail): ScoreDetail => ({
  ...parseScoreSummary(dto),
  measures: dto.measures,
});

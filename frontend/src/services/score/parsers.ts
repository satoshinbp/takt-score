import type { ScoreDetail } from "@/types/common";

type ScoreDTO = Omit<ScoreDetail, "createdAt" | "updatedAt"> & {
  created_at: string;
  updated_at: string;
};

export const parseScore = (dto: ScoreDTO): ScoreDetail => ({
  id: dto.id,
  title: dto.title,
  bpm: dto.bpm,
  measures: dto.measures,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

export const isScoreDTO = (value: unknown): value is ScoreDTO =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ScoreDTO).id === "string" &&
  typeof (value as ScoreDTO).title === "string" &&
  typeof (value as ScoreDTO).bpm === "number" &&
  Array.isArray((value as ScoreDTO).measures) &&
  typeof (value as ScoreDTO).created_at === "string" &&
  typeof (value as ScoreDTO).updated_at === "string";

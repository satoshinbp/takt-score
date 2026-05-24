import {
  isScoreDTO,
  isScoreSummaryDTO,
  parseScore,
  parseScoreSummary,
} from "@/services/score/parsers";
import type { ScoreDetail, ScoreSummary } from "@/types/common";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ScoreInput = Omit<
  ScoreDetail,
  "id" | "previewMeasure" | "measuresCount" | "createdAt" | "updatedAt"
>;

export const listScores = async (): Promise<ScoreSummary[]> => {
  const res = await fetch(`${API_BASE}/scores`);
  if (!res.ok) throw new Error(`Failed to load scores (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !data.every(isScoreSummaryDTO)) {
    throw new Error("Invalid scores data");
  }
  return data.map(parseScoreSummary);
};

export const getScore = async (id: string): Promise<ScoreDetail | null> => {
  const res = await fetch(`${API_BASE}/scores/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch score (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!isScoreDTO(data)) throw new Error("Invalid scores data");
  return parseScore(data);
};

export const createScore = async (input: ScoreInput): Promise<ScoreDetail> => {
  const res = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create score (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!isScoreDTO(data)) throw new Error("Invalid scores data");
  return parseScore(data);
};

export const updateScore = async (
  id: string,
  input: ScoreInput,
): Promise<ScoreDetail> => {
  const res = await fetch(`${API_BASE}/scores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update score (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!isScoreDTO(data)) throw new Error("Invalid scores data");
  return parseScore(data);
};

export const deleteScore = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/scores/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete score (${res.status})`);
};

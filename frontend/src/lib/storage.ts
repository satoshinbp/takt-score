import type { Score } from "@/lib/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ScoreInput = Omit<Score, "id" | "createdAt" | "updatedAt">;

type ScoreDTO = Omit<Score, "createdAt" | "updatedAt"> & {
  created_at: string;
  updated_at: string;
};

const parseScore = (dto: ScoreDTO): Score => ({
  id: dto.id,
  title: dto.title,
  bpm: dto.bpm,
  measures: dto.measures,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

export const loadScores = async (): Promise<Score[]> => {
  const res = await fetch(`${API_BASE}/scores`);
  if (!res.ok) return [];
  const dtos = (await res.json()) as ScoreDTO[];
  return dtos.map(parseScore);
};

export const getScore = async (id: string): Promise<Score | null> => {
  const res = await fetch(`${API_BASE}/scores/${id}`);
  if (!res.ok) return null;
  return parseScore((await res.json()) as ScoreDTO);
};

export const createScore = async (input: ScoreInput): Promise<Score> => {
  const res = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create score (${res.status})`);
  return parseScore((await res.json()) as ScoreDTO);
};

export const updateScore = async (
  id: string,
  input: ScoreInput,
): Promise<Score> => {
  const res = await fetch(`${API_BASE}/scores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update score (${res.status})`);
  return parseScore((await res.json()) as ScoreDTO);
};

export const deleteScore = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/scores/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete score (${res.status})`);
};

import type { Score } from "@/lib/constants";

export const loadScores = async (): Promise<Score[]> => {
  const res = await fetch("/api/scores");

  if (!res.ok) return [];

  return res.json() as Promise<Score[]>;
};

export const saveScores = async (scores: Score[]): Promise<void> => {
  await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });
};

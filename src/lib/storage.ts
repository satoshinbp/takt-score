import type { Score } from "./constants";

const KEY = "drummaster_v1";

export const loadScores = (): Score[] | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Score[]) : null;
  } catch {
    return null;
  }
};

export const saveScores = (scores: Score[]): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(scores));
  } catch {
    // storage full or unavailable — silently ignore
  }
};

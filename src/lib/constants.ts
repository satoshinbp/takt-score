export const BEATS_PER_MEASURE = 4;

export type Subdivision = 4 | 3 | 6;
// 4 = 16分音符（デフォルト）
// 3 = 8分3連（1拍を3等分）
// 6 = 16分3連・6連符（1拍を6等分）

export type PartId =
  | "CRASH"
  | "RIDE"
  | "HH_OPEN"
  | "HH"
  | "HI_TOM"
  | "MID_TOM"
  | "SNARE"
  | "LO_TOM"
  | "BD";

export const PART_IDS: PartId[] = [
  "CRASH",
  "RIDE",
  "HH_OPEN",
  "HH",
  "HI_TOM",
  "MID_TOM",
  "SNARE",
  "LO_TOM",
  "BD",
];

export type PartConfig = {
  label: string;
  short: string;
  color: string;
};

export const PARTS: Record<PartId, PartConfig> = {
  CRASH: { label: "Crash", short: "CR", color: "#d946ef" },
  RIDE: { label: "Ride", short: "RD", color: "#818cf8" },
  HH_OPEN: { label: "HH Open", short: "Ho", color: "#60a5fa" },
  HH: { label: "Hi-Hat", short: "HH", color: "#38bdf8" },
  HI_TOM: { label: "Tom 1", short: "T1", color: "#34d399" },
  MID_TOM: { label: "Tom 2", short: "T2", color: "#86efac" },
  SNARE: { label: "Snare", short: "SN", color: "#fb923c" },
  LO_TOM: { label: "Floor", short: "FT", color: "#a3e635" },
  BD: { label: "Bass", short: "BD", color: "#f87171" },
};

export type Beat = {
  subdivision: Subdivision;
  steps: Record<PartId, number[]>; // length === subdivision
};

/** Beat[] length === BEATS_PER_MEASURE */
export type Measure = Beat[];

export type Score = {
  id: string;
  title: string;
  bpm: number;
  measures: Measure[];
  createdAt: number;
  updatedAt: number;
};

export const emptyBeat = (subdivision: Subdivision = 4): Beat => ({
  subdivision,
  steps: Object.fromEntries(
    PART_IDS.map((id) => [id, Array<number>(subdivision).fill(0)]),
  ) as Record<PartId, number[]>,
});

export const emptyMeasure = (): Measure =>
  Array.from({ length: BEATS_PER_MEASURE }, () => emptyBeat());

export const cloneMeasure = (m: Measure): Measure =>
  m.map((beat) => ({
    subdivision: beat.subdivision,
    steps: Object.fromEntries(
      PART_IDS.map((id) => [id, [...beat.steps[id]]]),
    ) as Record<PartId, number[]>,
  }));

let _sid = 0;
export const newScore = (title = "New Score", bpm = 120): Score => ({
  id: `s${Date.now()}_${++_sid}`,
  title,
  bpm,
  measures: [emptyMeasure()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

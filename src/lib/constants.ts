export const SUBDIVISIONS = 16;

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
  id: PartId;
  label: string;
  short: string;
  color: string;
};

export const PARTS: PartConfig[] = [
  { id: "CRASH",   label: "Crash",   short: "CR", color: "#d946ef" },
  { id: "RIDE",    label: "Ride",    short: "RD", color: "#818cf8" },
  { id: "HH_OPEN", label: "HH Open", short: "Ho", color: "#60a5fa" },
  { id: "HH",      label: "Hi-Hat",  short: "HH", color: "#38bdf8" },
  { id: "HI_TOM",  label: "Tom 1",   short: "T1", color: "#34d399" },
  { id: "MID_TOM", label: "Tom 2",   short: "T2", color: "#86efac" },
  { id: "SNARE",   label: "Snare",   short: "SN", color: "#fb923c" },
  { id: "LO_TOM",  label: "Floor",   short: "FT", color: "#a3e635" },
  { id: "BD",      label: "Bass",    short: "BD", color: "#f87171" },
];

/** number[] length === SUBDIVISIONS; 0 = off, 1 = on (future: velocity) */
export type Measure = Record<PartId, number[]>;

export type Score = {
  id: string;
  title: string;
  bpm: number;
  measures: Measure[];
  createdAt: number;
  updatedAt: number;
};

export const emptyMeasure = (): Measure =>
  Object.fromEntries(
    PART_IDS.map((id) => [id, Array<number>(SUBDIVISIONS).fill(0)])
  ) as Measure;

export const cloneMeasure = (m: Measure): Measure =>
  Object.fromEntries(
    PART_IDS.map((id) => [id, [...m[id]]])
  ) as Measure;

let _sid = 0;
export const newScore = (title = "New Score", bpm = 120): Score => ({
  id: `s${Date.now()}_${++_sid}`,
  title,
  bpm,
  measures: [emptyMeasure()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});


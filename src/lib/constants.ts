export const SUBDIVISIONS = 16;

export type PartId =
  | "CRASH"
  | "RIDE"
  | "HH_OPEN"
  | "HH"
  | "HI_TOM"
  | "MID_TOM"
  | "LO_TOM"
  | "SNARE"
  | "BD";

export const PART_IDS: PartId[] = [
  "CRASH",
  "RIDE",
  "HH_OPEN",
  "HH",
  "HI_TOM",
  "MID_TOM",
  "LO_TOM",
  "SNARE",
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
  { id: "LO_TOM",  label: "Floor",   short: "FT", color: "#a3e635" },
  { id: "SNARE",   label: "Snare",   short: "SN", color: "#fb923c" },
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

export const makeSamples = (): Score[] => {
  const set = (m: Measure, id: PartId, steps: number[]) => {
    steps.forEach((s) => (m[id][s] = 1));
  };

  const rock = newScore("Rock Beat", 120);
  {
    const m = rock.measures[0];
    set(m, "HH",    [0, 2, 4, 6, 8, 10, 12, 14]);
    set(m, "SNARE", [4, 12]);
    set(m, "BD",    [0, 6, 8, 11]);
    set(m, "CRASH", [0]);
    rock.measures = [m, cloneMeasure(m), cloneMeasure(m), cloneMeasure(m)];
  }

  const groove = newScore("16th Groove", 105);
  {
    const m = groove.measures[0];
    set(m, "HH",    Array.from({ length: 16 }, (_, i) => i));
    set(m, "BD",    [0, 3, 8, 11]);
    set(m, "SNARE", [4, 12]);
    set(m, "HI_TOM",[6, 14]);
    set(m, "CRASH", [0]);
    groove.measures = [m, cloneMeasure(m), cloneMeasure(m)];
  }

  const shuffle = newScore("Shuffle Blues", 90);
  {
    const m = shuffle.measures[0];
    set(m, "HH",    [0, 3, 4, 6, 9, 10, 12, 15]);
    set(m, "BD",    [0, 9]);
    set(m, "SNARE", [4, 12]);
    set(m, "RIDE",  [6, 14]);
    set(m, "CRASH", [0]);
    shuffle.measures = [m, cloneMeasure(m), cloneMeasure(m), cloneMeasure(m)];
  }

  const latin = newScore("Latin Clave", 112);
  {
    const m = latin.measures[0];
    set(m, "RIDE",   [0, 3, 6, 8, 12]);
    set(m, "HH",     [2, 6, 10, 13]);
    set(m, "BD",     [0, 6]);
    set(m, "SNARE",  [4, 12]);
    set(m, "LO_TOM", [8, 14]);
    set(m, "CRASH",  [0]);
    latin.measures = [m, cloneMeasure(m)];
  }

  return [rock, groove, shuffle, latin];
}

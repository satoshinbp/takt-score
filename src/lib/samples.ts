import {
  cloneMeasure,
  type Measure,
  newScore,
  type PartId,
  type Score,
} from "@/lib/constants";

export const makeSamples = (): Score[] => {
  const set = (m: Measure, id: PartId, steps: number[]) => {
    steps.forEach((s) => {
      const bi = Math.floor(s / 4);
      const si = s % 4;
      m[bi].steps[id][si] = 1;
    });
  };

  const rock = newScore("Rock Beat", 120);
  {
    const m = rock.measures[0];
    set(m, "HH", [0, 2, 4, 6, 8, 10, 12, 14]);
    set(m, "SNARE", [4, 12]);
    set(m, "BD", [0, 6, 8, 11]);
    set(m, "CRASH", [0]);
    rock.measures = [m, cloneMeasure(m), cloneMeasure(m), cloneMeasure(m)];
  }

  const groove = newScore("16th Groove", 105);
  {
    const m = groove.measures[0];
    set(
      m,
      "HH",
      Array.from({ length: 16 }, (_, i) => i),
    );
    set(m, "BD", [0, 3, 8, 11]);
    set(m, "SNARE", [4, 12]);
    set(m, "HI_TOM", [6, 14]);
    set(m, "CRASH", [0]);
    groove.measures = [m, cloneMeasure(m), cloneMeasure(m)];
  }

  const shuffle = newScore("Shuffle Blues", 90);
  {
    const m = shuffle.measures[0];
    set(m, "HH", [0, 3, 4, 6, 9, 10, 12, 15]);
    set(m, "BD", [0, 9]);
    set(m, "SNARE", [4, 12]);
    set(m, "RIDE", [6, 14]);
    set(m, "CRASH", [0]);
    shuffle.measures = [m, cloneMeasure(m), cloneMeasure(m), cloneMeasure(m)];
  }

  const latin = newScore("Latin Clave", 112);
  {
    const m = latin.measures[0];
    set(m, "RIDE", [0, 3, 6, 8, 12]);
    set(m, "HH", [2, 6, 10, 13]);
    set(m, "BD", [0, 6]);
    set(m, "SNARE", [4, 12]);
    set(m, "LO_TOM", [8, 14]);
    set(m, "CRASH", [0]);
    latin.measures = [m, cloneMeasure(m)];
  }

  return [rock, groove, shuffle, latin];
};

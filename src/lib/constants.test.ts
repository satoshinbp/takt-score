import { describe, expect, it } from "vitest";
import {
  BEATS_PER_MEASURE,
  cloneMeasure,
  emptyBeat,
  emptyMeasure,
  PART_IDS,
} from "@/lib/constants";

describe("emptyBeat", () => {
  it("subdivision=4 gives each part a length-4 zero array for steps", () => {
    const beat = emptyBeat(4);
    expect(beat.subdivision).toBe(4);
    PART_IDS.forEach((id) => {
      expect(beat.steps[id]).toEqual([0, 0, 0, 0]);
    });
  });

  it("subdivision=3 gives each part a length-3 zero array for steps", () => {
    const beat = emptyBeat(3);
    expect(beat.subdivision).toBe(3);
    PART_IDS.forEach((id) => {
      expect(beat.steps[id]).toHaveLength(3);
      expect(beat.steps[id].every((v) => v === 0)).toBe(true);
    });
  });

  it("defaults to subdivision=4 when the argument is omitted", () => {
    expect(emptyBeat().subdivision).toBe(4);
  });
});

describe("emptyMeasure", () => {
  it(`consists of ${BEATS_PER_MEASURE} beats`, () => {
    expect(emptyMeasure()).toHaveLength(BEATS_PER_MEASURE);
  });

  it("every beat has subdivision=4", () => {
    emptyMeasure().forEach((beat) => {
      expect(beat.subdivision).toBe(4);
    });
  });

  it("every step is 0", () => {
    emptyMeasure().forEach((beat) => {
      PART_IDS.forEach((id) => {
        expect(beat.steps[id].every((v) => v === 0)).toBe(true);
      });
    });
  });
});

describe("cloneMeasure", () => {
  it("mutating the original does not affect the clone", () => {
    const original = emptyMeasure();
    const cloned = cloneMeasure(original);
    original[0].steps.HH[0] = 1;
    expect(cloned[0].steps.HH[0]).toBe(0);
  });

  it("copies subdivision correctly", () => {
    const m = emptyMeasure();
    m[1] = emptyBeat(3);
    const cloned = cloneMeasure(m);
    expect(cloned[1].subdivision).toBe(3);
  });
});

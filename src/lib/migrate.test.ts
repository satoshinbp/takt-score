import { describe, expect, it } from "vitest";
import { PART_IDS } from "@/lib/constants";
import { isMeasureLegacy, migrateMeasureV1 } from "@/lib/migrate";

describe("isMeasureLegacy", () => {
  it("returns true for an object (legacy format)", () => {
    expect(isMeasureLegacy({ HH: [0, 0, 0, 0] })).toBe(true);
  });

  it("returns false for an array (new format)", () => {
    expect(isMeasureLegacy([{ subdivision: 4, steps: {} }])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isMeasureLegacy(null)).toBe(false);
  });
});

describe("migrateMeasureV1", () => {
  const allZero = Object.fromEntries(
    PART_IDS.map((id) => [id, Array<number>(16).fill(0)])
  );

  it("all-zero legacy Measure → 4 Beats with subdivision=4", () => {
    const result = migrateMeasureV1(allZero);
    expect(result).toHaveLength(4);
    result.forEach((beat) => {
      expect(beat.subdivision).toBe(4);
    });
  });

  it("flat index 0 hit → beat 1 steps[0] is 1", () => {
    const old = {
      ...allZero,
      HH: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const result = migrateMeasureV1(old);
    expect(result[0].steps.HH[0]).toBe(1);
    expect(result[1].steps.HH[0]).toBe(0);
  });

  it("flat index 15 hit → beat 4 steps[3] is 1", () => {
    const old = {
      ...allZero,
      BD: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    };
    const result = migrateMeasureV1(old);
    expect(result[3].steps.BD[3]).toBe(1);
  });

  it("flat index 4 hit → beat 2 steps[0] is 1", () => {
    const old = {
      ...allZero,
      SNARE: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const result = migrateMeasureV1(old);
    expect(result[1].steps.SNARE[0]).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { PART_IDS } from "@/lib/constants";
import { isMeasureLegacy, migrateMeasureV1 } from "@/lib/migrate";

describe("isMeasureLegacy", () => {
  it("object（旧形式）は true", () => {
    expect(isMeasureLegacy({ HH: [0, 0, 0, 0] })).toBe(true);
  });

  it("array（新形式）は false", () => {
    expect(isMeasureLegacy([{ subdivision: 4, steps: {} }])).toBe(false);
  });

  it("null は false", () => {
    expect(isMeasureLegacy(null)).toBe(false);
  });
});

describe("migrateMeasureV1", () => {
  const allZero = Object.fromEntries(
    PART_IDS.map((id) => [id, Array<number>(16).fill(0)]),
  );

  it("全 0 の旧 Measure → subdivision=4 の Beat 4 つ", () => {
    const result = migrateMeasureV1(allZero);
    expect(result).toHaveLength(4);
    result.forEach((beat) => {
      expect(beat.subdivision).toBe(4);
    });
  });

  it("フラット index 0 のヒット → 1 拍目 steps[0] が 1", () => {
    const old = {
      ...allZero,
      HH: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const result = migrateMeasureV1(old);
    expect(result[0].steps.HH[0]).toBe(1);
    expect(result[1].steps.HH[0]).toBe(0);
  });

  it("フラット index 15 のヒット → 4 拍目 steps[3] が 1", () => {
    const old = {
      ...allZero,
      BD: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    };
    const result = migrateMeasureV1(old);
    expect(result[3].steps.BD[3]).toBe(1);
  });

  it("フラット index 4 のヒット → 2 拍目 steps[0] が 1", () => {
    const old = {
      ...allZero,
      SNARE: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const result = migrateMeasureV1(old);
    expect(result[1].steps.SNARE[0]).toBe(1);
  });
});

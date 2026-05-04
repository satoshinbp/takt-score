import { describe, expect, it } from "vitest";
import {
  BEATS_PER_MEASURE,
  cloneMeasure,
  emptyBeat,
  emptyMeasure,
  PART_IDS,
} from "@/lib/constants";

describe("emptyBeat", () => {
  it("subdivision=4 のとき各パートの steps が length 4 の 0 配列", () => {
    const beat = emptyBeat(4);
    expect(beat.subdivision).toBe(4);
    PART_IDS.forEach((id) => {
      expect(beat.steps[id]).toEqual([0, 0, 0, 0]);
    });
  });

  it("subdivision=3 のとき各パートの steps が length 3 の 0 配列", () => {
    const beat = emptyBeat(3);
    expect(beat.subdivision).toBe(3);
    PART_IDS.forEach((id) => {
      expect(beat.steps[id]).toHaveLength(3);
      expect(beat.steps[id].every((v) => v === 0)).toBe(true);
    });
  });

  it("引数省略時は subdivision=4", () => {
    expect(emptyBeat().subdivision).toBe(4);
  });
});

describe("emptyMeasure", () => {
  it(`Beat が ${BEATS_PER_MEASURE} 拍で構成される`, () => {
    expect(emptyMeasure()).toHaveLength(BEATS_PER_MEASURE);
  });

  it("全拍の subdivision が 4", () => {
    emptyMeasure().forEach((beat) => {
      expect(beat.subdivision).toBe(4);
    });
  });

  it("全ステップが 0", () => {
    emptyMeasure().forEach((beat) => {
      PART_IDS.forEach((id) => {
        expect(beat.steps[id].every((v) => v === 0)).toBe(true);
      });
    });
  });
});

describe("cloneMeasure", () => {
  it("元を変更してもクローンに影響しない", () => {
    const original = emptyMeasure();
    const cloned = cloneMeasure(original);
    original[0].steps.HH[0] = 1;
    expect(cloned[0].steps.HH[0]).toBe(0);
  });

  it("subdivision を正しくコピーする", () => {
    const m = emptyMeasure();
    m[1] = emptyBeat(3);
    const cloned = cloneMeasure(m);
    expect(cloned[1].subdivision).toBe(3);
  });
});

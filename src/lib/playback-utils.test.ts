import { describe, expect, it } from "vitest";
import { emptyBeat, emptyMeasure } from "@/lib/constants";
import {
  decodeStep,
  getMeasureStepOffset,
  getMeasureTotalSteps,
  getTotalSteps,
  stepDurationSec,
} from "@/lib/playback-utils";

const measure16 = () => emptyMeasure(); // all beats subdivision=4 → 16 steps
const measure12 = () => {
  const m = emptyMeasure();
  return m.map(() => emptyBeat(3)); // all beats subdivision=3 → 12 steps
};
const mixedMeasure = () => {
  // beat 1 is subdivision=3, the rest subdivision=4 → 3+4+4+4 = 15 steps
  const m = emptyMeasure();
  m[0] = emptyBeat(3);
  return m;
};

describe("getMeasureTotalSteps", () => {
  it("全拍 subdivision=4 → 16", () => {
    expect(getMeasureTotalSteps(measure16())).toBe(16);
  });

  it("全拍 subdivision=3 → 12", () => {
    expect(getMeasureTotalSteps(measure12())).toBe(12);
  });

  it("1拍目 subdivision=3、残り subdivision=4 → 15", () => {
    expect(getMeasureTotalSteps(mixedMeasure())).toBe(15);
  });
});

describe("getTotalSteps", () => {
  it("2小節（各16steps）→ 32", () => {
    expect(getTotalSteps([measure16(), measure16()])).toBe(32);
  });

  it("空配列 → 0", () => {
    expect(getTotalSteps([])).toBe(0);
  });
});

describe("getMeasureStepOffset", () => {
  it("mi=0 は常に 0", () => {
    expect(getMeasureStepOffset([measure16(), measure16()], 0)).toBe(0);
  });

  it("mi=1 は 1小節目の totalSteps", () => {
    expect(getMeasureStepOffset([measure16(), measure12()], 1)).toBe(16);
  });

  it("mi=2 は 2小節分の合計", () => {
    expect(
      getMeasureStepOffset([measure16(), measure12(), measure16()], 2)
    ).toBe(28);
  });
});

describe("decodeStep", () => {
  const measures = [measure16()];

  it("globalStep=0 → {mi:0, bi:0, si:0}", () => {
    expect(decodeStep(0, measures)).toEqual({
      measureIndex: 0,
      beatIndex: 0,
      stepIndex: 0,
    });
  });

  it("globalStep=4 → {mi:0, bi:1, si:0}（subdivision=4）", () => {
    expect(decodeStep(4, measures)).toEqual({
      measureIndex: 0,
      beatIndex: 1,
      stepIndex: 0,
    });
  });

  it("globalStep=15 → {mi:0, bi:3, si:3}（最終ステップ）", () => {
    expect(decodeStep(15, measures)).toEqual({
      measureIndex: 0,
      beatIndex: 3,
      stepIndex: 3,
    });
  });

  it("2小節: globalStep=16 → {mi:1, bi:0, si:0}", () => {
    expect(decodeStep(16, [measure16(), measure16()])).toEqual({
      measureIndex: 1,
      beatIndex: 0,
      stepIndex: 0,
    });
  });

  it("1拍目 subdivision=3: globalStep=3 → {mi:0, bi:1, si:0}", () => {
    expect(decodeStep(3, [mixedMeasure()])).toEqual({
      measureIndex: 0,
      beatIndex: 1,
      stepIndex: 0,
    });
  });
});

describe("stepDurationSec", () => {
  it("bpm=120, subdivision=4 → 0.125 秒（16分音符）", () => {
    expect(stepDurationSec(120, 4)).toBeCloseTo(0.125);
  });

  it("bpm=120, subdivision=3 → 約 0.1667 秒（8分3連）", () => {
    expect(stepDurationSec(120, 3)).toBeCloseTo(1 / 6);
  });

  it("bpm=60, subdivision=4 → 0.25 秒", () => {
    expect(stepDurationSec(60, 4)).toBeCloseTo(0.25);
  });
});

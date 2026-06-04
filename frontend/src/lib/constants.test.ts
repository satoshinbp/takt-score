import { describe, expect, it } from "vitest";
import {
  BEATS_PER_MEASURE,
  cloneMeasure,
  emptyBeat,
  emptyMeasure,
  newScore,
  ORNAMENT,
  PART_IDS,
} from "@/lib/constants";
import { writeOrnament } from "@/lib/ornament";

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

  it("deep-clones the ornaments field when present", () => {
    const m = emptyMeasure();
    m[0] = writeOrnament(m[0], "HH", 1, ORNAMENT.FLAM);
    const cloned = cloneMeasure(m);
    m[0].ornaments!.HH[1] = ORNAMENT.RUFF;
    expect(cloned[0].ornaments!.HH[1]).toBe(ORNAMENT.FLAM);
  });

  it("treats missing-part ornament entries as empty when cloning", () => {
    const m = emptyMeasure();
    m[0] = {
      ...m[0],
      ornaments: { HH: [1, 0, 0, 0] } as NonNullable<
        (typeof m)[0]["ornaments"]
      >,
    };
    const cloned = cloneMeasure(m);
    expect(cloned[0].ornaments!.HH).toEqual([1, 0, 0, 0]);
    expect(cloned[0].ornaments!.BD).toEqual([]);
  });
});

describe("newScore", () => {
  it("defaults title to 'New Score' and bpm to 120", () => {
    const s = newScore();
    expect(s.title).toBe("New Score");
    expect(s.bpm).toBe(120);
  });

  it("uses provided title and bpm", () => {
    const s = newScore("Hello", 90);
    expect(s.title).toBe("Hello");
    expect(s.bpm).toBe(90);
  });

  it("starts with a single empty measure", () => {
    const s = newScore();
    expect(s.measures).toHaveLength(1);
    expect(s.measuresCount).toBe(1);
    expect(s.previewMeasure).toBe(s.measures[0]);
    expect(s.id).toBe("");
    expect(s.spotifyTrackId).toBeNull();
    expect(s.createdAt).toBeInstanceOf(Date);
    expect(s.updatedAt).toBeInstanceOf(Date);
  });
});

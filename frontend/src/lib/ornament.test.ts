import { describe, expect, it } from "vitest";
import { emptyBeat, ORNAMENT, PART_IDS } from "@/lib/constants";
import { readOrnament, writeOrnament } from "@/lib/ornament";
import type { Beat } from "@/types/common";

describe("readOrnament", () => {
  it("returns NONE when beat has no ornaments field", () => {
    expect(readOrnament(emptyBeat(), "HH", 0)).toBe(ORNAMENT.NONE);
  });

  it("returns NONE when the part has no entry", () => {
    const beat: Beat = { ...emptyBeat(), ornaments: {} as Beat["ornaments"] };
    expect(readOrnament(beat, "HH", 0)).toBe(ORNAMENT.NONE);
  });

  it("returns the stored value when present", () => {
    const beat = writeOrnament(emptyBeat(), "SNARE", 2, ORNAMENT.FLAM);
    expect(readOrnament(beat, "SNARE", 2)).toBe(ORNAMENT.FLAM);
  });
});

describe("writeOrnament", () => {
  it("writing NONE on a beat without ornaments returns the same beat", () => {
    const beat = emptyBeat();
    expect(writeOrnament(beat, "HH", 0, ORNAMENT.NONE)).toBe(beat);
  });

  it("writing FLAM creates the ornaments field with arrays for every part", () => {
    const written = writeOrnament(emptyBeat(), "HH", 1, ORNAMENT.FLAM);
    expect(written.ornaments).toBeDefined();
    PART_IDS.forEach((id) => {
      expect(written.ornaments![id]).toHaveLength(4);
    });
    expect(written.ornaments!.HH[1]).toBe(ORNAMENT.FLAM);
  });

  it("preserves existing ornaments on other parts", () => {
    let beat = writeOrnament(emptyBeat(), "HH", 0, ORNAMENT.DRAG);
    beat = writeOrnament(beat, "SNARE", 1, ORNAMENT.RUFF);
    expect(readOrnament(beat, "HH", 0)).toBe(ORNAMENT.DRAG);
    expect(readOrnament(beat, "SNARE", 1)).toBe(ORNAMENT.RUFF);
  });

  it("resetting the only non-NONE entry drops the ornaments field", () => {
    const set = writeOrnament(emptyBeat(), "HH", 0, ORNAMENT.FLAM);
    const cleared = writeOrnament(set, "HH", 0, ORNAMENT.NONE);
    expect(cleared.ornaments).toBeUndefined();
  });

  it("extends the array when the step index is beyond the existing length", () => {
    const beat = emptyBeat();
    // existing length is 4 (subdivision=4). Write at index 3 to ensure normal path.
    const written = writeOrnament(beat, "BD", 3, ORNAMENT.FLAM);
    expect(written.ornaments!.BD).toHaveLength(4);
  });

  it("works on subdivision=3 beats", () => {
    const beat = emptyBeat(3);
    const written = writeOrnament(beat, "BD", 2, ORNAMENT.FLAM);
    expect(written.ornaments!.BD).toHaveLength(3);
    expect(written.ornaments!.BD[2]).toBe(ORNAMENT.FLAM);
  });

  it("writes NONE on a part that already has an ornament entry", () => {
    const beat = writeOrnament(emptyBeat(), "HH", 0, ORNAMENT.FLAM);
    const written = writeOrnament(beat, "HH", 1, ORNAMENT.NONE);
    expect(written.ornaments).toBeDefined();
    expect(written.ornaments!.HH[1]).toBe(ORNAMENT.NONE);
  });

  it("extends an existing array when the step index is beyond its current length", () => {
    const seeded = writeOrnament(emptyBeat(), "HH", 0, ORNAMENT.FLAM);
    // Truncate the BD array to simulate a part with a shorter entry, then write at index 3.
    seeded.ornaments!.BD = [0];
    const written = writeOrnament(seeded, "BD", 3, ORNAMENT.FLAM);
    expect(written.ornaments!.BD).toHaveLength(4);
    expect(written.ornaments!.BD[3]).toBe(ORNAMENT.FLAM);
  });

  it("derives step count from subdivision when steps array is missing", () => {
    const beat: Beat = { subdivision: 6, steps: {} as Beat["steps"] };
    const written = writeOrnament(beat, "HH", 0, ORNAMENT.FLAM);
    expect(written.ornaments!.HH).toHaveLength(6);
  });

  it("fills missing-part entries with empty arrays when cloning partial ornaments", () => {
    const beat: Beat = {
      ...emptyBeat(),
      ornaments: { HH: [1, 0, 0, 0] } as Beat["ornaments"],
    };
    const written = writeOrnament(beat, "BD", 0, ORNAMENT.FLAM);
    expect(written.ornaments!.HH).toEqual([1, 0, 0, 0]);
    expect(written.ornaments!.BD[0]).toBe(ORNAMENT.FLAM);
  });
});

import { describe, expect, it } from "vitest";
import { emptyMeasure } from "@/lib/constants";
import {
  isScoreDTO,
  isScoreSummaryDTO,
  parseScore,
  parseScoreSummary,
} from "@/services/score/parsers";

const validSummary = {
  id: "abc",
  title: "Test",
  bpm: 120,
  spotifyTrackId: null,
  previewMeasure: emptyMeasure(),
  measuresCount: 1,
  createdAt: "2024-01-02T03:04:05Z",
  updatedAt: "2024-01-02T03:04:05Z",
};

const validDetail = { ...validSummary, measures: [emptyMeasure()] };

describe("isScoreSummaryDTO", () => {
  it("accepts a fully-shaped summary", () => {
    expect(isScoreSummaryDTO(validSummary)).toBe(true);
  });

  it("accepts string spotifyTrackId and null previewMeasure", () => {
    expect(
      isScoreSummaryDTO({
        ...validSummary,
        spotifyTrackId: "spotify-id-xx",
        previewMeasure: null,
      }),
    ).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isScoreSummaryDTO(null)).toBe(false);
    expect(isScoreSummaryDTO("string")).toBe(false);
    expect(isScoreSummaryDTO(42)).toBe(false);
  });

  it("rejects when required fields are wrong type", () => {
    expect(isScoreSummaryDTO({ ...validSummary, id: 1 })).toBe(false);
    expect(isScoreSummaryDTO({ ...validSummary, title: 1 })).toBe(false);
    expect(isScoreSummaryDTO({ ...validSummary, bpm: "120" })).toBe(false);
    expect(isScoreSummaryDTO({ ...validSummary, measuresCount: "1" })).toBe(
      false,
    );
    expect(isScoreSummaryDTO({ ...validSummary, createdAt: 1 })).toBe(false);
    expect(isScoreSummaryDTO({ ...validSummary, updatedAt: 1 })).toBe(false);
  });

  it("rejects invalid spotifyTrackId", () => {
    expect(isScoreSummaryDTO({ ...validSummary, spotifyTrackId: 42 })).toBe(
      false,
    );
  });

  it("rejects invalid previewMeasure shape", () => {
    expect(isScoreSummaryDTO({ ...validSummary, previewMeasure: 42 })).toBe(
      false,
    );
    expect(
      isScoreSummaryDTO({
        ...validSummary,
        previewMeasure: [{ no: "subdiv" }],
      }),
    ).toBe(false);
    expect(
      isScoreSummaryDTO({
        ...validSummary,
        previewMeasure: [null],
      }),
    ).toBe(false);
    expect(
      isScoreSummaryDTO({
        ...validSummary,
        previewMeasure: [{ subdivision: "not-number", steps: {} }],
      }),
    ).toBe(false);
  });
});

describe("isScoreDTO", () => {
  it("accepts a detail with measures array", () => {
    expect(isScoreDTO(validDetail)).toBe(true);
  });

  it("rejects when measures is missing", () => {
    expect(isScoreDTO(validSummary)).toBe(false);
  });
});

describe("parseScoreSummary", () => {
  it("revives ISO date strings to Date instances", () => {
    const parsed = parseScoreSummary(validSummary);
    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.updatedAt).toBeInstanceOf(Date);
    expect(parsed.createdAt.toISOString()).toBe("2024-01-02T03:04:05.000Z");
  });

  it("preserves the remaining fields verbatim", () => {
    const parsed = parseScoreSummary(validSummary);
    expect(parsed.id).toBe("abc");
    expect(parsed.title).toBe("Test");
    expect(parsed.bpm).toBe(120);
    expect(parsed.spotifyTrackId).toBeNull();
    expect(parsed.measuresCount).toBe(1);
  });
});

describe("parseScore", () => {
  it("attaches measures on top of parseScoreSummary", () => {
    const parsed = parseScore(validDetail);
    expect(parsed.measures).toBe(validDetail.measures);
    expect(parsed.id).toBe("abc");
    expect(parsed.createdAt).toBeInstanceOf(Date);
  });
});

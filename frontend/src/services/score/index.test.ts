import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyMeasure } from "@/lib/constants";
import {
  createScore,
  deleteScore,
  getScore,
  listScores,
  updateScore,
} from "@/services/score";

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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const mockFetch = (response: Partial<Response> & { jsonValue?: unknown }) => {
  const json = vi.fn().mockResolvedValue(response.jsonValue);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json,
    }),
  );
};

describe("listScores", () => {
  it("returns parsed summaries on success", async () => {
    mockFetch({ jsonValue: [validSummary] });
    const result = await listScores();
    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it("throws when response is not ok", async () => {
    mockFetch({ ok: false, status: 500 });
    await expect(listScores()).rejects.toThrow(/500/);
  });

  it("throws when payload is not an array of summaries", async () => {
    mockFetch({ jsonValue: { not: "array" } });
    await expect(listScores()).rejects.toThrow(/Invalid/);
  });

  it("throws when any element fails the type guard", async () => {
    mockFetch({ jsonValue: [{ ...validSummary, id: 42 }] });
    await expect(listScores()).rejects.toThrow(/Invalid/);
  });
});

describe("getScore", () => {
  it("returns null on 404", async () => {
    mockFetch({ ok: false, status: 404 });
    expect(await getScore("x")).toBeNull();
  });

  it("returns parsed detail on success", async () => {
    mockFetch({ jsonValue: validDetail });
    const result = await getScore("abc");
    expect(result?.id).toBe("abc");
  });

  it("throws on other non-ok statuses", async () => {
    mockFetch({ ok: false, status: 500 });
    await expect(getScore("x")).rejects.toThrow(/500/);
  });

  it("throws when payload shape is wrong", async () => {
    mockFetch({ jsonValue: validSummary });
    await expect(getScore("x")).rejects.toThrow(/Invalid/);
  });
});

describe("createScore", () => {
  const input = {
    title: "T",
    bpm: 120,
    measures: [emptyMeasure()],
  };

  it("POSTs and returns parsed detail", async () => {
    mockFetch({ jsonValue: validDetail });
    const result = await createScore(input);
    expect(result.id).toBe("abc");
    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
  });

  it("throws on non-ok", async () => {
    mockFetch({ ok: false, status: 400 });
    await expect(createScore(input)).rejects.toThrow(/400/);
  });

  it("throws when payload shape is wrong", async () => {
    mockFetch({ jsonValue: { bad: true } });
    await expect(createScore(input)).rejects.toThrow(/Invalid/);
  });
});

describe("updateScore", () => {
  const input = { title: "T", bpm: 120, measures: [emptyMeasure()] };

  it("PUTs and returns parsed detail", async () => {
    mockFetch({ jsonValue: validDetail });
    const result = await updateScore("abc", input);
    expect(result.id).toBe("abc");
    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PUT");
  });

  it("throws on non-ok", async () => {
    mockFetch({ ok: false, status: 422 });
    await expect(updateScore("abc", input)).rejects.toThrow(/422/);
  });

  it("throws when payload shape is wrong", async () => {
    mockFetch({ jsonValue: { bad: true } });
    await expect(updateScore("abc", input)).rejects.toThrow(/Invalid/);
  });
});

describe("deleteScore", () => {
  it("DELETEs and resolves on success", async () => {
    mockFetch({});
    await expect(deleteScore("abc")).resolves.toBeUndefined();
    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
  });

  it("throws on non-ok", async () => {
    mockFetch({ ok: false, status: 500 });
    await expect(deleteScore("abc")).rejects.toThrow(/500/);
  });
});

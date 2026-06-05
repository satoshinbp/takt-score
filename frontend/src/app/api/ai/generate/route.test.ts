import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PART_IDS } from "@/lib/constants";

const messagesCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: messagesCreate };
  },
}));

const buildBeat = (subdivision: number) => ({
  subdivision,
  steps: Object.fromEntries(
    PART_IDS.map((id) => [id, new Array<number>(subdivision).fill(0)]),
  ),
});

const buildMeasure = (subdivision = 4) =>
  new Array(4).fill(null).map(() => buildBeat(subdivision));

const successfulToolUse = (measures: unknown, bpm = 120) => ({
  content: [{ type: "tool_use", input: { bpm, measures } }],
});

const makeRequest = (body: Record<string, unknown>): Request =>
  ({
    json: () => Promise.resolve(body),
  }) as unknown as Request;

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "key");
  messagesCreate.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/ai/generate", () => {
  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("returns measures + bpm when the model responds with a valid tool use", async () => {
    messagesCreate.mockResolvedValue(
      successfulToolUse([buildMeasure(), buildMeasure()], 130),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(
      makeRequest({
        songTitle: "Song",
        artist: "Artist",
        genre: "Rock",
        bpm: 130,
        measureCount: 2,
        requests: "extra",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { measures: unknown[]; bpm: number };
    expect(body.measures).toHaveLength(2);
    expect(body.bpm).toBe(130);
  });

  it("falls back to request bpm when the model returns 0", async () => {
    messagesCreate.mockResolvedValue(successfulToolUse([buildMeasure()], 0));
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(
      makeRequest({ songTitle: "S", bpm: 90, measureCount: 1 }),
    );
    const body = (await res.json()) as { bpm: number };
    expect(body.bpm).toBe(90);
  });

  it("falls back to 120 when neither model nor request supplies bpm", async () => {
    messagesCreate.mockResolvedValue(successfulToolUse([buildMeasure()], 0));
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    const body = (await res.json()) as { bpm: number };
    expect(body.bpm).toBe(120);
  });

  it("clamps bpm to [30, 300]", async () => {
    messagesCreate.mockResolvedValue(successfulToolUse([buildMeasure()], 9999));
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    const body = (await res.json()) as { bpm: number };
    expect(body.bpm).toBe(300);
  });

  it("returns 500 when the model produces no tool_use block", async () => {
    messagesCreate.mockResolvedValue({ content: [{ type: "text" }] });
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/AI failed/);
  });

  it("returns 500 when measures is not an array", async () => {
    messagesCreate.mockResolvedValue(successfulToolUse("not-array"));
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when a measure does not have 4 beats", async () => {
    messagesCreate.mockResolvedValue(
      successfulToolUse([[buildBeat(4), buildBeat(4)]]),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when a beat is not an object", async () => {
    messagesCreate.mockResolvedValue(
      successfulToolUse([[null, null, null, null]]),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when subdivision is invalid", async () => {
    messagesCreate.mockResolvedValue(
      successfulToolUse([
        [
          { subdivision: 5, steps: {} },
          buildBeat(4),
          buildBeat(4),
          buildBeat(4),
        ],
      ]),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when a step array length mismatches subdivision", async () => {
    const broken = buildBeat(4);
    broken.steps.HH = [0, 0];
    messagesCreate.mockResolvedValue(
      successfulToolUse([[broken, buildBeat(4), buildBeat(4), buildBeat(4)]]),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    expect(res.status).toBe(500);
  });

  it("normalizes truthy step values to 1 and falsy to 0", async () => {
    const beat = buildBeat(4);
    beat.steps.HH = [1, 0, 1, 0];
    messagesCreate.mockResolvedValue(
      successfulToolUse([[beat, buildBeat(4), buildBeat(4), buildBeat(4)]]),
    );
    const { POST } = await import("@/app/api/ai/generate/route");
    const res = await POST(makeRequest({ songTitle: "S", measureCount: 1 }));
    const body = (await res.json()) as {
      measures: { steps: { HH: number[] } }[][];
    };
    expect(body.measures[0][0].steps.HH).toEqual([1, 0, 1, 0]);
  });
});

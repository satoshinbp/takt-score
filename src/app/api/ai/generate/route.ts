import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  type Beat,
  BEATS_PER_MEASURE,
  type Measure,
  PART_IDS,
  type PartId,
  type Subdivision,
} from "@/lib/constants";

export type GenerateRequest = {
  songTitle: string;
  artist?: string;
  genre?: string;
  bpm?: number;
  measureCount: number;
  requests?: string;
};

export type GenerateResponse = {
  measures: Measure[];
  bpm: number;
};

const SUBDIVISIONS: Subdivision[] = [4, 3, 6];

const beatSchema = {
  type: "object",
  properties: {
    subdivision: { type: "number", enum: [4, 3, 6] },
    steps: {
      type: "object",
      description:
        "各パーツのステップ配列。配列長は subdivision と同じにすること。",
      properties: Object.fromEntries(
        PART_IDS.map((id) => [
          id,
          {
            type: "array",
            items: { type: "number", enum: [0, 1] },
          },
        ])
      ),
      required: PART_IDS,
    },
  },
  required: ["subdivision", "steps"],
};

const validateMeasures = (raw: unknown): Measure[] => {
  if (!Array.isArray(raw)) throw new Error("measures must be array");
  return raw.map((m: unknown, mi: number): Measure => {
    if (!Array.isArray(m) || m.length !== BEATS_PER_MEASURE)
      throw new Error(`measure[${mi}] must be array of ${BEATS_PER_MEASURE}`);
    return m.map((b: unknown, bi: number): Beat => {
      if (typeof b !== "object" || b === null)
        throw new Error(`measure[${mi}][${bi}] must be object`);
      const beat = b as Record<string, unknown>;
      const sub = beat.subdivision as number;
      if (!SUBDIVISIONS.includes(sub as Subdivision))
        throw new Error(`invalid subdivision ${sub}`);
      const steps = beat.steps as Record<string, unknown>;
      return {
        subdivision: sub as Subdivision,
        steps: Object.fromEntries(
          PART_IDS.map((id: PartId) => {
            const arr = steps[id];
            if (!Array.isArray(arr) || arr.length !== sub)
              throw new Error(
                `steps.${id} in measure[${mi}][${bi}] must have length ${sub}`
              );
            return [id, arr.map((v) => (v ? 1 : 0))];
          })
        ) as Record<PartId, number[]>,
      };
    });
  });
};

export const POST = async (req: Request) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const body = (await req.json()) as GenerateRequest;
  const { songTitle, artist, genre, bpm, measureCount, requests } = body;

  const client = new Anthropic({ apiKey });

  const userParts: string[] = [`曲名: ${songTitle}`];
  if (artist) userParts.push(`アーティスト: ${artist}`);
  if (genre) userParts.push(`ジャンル: ${genre}`);
  if (bpm) userParts.push(`BPM: ${bpm}`);
  userParts.push(`小節数: ${measureCount}`);
  if (requests) userParts.push(`追加リクエスト: ${requests}`);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `あなたはドラムマシン向けのパターンを生成するエキスパートです。
TaktScore というドラムシーケンサーのデータ形式で出力します。

データ構造:
- Measure = Beat[] (必ず${BEATS_PER_MEASURE}拍)
- Beat = { subdivision: 4|3|6, steps: Record<PartId, number[]> }
  - subdivision 4: 1拍を4等分 (16分音符)
  - subdivision 3: 1拍を3等分 (8分3連)
  - subdivision 6: 1拍を6等分 (16分3連)
  - steps の各配列長は subdivision と同じにすること
- PartId: ${PART_IDS.join(" / ")}

ドラムの慣習:
- SNARE は通常 2拍目・4拍目に入れる
- HH は8分音符 (steps=[1,0,1,0]) または16分音符 (steps=[1,1,1,1]) が基本
- BD (バスドラム) でグルーヴを作る
- CRASH は最初の小節の1拍目や、フレーズの頭に入れる
- 初心者向けと指定された場合はシンプルなパターンにする
- フィルはフレーズ末尾の小節で HI_TOM / MID_TOM / LO_TOM を活用する
- subdivision は原則 4 を使い、三連符の曲のみ 3 または 6 を使う`,
    tools: [
      {
        name: "generate_drum_pattern",
        description: "ドラムパターンを生成する",
        input_schema: {
          type: "object" as const,
          properties: {
            bpm: {
              type: "number",
              description: "推定または指定された BPM",
            },
            measures: {
              type: "array",
              description: `小節の配列。必ず ${measureCount} 要素`,
              items: {
                type: "array",
                description: `Beat の配列。必ず ${BEATS_PER_MEASURE} 要素`,
                items: beatSchema,
              },
            },
          },
          required: ["bpm", "measures"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "generate_drum_pattern" },
    messages: [{ role: "user", content: userParts.join("\n") }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "AI failed to generate a pattern" },
      { status: 500 }
    );
  }

  const input = toolUse.input as { bpm: number; measures: unknown };

  try {
    const measures = validateMeasures(input.measures);
    const responseBpm = Math.round(
      Math.max(30, Math.min(300, input.bpm || bpm || 120))
    );
    return NextResponse.json({
      measures,
      bpm: responseBpm,
    } satisfies GenerateResponse);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Generated data is invalid: ${msg}` },
      { status: 500 }
    );
  }
};

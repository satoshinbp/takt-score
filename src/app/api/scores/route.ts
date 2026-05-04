import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { isMeasureLegacy, migrateMeasureV1 } from "@/lib/migrate";

const FILE = join(process.cwd(), "data", "scores.json");

export const GET = () => {
  if (!existsSync(FILE)) return NextResponse.json([]);
  const raw = readFileSync(FILE, "utf-8");
  const scores: unknown[] = JSON.parse(raw) as unknown[];

  // 旧形式（Measure が Record<PartId, number[]>）を Beat[] に変換
  const migrated = scores.map((score) => {
    if (typeof score !== "object" || score === null) return score;
    const s = score as Record<string, unknown>;
    if (!Array.isArray(s.measures)) return s;

    return {
      ...s,
      measures: (s.measures as unknown[]).map((m) =>
        isMeasureLegacy(m) ? migrateMeasureV1(m) : m,
      ),
    };
  });

  return NextResponse.json(migrated);
};

export const POST = async (req: Request) => {
  const scores: unknown = await req.json();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(scores, null, 2), "utf-8");

  return NextResponse.json({ ok: true });
};

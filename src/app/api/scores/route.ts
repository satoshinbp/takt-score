import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data", "scores.json");

export const GET = () => {
  if (!existsSync(FILE)) return NextResponse.json([]);
  const raw = readFileSync(FILE, "utf-8");
  return NextResponse.json(JSON.parse(raw));
};

export const POST = async (req: Request) => {
  const scores: unknown = await req.json();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(scores, null, 2), "utf-8");

  return NextResponse.json({ ok: true });
};

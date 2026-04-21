import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data", "scores.json");

export async function GET() {
  if (!existsSync(FILE)) return NextResponse.json([]);
  const raw = readFileSync(FILE, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  const scores = await req.json();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(scores, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}

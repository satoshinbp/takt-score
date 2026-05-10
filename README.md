# TaktScore

A personal web app for entering, saving, and playing drum patterns transcribed by ear — replacing handwritten sheet music.

## Features

- **Score Editor** — Input drum patterns as 16-step grids across 9 parts (CRASH, HH, SNARE, BD, etc.)
- **Score Viewer** — Browse and playback saved scores via Web Audio API
- **Inner Takt** — Rhythm trainer with a silent-interval metronome to internalize tempo

## Tech Stack

| Layer     | Technology              |
| --------- | ----------------------- |
| Framework | Next.js 16 (App Router) |
| UI        | shadcn/ui (Radix UI)    |
| Styling   | Tailwind CSS v4         |
| Language  | TypeScript              |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Start dev server (Turbopack) |
| `pnpm build` | Production build             |
| `pnpm test`  | Run tests (Vitest)           |
| `pnpm fix`   | Format + lint fix            |

## Data

Scores are persisted to `data/scores.json` via `/api/scores`. No database required.

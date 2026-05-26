# TaktScore

A personal web app for entering, saving, and playing drum patterns transcribed by ear — replacing handwritten sheet music.

## Features

- **Score Editor** — Input drum patterns as 16-step grids across 9 parts (CRASH, HH, SNARE, BD, etc.)
- **Score Viewer** — Browse and playback saved scores via Web Audio API
- **Inner Takt** — Rhythm trainer with a silent-interval metronome to internalize tempo

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript             |
| UI       | shadcn/ui (Radix UI), Tailwind CSS v4           |
| Backend  | Go, chi, sqlc, pgx                              |
| Database | PostgreSQL 16                                   |
| Tooling  | pnpm (frontend), go / goose / sqlc (backend), Docker |

## Repository Layout

```
takt-score/
├── frontend/          # Next.js app (pnpm)
├── backend/           # Go app (chi + sqlc) + goose migrations + seed
└── docker-compose.yml # PostgreSQL for local dev
```

## Getting Started

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Backend
cd backend
make migrate-up
make seed
make run
# API: http://localhost:8000

# 3. Frontend (in a separate shell)
cd frontend
pnpm install
pnpm dev
# Open http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_BASE` from `frontend/.env.local` (defaults to `http://localhost:8000`).

## Scripts

### Frontend (`cd frontend`)

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Start dev server (Turbopack) |
| `pnpm build` | Production build             |
| `pnpm test`  | Run tests (Vitest)           |
| `pnpm fix`   | Format + lint fix            |

### Backend (`cd backend`)

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `make run`          | Start API server                  |
| `make build`        | Build server / seed binaries      |
| `make migrate-up`   | Apply goose database migrations   |
| `make seed`         | Load `seeds/scores.json` into DB  |
| `make test`         | Run Go tests                      |
| `make sqlc`         | Regenerate sqlc Go code from SQL  |
| `make fmt`          | Run `go fmt`                      |

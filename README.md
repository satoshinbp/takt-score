# TaktScore

A personal web app for entering, saving, and playing drum patterns transcribed by ear — replacing handwritten sheet music.

## Features

- **Score Editor** — Input drum patterns as 16-step grids across 9 parts (CRASH, HH, SNARE, BD, etc.)
- **Score Viewer** — Browse and playback saved scores via Web Audio API
- **Inner Takt** — Rhythm trainer with a silent-interval metronome to internalize tempo

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript   |
| UI       | shadcn/ui (Radix UI), Tailwind CSS v4 |
| Backend  | FastAPI, Pydantic v2, SQLAlchemy 2.0  |
| Database | PostgreSQL 16                         |
| Tooling  | pnpm (frontend), uv (backend), Docker |

## Repository Layout

```
takt-score/
├── frontend/          # Next.js app (pnpm)
├── backend/           # FastAPI app (uv) + Alembic + seed
└── docker-compose.yml # PostgreSQL for local dev
```

## Getting Started

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Backend
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# API docs: http://localhost:8000/docs

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

| Command                                    | Description                       |
| ------------------------------------------ | --------------------------------- |
| `uv run uvicorn app.main:app --reload`     | Start API server                  |
| `uv run alembic upgrade head`              | Apply database migrations         |
| `uv run python -m app.seed`                | Load `seeds/scores.json` into DB  |
| `uv run pytest`                            | Run integration tests (needs DB)  |
| `uv run ruff check app tests`              | Lint                              |

"""Seed scores from seeds/scores.json into the database (idempotent)."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import SessionLocal
from app.models.score import Score
from app.schemas.score import ScoreBase

SEED_PATH = Path(__file__).resolve().parent.parent / "seeds" / "scores.json"


def _from_ms(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=UTC)


def seed() -> int:
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    inserted = 0
    with SessionLocal() as session:
        for entry in data:
            ScoreBase(
                title=entry["title"],
                bpm=entry["bpm"],
                measures=entry["measures"],
            )
            stmt = (
                pg_insert(Score)
                .values(
                    id=entry["id"],
                    title=entry["title"],
                    bpm=entry["bpm"],
                    measures=entry["measures"],
                    created_at=_from_ms(entry["createdAt"]),
                    updated_at=_from_ms(entry["updatedAt"]),
                )
                .on_conflict_do_nothing(index_elements=["id"])
            )
            result = session.execute(stmt)
            if result.rowcount and result.rowcount > 0:
                inserted += 1
        session.commit()
    return inserted


def main() -> None:
    n = seed()
    print(f"Seeded {n} new scores from {SEED_PATH}")


if __name__ == "__main__":
    main()

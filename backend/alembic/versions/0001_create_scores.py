"""create scores table

Revision ID: 0001
Revises:
Create Date: 2026-05-23

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scores",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("bpm", sa.Integer(), nullable=False),
        sa.Column(
            "measures",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("bpm BETWEEN 1 AND 400", name="scores_bpm_check"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("CREATE INDEX scores_updated_at_idx ON scores (updated_at DESC)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS scores_updated_at_idx")
    op.drop_table("scores")

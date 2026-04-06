"""Add flight_anomalies table for anomaly descriptions per flight.

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d0
Create Date: 2026-03-16

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "f7a8b9c0d1e2"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET LOCAL statement_timeout = '0'"))
    # Idempotent: skip if table already exists (e.g. created manually or previous run)
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flight_anomalies'"
        )
    )
    if result.fetchone() is None:
        op.create_table(
            "flight_anomalies",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("flight_id", sa.Integer(), nullable=False),
            sa.Column("description", sa.String(length=50), nullable=False),
            sa.ForeignKeyConstraint(["flight_id"], ["flights_table.fid"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS flight_anomalies"))

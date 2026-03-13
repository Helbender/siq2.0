"""Add payload_key to qualificacoes (landing quals: ATR, ATN, precapp, nprecapp)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Avoid statement timeout on ADD COLUMN / CREATE INDEX (can block under lock)
    conn = op.get_bind()
    conn.execute(sa.text("SET LOCAL statement_timeout = '0'"))
    op.add_column(
        "qualificacoes",
        sa.Column("payload_key", sa.String(length=50), nullable=True),
    )
    op.create_index(
        op.f("ix_qualificacoes_payload_key"),
        "qualificacoes",
        ["payload_key"],
        unique=False,
    )
    # Data migration: set payload_key for existing landing quals (nome matches payload key)
    conn.execute(
        sa.text(
            "UPDATE qualificacoes SET payload_key = nome WHERE nome IN ('ATR', 'ATN', 'precapp', 'nprecapp')"
        )
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET LOCAL statement_timeout = '0'"))
    op.drop_index(op.f("ix_qualificacoes_payload_key"), table_name="qualificacoes")
    op.drop_column("qualificacoes", "payload_key")

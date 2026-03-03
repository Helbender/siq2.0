"""Add VIR, VN, CON time fields to flight_pilots

Revision ID: b2c3d4e5f6a7
Revises: c3d4e5f6a1b2
Create Date: 2026-03-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "c3d4e5f6a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Avoid statement timeout on large tables (ADD COLUMN can take time under lock)
    conn = op.get_bind()
    conn.execute(sa.text("SET LOCAL statement_timeout = '0'"))
    op.add_column("flight_pilots", sa.Column("vir", sa.String(length=5), nullable=True))
    op.add_column("flight_pilots", sa.Column("vn", sa.String(length=5), nullable=True))
    op.add_column("flight_pilots", sa.Column("con", sa.String(length=5), nullable=True))


def downgrade() -> None:
    # Use IF EXISTS so downgrade works even if upgrade failed partway
    conn = op.get_bind()
    conn.execute(sa.text("SET LOCAL statement_timeout = '0'"))
    conn.execute(sa.text("ALTER TABLE flight_pilots DROP COLUMN IF EXISTS con"))
    conn.execute(sa.text("ALTER TABLE flight_pilots DROP COLUMN IF EXISTS vn"))
    conn.execute(sa.text("ALTER TABLE flight_pilots DROP COLUMN IF EXISTS vir"))

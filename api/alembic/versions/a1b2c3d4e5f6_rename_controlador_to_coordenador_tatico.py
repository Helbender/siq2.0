"""Rename CONTROLADOR_TATICO to COORDENADOR_TATICO in tipotripulante enum

Revision ID: a1b2c3d4e5f6
Revises: 88d1c145826b
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "88d1c145826b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename enum value CONTROLADOR_TATICO to COORDENADOR_TATICO (PostgreSQL 10+).
    No-op when the enum already has COORDENADOR_TATICO (e.g. fresh DB from edited initial migration).
    """
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'tipotripulante' AND e.enumlabel = 'CONTROLADOR_TATICO'
            ) THEN
                ALTER TYPE tipotripulante RENAME VALUE 'CONTROLADOR_TATICO' TO 'COORDENADOR_TATICO';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Revert enum value COORDENADOR_TATICO back to CONTROLADOR_TATICO (only if COORDENADOR_TATICO exists)."""
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'tipotripulante' AND e.enumlabel = 'COORDENADOR_TATICO'
            ) THEN
                ALTER TYPE tipotripulante RENAME VALUE 'COORDENADOR_TATICO' TO 'CONTROLADOR_TATICO';
            END IF;
        END $$;
    """)

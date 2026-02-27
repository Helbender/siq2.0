"""Add unique constraint on tripulante_qualificacoes (tripulante_id, qualificacao_id)

Removes duplicate rows first (keeps one per pair with latest data_ultima_validacao),
then adds the constraint so duplicates cannot be re-created.

Revision ID: c3d4e5f6a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a1b2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Remove duplicates: keep one row per (tripulante_id, qualificacao_id) with latest data_ultima_validacao
    conn.execute(
        text("""
            DELETE FROM tripulante_qualificacoes
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                        ROW_NUMBER() OVER (
                            PARTITION BY tripulante_id, qualificacao_id
                            ORDER BY data_ultima_validacao DESC, id DESC
                        ) AS rn
                    FROM tripulante_qualificacoes
                ) AS ranked
                WHERE ranked.rn = 1
            )
        """)
    )
    op.create_unique_constraint(
        "uq_tripulante_qualificacao",
        "tripulante_qualificacoes",
        ["tripulante_id", "qualificacao_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_tripulante_qualificacao",
        "tripulante_qualificacoes",
        type_="unique",
    )

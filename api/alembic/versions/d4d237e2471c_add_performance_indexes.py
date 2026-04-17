"""add performance indexes

Revision ID: d4d237e2471c
Revises: a2b3c4d5e6f7
Create Date: 2026-04-17 13:26:48.920042

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4d237e2471c"
down_revision: str | None = "a2b3c4d5e6f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index("ix_flights_table_date", "flights_table", ["date"])
    op.create_index("ix_flight_pilots_pilot_id", "flight_pilots", ["pilot_id"])
    op.create_index(
        "ix_tripulante_qualificacoes_tripulante_data",
        "tripulante_qualificacoes",
        ["tripulante_id", "data_ultima_validacao"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_tripulante_qualificacoes_tripulante_data", table_name="tripulante_qualificacoes")
    op.drop_index("ix_flight_pilots_pilot_id", table_name="flight_pilots")
    op.drop_index("ix_flights_table_date", table_name="flights_table")

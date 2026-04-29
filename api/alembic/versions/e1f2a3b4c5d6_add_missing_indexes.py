"""Add missing performance indexes

Revision ID: e1f2a3b4c5d6
Revises: d4d237e2471c
Create Date: 2026-04-29

"""

from alembic import op

revision = "e1f2a3b4c5d6"
down_revision = "d4d237e2471c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_flights_table_date", "flights_table", ["date"], unique=False)
    op.create_index(
        "ix_tripulante_qualificacoes_data_ultima_validacao",
        "tripulante_qualificacoes",
        ["data_ultima_validacao"],
        unique=False,
    )
    op.create_index("ix_flight_pilots_pilot_id", "flight_pilots", ["pilot_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_flight_pilots_pilot_id", table_name="flight_pilots")
    op.drop_index(
        "ix_tripulante_qualificacoes_data_ultima_validacao",
        table_name="tripulante_qualificacoes",
    )
    op.drop_index("ix_flights_table_date", table_name="flights_table")

"""Mudar ENUM para native_enum=False

Revision ID: c34264f16adc
Revises: 75d13fb64237
Create Date: 2025-10-25 10:20:33.056275

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c34264f16adc"
down_revision: str | None = "75d13fb64237"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Converter colunas ENUM para VARCHAR (sem apagar tabelas)
    op.alter_column(
        "qualificacoes",
        "grupo",
        existing_type=postgresql.ENUM(name="grupoqualificacoes"),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.alter_column(
        "qualificacoes",
        "tipo_aplicavel",
        existing_type=postgresql.ENUM(name="tipotripulante"),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.alter_column(
        "tripulantes",
        "tipo",
        existing_type=postgresql.ENUM(name="tipotripulante"),
        type_=sa.String(),
        existing_nullable=False,
    )

    # Apagar os tipos ENUM antigos (para evitar conflitos futuros)
    op.execute("DROP TYPE IF EXISTS grupoqualificacoes CASCADE;")
    op.execute("DROP TYPE IF EXISTS tipotripulante CASCADE;")


def downgrade() -> None:
    # Recriar os ENUMs antigos
    grupo_enum = postgresql.ENUM(
        "CURRENCY",
        "MQP",
        "MQOBP",
        "MQOIP",
        "MQOAP",
        "MQOC",
        "MQOBOC",
        "CABINE_OPERATIONS",
        "COMMUNICATION",
        "SAFETY_EQUIPMENT",
        "TACTICAL_CONTROL",
        "RADAR_OPERATIONS",
        "COORDINATION",
        "SURVEILLANCE",
        "DETECTION_SYSTEMS",
        "MONITORING",
        "OPERATIONS_PLANNING",
        "LOGISTICS",
        "ADMINISTRATION",
        name="grupoqualificacoes",
    )
    tipo_enum = postgresql.ENUM(
        "PILOTO", "OPERADOR_CABINE", "CONTROLADOR_TATICO", "OPERADOR_VIGILANCIA", "OPERACOES", name="tipotripulante"
    )
    grupo_enum.create(op.get_bind(), checkfirst=True)
    tipo_enum.create(op.get_bind(), checkfirst=True)

    # Voltar a mudar as colunas para ENUM
    op.alter_column("qualificacoes", "grupo", existing_type=sa.String(), type_=grupo_enum, existing_nullable=False)
    op.alter_column(
        "qualificacoes", "tipo_aplicavel", existing_type=sa.String(), type_=tipo_enum, existing_nullable=False
    )
    op.alter_column("tripulantes", "tipo", existing_type=sa.String(), type_=tipo_enum, existing_nullable=False)

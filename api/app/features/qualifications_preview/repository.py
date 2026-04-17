"""Qualifications preview repository - database access only."""

from datetime import date, timedelta

from sqlalchemy import cast, func, select
from sqlalchemy.dialects.postgresql import INTERVAL
from sqlalchemy.orm import Session, joinedload

from app.features.qualifications.models import Qualificacao
from app.features.users.models import Tripulante, TripulanteQualificacao
from app.shared.enums import GrupoQualificacoes, StatusTripulante


class QualificationsPreviewRepository:
    """Repository for qualifications preview database operations."""

    @staticmethod
    def _base_stmt():
        return (
            select(TripulanteQualificacao)
            .join(Tripulante)
            .join(Qualificacao, TripulanteQualificacao.qualificacao_id == Qualificacao.id)
            .where(Tripulante.status == StatusTripulante.PRESENTE.value)
            .where(Qualificacao.grupo.in_([GrupoQualificacoes.MQP, GrupoQualificacoes.MQOBP]))
            .options(
                joinedload(TripulanteQualificacao.tripulante),
                joinedload(TripulanteQualificacao.qualificacao),
            )
        )

    @staticmethod
    def find_mqp_mqobp_tripulante_qualificacoes_presente(
        session: Session,
    ) -> list[TripulanteQualificacao]:
        """Find all MQP/MQOBP qualifications for PRESENTE crew (unfiltered)."""
        return list(session.execute(QualificationsPreviewRepository._base_stmt()).unique().scalars().all())

    @staticmethod
    def find_mqp_mqobp_qualificacoes_expiring(
        session: Session,
        days: int,
    ) -> list[TripulanteQualificacao]:
        """Find MQP/MQOBP qualifications expiring within `days` days (PostgreSQL only).

        Uses database-level interval arithmetic to avoid loading non-expiring rows.
        """
        threshold = date.today() + timedelta(days=days)
        expiry_expr = TripulanteQualificacao.data_ultima_validacao + cast(
            func.concat(Qualificacao.validade, " days"), INTERVAL
        )
        stmt = QualificationsPreviewRepository._base_stmt().where(expiry_expr < threshold)
        return list(session.execute(stmt).unique().scalars().all())

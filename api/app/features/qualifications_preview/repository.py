"""Qualifications preview repository - database access only."""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.features.qualifications.models import Qualificacao
from app.features.users.models import Tripulante, TripulanteQualificacao
from app.shared.enums import GrupoQualificacoes, StatusTripulante


class QualificationsPreviewRepository:
    """Repository for qualifications preview database operations."""

    @staticmethod
    def find_mqp_mqobp_tripulante_qualificacoes_presente(
        session: Session,
    ) -> list[TripulanteQualificacao]:
        """Find tripulante qualifications for crew with PRESENTE status, MQP/MQOBP groups only.

        Args:
            session: Database session

        Returns:
            List of TripulanteQualificacao with tripulante and qualificacao loaded
        """
        stmt = (
            select(TripulanteQualificacao)
            .join(Tripulante)
            .join(Qualificacao, TripulanteQualificacao.qualificacao_id == Qualificacao.id)
            .where(Tripulante.status == StatusTripulante.PRESENTE.value)
            .where(
                Qualificacao.grupo.in_([GrupoQualificacoes.MQP, GrupoQualificacoes.MQOBP])
            )
            .options(
                joinedload(TripulanteQualificacao.tripulante),
                joinedload(TripulanteQualificacao.qualificacao),
            )
        )
        return list(session.execute(stmt).unique().scalars().all())

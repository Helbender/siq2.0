"""Qualifications repository - database access only."""

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante  # type: ignore
from app.shared.enums import StatusTripulante  # type: ignore


class QualificationRepository:
    """Repository for qualification database operations."""

    @staticmethod
    def _sync_primary_key_sequence(session: Session) -> None:
        """Sync PostgreSQL sequence with current max table id.

        This handles environments where manual imports/seeds inserted explicit IDs
        and the auto-increment sequence was not advanced accordingly.
        """
        session.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('qualificacoes', 'id'),
                    COALESCE((SELECT MAX(id) FROM qualificacoes), 0)
                )
                """
            )
        )

    @staticmethod
    def find_all(session: Session) -> list[Qualificacao]:
        """Get all qualifications from database.

        Args:
            session: Database session

        Returns:
            List of Qualificacao instances ordered by grupo and nome
        """
        stmt = select(Qualificacao).order_by(Qualificacao.grupo, Qualificacao.nome)
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_by_id(session: Session, qualification_id: int) -> Qualificacao | None:
        """Find a qualification by ID.

        Args:
            session: Database session
            qualification_id: Qualification ID

        Returns:
            Qualificacao instance or None if not found
        """
        stmt = select(Qualificacao).where(Qualificacao.id == qualification_id)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_by_tipo_aplicavel(session: Session, tipo) -> list[Qualificacao]:
        """Find qualifications by applicable crew type.

        Args:
            session: Database session
            tipo: Crew type (TipoTripulante enum)

        Returns:
            List of Qualificacao instances
        """
        stmt = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tipo)
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def create(session: Session, qualification: Qualificacao) -> Qualificacao:
        """Create a new qualification.

        Args:
            session: Database session
            qualification: Qualificacao instance to create

        Returns:
            Created Qualificacao instance
        """
        session.add(qualification)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()

            # Recover automatically when the PK sequence is behind table values.
            if 'duplicate key value violates unique constraint "qualificacoes_pkey"' not in str(exc.orig):
                raise

            QualificationRepository._sync_primary_key_sequence(session)
            session.add(qualification)
            session.commit()

        session.refresh(qualification)
        return qualification

    @staticmethod
    def update(session: Session, qualification: Qualificacao) -> None:
        """Update a qualification.

        Args:
            session: Database session
            qualification: Qualificacao instance to update
        """
        session.commit()

    @staticmethod
    def delete(session: Session, qualification: Qualificacao) -> None:
        """Delete a qualification.

        Args:
            session: Database session
            qualification: Qualificacao instance to delete
        """
        session.delete(qualification)
        session.commit()

    @staticmethod
    def find_tripulantes_by_type(session: Session, tipo: str) -> list[Tripulante]:
        """Find tripulantes by type with PRESENTE status.

        Args:
            session: Database session
            tipo: Tripulante type string

        Returns:
            List of Tripulante instances
        """
        stmt = (
            select(Tripulante)
            .where(Tripulante.tipo == tipo, Tripulante.status == StatusTripulante.PRESENTE.value)
            .order_by(Tripulante.nip, Tripulante.rank)
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_tripulante_by_nip(session: Session, nip: int) -> Tripulante | None:
        """Find a tripulante by NIP.

        Args:
            session: Database session
            nip: Tripulante NIP

        Returns:
            Tripulante instance or None if not found
        """
        stmt = select(Tripulante).where(Tripulante.nip == nip)
        return session.execute(stmt).scalar_one_or_none()

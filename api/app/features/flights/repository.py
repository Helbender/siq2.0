"""Flights repository - database access only."""

from datetime import date
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.features.flights.models import Flight, FlightPilots  # type: ignore
from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante, TripulanteQualificacao  # type: ignore
from app.shared.models import year_init  # type: ignore


class FlightRepository:
    """Repository for flight database operations."""

    @staticmethod
    def find_all_with_pilots(session: Session) -> list[Flight]:
        """Get all flights with pilots loaded.

        Args:
            session: Database session

        Returns:
            List of Flight instances ordered by date descending
        """
        stmt = (
            select(Flight)
            .order_by(Flight.date.desc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_all_ordered_by_date_asc(session: Session) -> list[Flight]:
        """Get all flights ordered by date ascending with pilots.

        Args:
            session: Database session

        Returns:
            List of Flight instances ordered by date ascending
        """
        stmt = (
            select(Flight)
            .order_by(Flight.date.asc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_by_id(session: Session, flight_id: int) -> Flight | None:
        """Find a flight by ID.

        Args:
            session: Database session
            flight_id: Flight ID

        Returns:
            Flight instance or None if not found
        """
        stmt = select(Flight).where(Flight.fid == flight_id)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_by_id_with_pilots(session: Session, flight_id: int) -> Flight | None:
        """Find a flight by ID with pilots loaded.

        Args:
            session: Database session
            flight_id: Flight ID

        Returns:
            Flight instance or None if not found
        """
        stmt = (
            select(Flight)
            .where(Flight.fid == flight_id)
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        return session.execute(stmt).unique().scalar_one_or_none()

    @staticmethod
    def create(session: Session, flight: Flight) -> Flight:
        """Create a new flight.

        Args:
            session: Database session
            flight: Flight instance to create

        Returns:
            Created Flight instance
        """
        session.add(flight)
        return flight

    @staticmethod
    def flush(session: Session) -> None:
        """Flush pending changes to database.

        Args:
            session: Database session
        """
        session.flush()

    @staticmethod
    def commit(session: Session) -> None:
        """Commit changes to database.

        Args:
            session: Database session
        """
        session.commit()

    @staticmethod
    def rollback(session: Session) -> None:
        """Rollback changes.

        Args:
            session: Database session
        """
        session.rollback()

    @staticmethod
    def update(session: Session, flight: Flight) -> None:
        """Update a flight.

        Args:
            session: Database session
            flight: Flight instance to update
        """
        session.commit()

    @staticmethod
    def delete(session: Session, flight: Flight) -> None:
        """Delete a flight.

        Args:
            session: Database session
            flight: Flight instance to delete
        """
        session.delete(flight)
        session.commit()

    @staticmethod
    def find_flight_pilot(session: Session, flight_id: int, pilot_id: int) -> FlightPilots | None:
        """Find a FlightPilots record.

        Args:
            session: Database session
            flight_id: Flight ID
            pilot_id: Pilot NIP

        Returns:
            FlightPilots instance or None if not found
        """
        stmt = (
            select(FlightPilots)
            .where(FlightPilots.flight_id == flight_id)
            .where(FlightPilots.pilot_id == pilot_id)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_tripulante_by_nip(session: Session, nip: int) -> Tripulante | None:
        """Find a tripulante by NIP.

        Args:
            session: Database session
            nip: Tripulante NIP

        Returns:
            Tripulante instance or None if not found
        """
        return session.get(Tripulante, nip)  # type: ignore

    @staticmethod
    def find_qualifications_by_tipo(session: Session, tipo: Any) -> list[Qualificacao]:
        """Find qualifications by tipo aplicavel.

        Args:
            session: Database session
            tipo: TipoTripulante enum

        Returns:
            List of Qualificacao instances
        """
        stmt = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tipo)
        return list(session.scalars(stmt).all())

    @staticmethod
    def find_all_qualifications(session: Session) -> list[Qualificacao]:
        """Get all qualifications.

        Args:
            session: Database session

        Returns:
            List of all Qualificacao instances
        """
        return list(session.execute(select(Qualificacao)).scalars().all())

    @staticmethod
    def find_qualification_by_nome_and_tipo(
        session: Session, nome: str, tipo: Any
    ) -> Qualificacao | None:
        """Find a qualification by name and tipo.

        Args:
            session: Database session
            nome: Qualification name
            tipo: TipoTripulante enum

        Returns:
            Qualificacao instance or None if not found
        """
        stmt = select(Qualificacao).where(
            Qualificacao.nome == nome, Qualificacao.tipo_aplicavel == tipo
        )
        return session.scalars(stmt).first()

    @staticmethod
    def find_tripulante_qualificacoes_by_pilot_id(
        session: Session, pilot_id: int
    ) -> list[TripulanteQualificacao]:
        """Find all tripulante qualifications for a pilot.

        Args:
            session: Database session
            pilot_id: Pilot NIP

        Returns:
            List of TripulanteQualificacao instances
        """
        stmt = select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id == pilot_id
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_tripulante_qualificacoes_by_pilot_ids(
        session: Session, pilot_ids: list[int]
    ) -> list[TripulanteQualificacao]:
        """Find all tripulante qualifications for multiple pilots.

        Args:
            session: Database session
            pilot_ids: List of pilot NIPs

        Returns:
            List of TripulanteQualificacao instances
        """
        stmt = select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id.in_(pilot_ids)
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_tripulante_qualificacao(
        session: Session, tripulante_id: int, qualificacao_id: int
    ) -> TripulanteQualificacao | None:
        """Find a specific tripulante qualification.

        Args:
            session: Database session
            tripulante_id: Tripulante NIP
            qualificacao_id: Qualification ID

        Returns:
            TripulanteQualificacao instance or None if not found
        """
        stmt = select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id == tripulante_id,
            TripulanteQualificacao.qualificacao_id == qualificacao_id,
        )
        return session.scalars(stmt).first()

    @staticmethod
    def create_tripulante_qualificacao(
        session: Session, tripulante_qualificacao: TripulanteQualificacao
    ) -> TripulanteQualificacao:
        """Create a new tripulante qualification.

        Args:
            session: Database session
            tripulante_qualificacao: TripulanteQualificacao instance

        Returns:
            Created TripulanteQualificacao instance
        """
        session.add(tripulante_qualificacao)
        session.flush()
        return tripulante_qualificacao

    @staticmethod
    def update_tripulante_qualificacao(
        session: Session, tripulante_qualificacao: TripulanteQualificacao
    ) -> None:
        """Update a tripulante qualification.

        Args:
            session: Database session
            tripulante_qualificacao: TripulanteQualificacao instance to update
        """
        session.add(tripulante_qualificacao)
        session.flush()

    @staticmethod
    def find_max_flight_date_for_qualification(
        session: Session, pilot_id: int, qualificacao_id: int, exclude_flight_id: int
    ) -> date | None:
        """Find the maximum flight date for a specific qualification.

        Args:
            session: Database session
            pilot_id: Pilot NIP
            qualificacao_id: Qualification ID
            exclude_flight_id: Flight ID to exclude from search

        Returns:
            Maximum date or None if not found
        """
        qual_fields = ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]
        qual_conditions = [
            getattr(FlightPilots, field) == str(qualificacao_id) for field in qual_fields
        ]
        stmt = (
            select(func.max(Flight.date))
            .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
            .where(FlightPilots.pilot_id == pilot_id)
            .where(Flight.fid != exclude_flight_id)
            .where(or_(*qual_conditions))
        )
        result = session.execute(stmt).scalar_one_or_none()
        return result if result else date(year_init, 1, 1)

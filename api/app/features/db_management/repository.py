"""Database management repository - database access only."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.features.flights.models import Flight, FlightPilots  # type: ignore
from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante  # type: ignore


class DatabaseManagementRepository:
    """Repository for database management operations."""

    @staticmethod
    def get_flights_by_year(session: Session) -> list[dict[str, Any]]:
        """Get count of flights grouped by year.

        Args:
            session: Database session

        Returns:
            List of dictionaries with year and flight_count
        """
        stmt = (
            select(
                func.extract("year", Flight.date).label("year"),
                func.count(Flight.fid).label("flight_count"),
            )
            .group_by(func.extract("year", Flight.date))
            .order_by(func.extract("year", Flight.date).desc())
        )
        results = session.execute(stmt).all()
        
        return [
            {"year": int(row.year), "flight_count": int(row.flight_count)}
            for row in results
        ]

    @staticmethod
    def get_flights_for_year(session: Session, year: int) -> list[Flight]:
        """Get all flights for a specific year with pilots loaded.

        Args:
            session: Database session
            year: Year to filter by

        Returns:
            List of Flight instances for the specified year
        """
        stmt = (
            select(Flight)
            .where(func.extract("year", Flight.date) == year)
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
            .order_by(Flight.date.desc())
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def get_all_flights(session: Session) -> list[Flight]:
        """Get all flights with pilots loaded.

        Args:
            session: Database session

        Returns:
            List of all Flight instances
        """
        stmt = (
            select(Flight)
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
            .order_by(Flight.date.asc())
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def get_all_qualifications(session: Session) -> list[Qualificacao]:
        """Get all qualifications.

        Args:
            session: Database session

        Returns:
            List of all Qualificacao instances
        """
        stmt = select(Qualificacao).order_by(Qualificacao.grupo, Qualificacao.nome)
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def get_all_users(session: Session) -> list[Tripulante]:
        """Get all users.

        Args:
            session: Database session

        Returns:
            List of all Tripulante instances
        """
        stmt = select(Tripulante).order_by(Tripulante.nip)
        return list(session.execute(stmt).scalars().all())

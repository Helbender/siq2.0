"""Dashboard repository - database access only."""

from datetime import date

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from app.features.flights.models import Flight  # type: ignore


class DashboardRepository:
    """Repository for dashboard database operations."""

    @staticmethod
    def count_flights_by_date_range(
        session: Session, date_from: date, date_to: date
    ) -> int:
        """Count flights between two dates (inclusive).

        Args:
            session: Database session
            date_from: Start date (inclusive)
            date_to: End date (inclusive)

        Returns:
            Count of flights
        """
        result = session.execute(
            select(func.count(Flight.fid)).where(
                Flight.date >= date_from,
                Flight.date <= date_to,
            )
        ).scalar()
        return result or 0

    @staticmethod
    def find_flights_by_date_range_with_pilots(
        session: Session, date_from: date, date_to: date
    ) -> list[Flight]:
        """Find all flights between two dates (inclusive) with pilots loaded.

        Args:
            session: Database session
            date_from: Start date (inclusive)
            date_to: End date (inclusive)

        Returns:
            List of Flight instances
        """
        from app.features.flights.models import FlightPilots  # type: ignore

        stmt = (
            select(Flight)
            .where(
                Flight.date >= date_from,
                Flight.date <= date_to,
            )
            .options(joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante))
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_available_years(session: Session) -> list[int]:
        """Find all distinct years that have flights.

        Args:
            session: Database session

        Returns:
            List of years (integers) ordered descending
        """
        years = (
            session.execute(
                select(extract("year", Flight.date).label("year"))
                .distinct()
                .order_by(extract("year", Flight.date).desc())
            )
            .scalars()
            .all()
        )
        # Convert to list of integers
        return [int(year) for year in years if year is not None]


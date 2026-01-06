"""Dashboard service containing business logic for dashboard operations."""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from app.features.flights.models import Flight, FlightPilots  # type: ignore
from app.utils.time_utils import parse_time_to_minutes
from models.enums import StatusTripulante, TipoTripulante  # type: ignore
from app.features.users.models import Tripulante, TripulanteQualificacao  # type: ignore


class DashboardService:
    """Service class for dashboard business logic."""

    def get_flight_statistics(self, year: int | None, session: Session) -> dict[str, Any]:
        """Get flight statistics for dashboard.

        Args:
            year: Year to filter flights (None for current year)
            session: Database session

        Returns:
            dict with statistics data
        """
        if year is None:
            year = datetime.now(UTC).year

        # Get total flights count for the selected year
        total_flights = (
            session.execute(select(func.count(Flight.fid)).where(extract("year", Flight.date) == year)).scalar() or 0
        )

        # Get all flights for the selected year with pilots loaded
        all_flights = (
            session.execute(
                select(Flight)
                .where(extract("year", Flight.date) == year)
                .options(joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante))
            )
            .unique()
            .scalars()
            .all()
        )

        # Calculate hours by flight_type
        hours_by_type: dict[str, int] = {}  # type -> total minutes
        hours_by_action: dict[str, int] = {}  # action -> total minutes
        total_passengers = 0
        total_doe = 0
        total_cargo = 0
        total_minutes = 0  # Total flight minutes for the year
        pilot_hours: dict[int, int] = {}  # pilot_id -> total minutes
        pilot_hours_by_type: dict[TipoTripulante, dict[int, int]] = {}  # tipo -> {pilot_id -> total minutes}

        # Initialize dictionaries for each crew type
        for crew_type in TipoTripulante:
            pilot_hours_by_type[crew_type] = {}

        for flight in all_flights:
            # Parse total_time to minutes
            minutes = parse_time_to_minutes(flight.total_time)
            total_minutes += minutes  # Add to total

            # Group by flight_type
            flight_type = flight.flight_type
            hours_by_type[flight_type] = hours_by_type.get(flight_type, 0) + minutes

            # Group by flight_action
            flight_action = flight.flight_action
            hours_by_action[flight_action] = hours_by_action.get(flight_action, 0) + minutes

            # Sum passengers, doe, cargo
            total_passengers += flight.passengers or 0
            total_doe += flight.doe or 0
            total_cargo += flight.cargo or 0

            # Calculate hours per pilot (overall and by type)
            for flight_pilot in flight.flight_pilots:
                if flight_pilot.pilot_id and flight_pilot.tripulante:
                    # Skip crew members with status "Fora"
                    if flight_pilot.tripulante.status != StatusTripulante.PRESENTE:
                        continue
                    pilot_id = flight_pilot.pilot_id
                    pilot_tipo = flight_pilot.tripulante.tipo

                    # Overall hours
                    pilot_hours[pilot_id] = pilot_hours.get(pilot_id, 0) + minutes

                    # Hours by crew type
                    if pilot_tipo in pilot_hours_by_type:
                        pilot_hours_by_type[pilot_tipo][pilot_id] = (
                            pilot_hours_by_type[pilot_tipo].get(pilot_id, 0) + minutes
                        )

        # Convert minutes to hours for display and format for pie charts
        def format_for_pie_chart(data_dict: dict[str, int]) -> list[dict[str, Any]]:
            """Convert minutes dict to pie chart format with hours."""
            result = []
            for key, minutes in data_dict.items():
                hours = minutes / 60
                result.append(
                    {
                        "name": key,
                        "value": hours,  # hours for display
                        "minutes": minutes,  # keep minutes for calculations
                    }
                )
            return result

        # Calculate total hours from total minutes
        total_hours = total_minutes / 60

        # Find top pilot for each crew type
        top_pilots_by_type: dict[str, dict[str, Any] | None] = {}
        for crew_type, hours_dict in pilot_hours_by_type.items():
            if hours_dict:
                # Find the pilot ID with maximum hours for this type
                top_pilot_id = max(hours_dict, key=lambda pid: hours_dict[pid])
                top_pilot_minutes = hours_dict[top_pilot_id]
                top_pilot_obj = session.get(Tripulante, top_pilot_id)
                if top_pilot_obj:
                    top_pilots_by_type[crew_type.value] = {
                        "nip": top_pilot_obj.nip,
                        "name": top_pilot_obj.name,
                        "rank": top_pilot_obj.rank or "",
                        "hours": top_pilot_minutes / 60,  # Convert minutes to hours
                        "tipo": crew_type.value,
                    }
                else:
                    top_pilots_by_type[crew_type.value] = None
            else:
                top_pilots_by_type[crew_type.value] = None

        statistics = {
            "total_flights": total_flights,
            "total_hours": total_hours,  # Total flight hours for the year
            "hours_by_type": format_for_pie_chart(hours_by_type),
            "hours_by_action": format_for_pie_chart(hours_by_action),
            "total_passengers": total_passengers,
            "total_doe": total_doe,
            "total_cargo": total_cargo,
            "top_pilots_by_type": top_pilots_by_type,  # Top pilot for each crew type
            "year": year,
        }
        return statistics

    def get_available_years(self, session: Session) -> list[int]:
        """Get list of years that have flights in the database.

        Args:
            session: Database session

        Returns:
            List of years (integers)
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
        years_list = [int(year) for year in years if year is not None]
        return years_list

    def get_expiring_qualifications(self, session: Session, limit: int = 10) -> list[dict[str, Any]]:
        """Get top qualifications with lowest remaining days across all crew members.

        Args:
            session: Database session
            limit: Number of qualifications to return (default: 10)

        Returns:
            List of qualification dictionaries sorted by remaining days (lowest first)
        """
        # Get all TripulanteQualificacao records with related data, filtering by status Presente
        from sqlalchemy.orm import joinedload

        stmt = (
            select(TripulanteQualificacao)
            .join(Tripulante)
            .where(Tripulante.status == StatusTripulante.PRESENTE.value)
            .options(
                joinedload(TripulanteQualificacao.tripulante),
                joinedload(TripulanteQualificacao.qualificacao),
            )
        )
        all_qualifications = session.execute(stmt).unique().scalars().all()

        # Calculate remaining days for each qualification
        today = date.today()
        qualification_data = []

        for tq in all_qualifications:
            validade = tq.qualificacao.validade  # validity in days
            expiry_date = tq.data_ultima_validacao + timedelta(days=validade)
            remaining_days = (expiry_date - today).days

            qualification_data.append(
                {
                    "crew_member": {
                        "nip": tq.tripulante.nip,
                        "name": tq.tripulante.name,
                        "rank": tq.tripulante.rank or "",
                    },
                    "qualification_name": tq.qualificacao.nome,
                    "remaining_days": remaining_days,
                    "expiry_date": expiry_date.isoformat(),
                }
            )

        # Sort by remaining_days (ascending - lowest first)
        def get_remaining_days(item: dict) -> int:
            days = item["remaining_days"]
            return int(days) if isinstance(days, (int, float, str)) else 0

        qualification_data.sort(key=get_remaining_days)

        # Get top N (lowest remaining days)
        top_n = qualification_data[:limit]

        return top_n


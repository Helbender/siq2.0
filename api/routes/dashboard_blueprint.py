from __future__ import annotations  # noqa: D100, INP001

from datetime import UTC, date, datetime, timedelta
from typing import Any

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from config import engine  # type: ignore
from models.enums import StatusTripulante, TipoTripulante  # type: ignore
from app.features.flights.models import Flight, FlightPilots  # type: ignore
from models.tripulantes import Tripulante, TripulanteQualificacao  # type: ignore

dashboard = Blueprint("dashboard", __name__)


def parse_time_to_minutes(time_str: str) -> int:
    """Parse time string in format 'HH:MM' to total minutes."""
    if not time_str or time_str == "" or time_str == "__:__":
        return 0
    try:
        parts = time_str.split(":")
        if len(parts) != 2:
            return 0
        hours = int(parts[0])
        minutes = int(parts[1])
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        return 0


@dashboard.route("/statistics", methods=["GET"], strict_slashes=False)
def get_flight_statistics() -> tuple[Response, int]:
    """Get flight statistics for dashboard.

    Query Parameters:
        year (int, optional): Year to filter flights. Defaults to current year.

    Returns:
        - total_flights: Total number of flights
        - total_hours: Total flight hours for the year
        - hours_by_type: Total hours grouped by flight_type (pie chart data)
        - hours_by_action: Total hours grouped by flight_action (pie chart data)
        - total_passengers: Sum of all passengers
        - total_doe: Sum of all DOE
        - total_cargo: Sum of all cargo
        - top_pilots_by_type: Top pilot for each crew type
        - year: Selected year
    """
    # Get year from query parameter, default to current year
    year = request.args.get("year", type=int)
    if year is None:
        year = datetime.now(UTC).year

    with Session(engine) as session:
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
            flight_type = flight.flight_type  # or "Unknown"
            hours_by_type[flight_type] = hours_by_type.get(flight_type, 0) + minutes

            # Group by flight_action
            flight_action = flight.flight_action  # or "Unknown"
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
        return jsonify(statistics), 200


@dashboard.route("/available-years", methods=["GET"], strict_slashes=False)
def get_available_years() -> tuple[Response, int]:
    """Get list of years that have flights in the database."""
    with Session(engine) as session:
        # Get distinct years from flights
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
        return jsonify({"years": years_list}), 200


@dashboard.route("/expiring-qualifications", methods=["GET"], strict_slashes=False)
def get_expiring_qualifications() -> tuple[Response, int]:
    """Get top 10 qualifications with lowest remaining days across all crew members.

    Returns a list of 10 elements sorted from lowest to highest remaining days.
    Each element contains:
    - crew_member: Information about the crew member (nip, name, rank)
    - qualification_name: Name of the qualification
    - remaining_days: Number of days until expiration (can be negative if expired)
    - expiry_date: Date when the qualification expires

    Same crew member may appear multiple times if they have multiple
    qualifications among the lowest remaining days.
    """
    with Session(engine) as session:
        # Get all TripulanteQualificacao records with related data, filtering by status Presente
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

        # Get top 10 (lowest remaining days)
        top_10 = qualification_data[:10]

        return jsonify({"expiring_qualifications": top_10}), 200

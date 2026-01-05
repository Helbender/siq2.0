"""Dashboard routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from config import engine  # type: ignore

from app.features.dashboard.service import DashboardService

dashboard_bp = Blueprint("dashboard", __name__)
dashboard_service = DashboardService()


@dashboard_bp.route("/statistics", methods=["GET"], strict_slashes=False)
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

    with Session(engine) as session:
        statistics = dashboard_service.get_flight_statistics(year, session)
        return jsonify(statistics), 200


@dashboard_bp.route("/available-years", methods=["GET"], strict_slashes=False)
def get_available_years() -> tuple[Response, int]:
    """Get list of years that have flights in the database."""
    with Session(engine) as session:
        years = dashboard_service.get_available_years(session)
        return jsonify({"years": years}), 200


@dashboard_bp.route("/expiring-qualifications", methods=["GET"], strict_slashes=False)
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
        expiring_qualifications = dashboard_service.get_expiring_qualifications(session)
        return jsonify({"expiring_qualifications": expiring_qualifications}), 200


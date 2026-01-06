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

    ---
    tags:
      - Dashboard
    summary: Get flight statistics
    description: Retrieve comprehensive flight statistics for the dashboard, optionally filtered by year
    parameters:
      - in: query
        name: year
        type: integer
        required: false
        description: Year to filter flights (defaults to current year)
        example: 2024
    responses:
      200:
        description: Flight statistics
        schema:
          type: object
          properties:
            total_flights:
              type: integer
              description: Total number of flights
            total_hours:
              type: number
              description: Total flight hours for the year
            hours_by_type:
              type: object
              description: Total hours grouped by flight_type (pie chart data)
            hours_by_action:
              type: object
              description: Total hours grouped by flight_action (pie chart data)
            total_passengers:
              type: integer
              description: Sum of all passengers
            total_doe:
              type: integer
              description: Sum of all DOE
            total_cargo:
              type: integer
              description: Sum of all cargo
            top_pilots_by_type:
              type: object
              description: Top pilot for each crew type
            year:
              type: integer
              description: Selected year
    """
    # Get year from query parameter, default to current year
    year = request.args.get("year", type=int)

    with Session(engine) as session:
        statistics = dashboard_service.get_flight_statistics(year, session)
        return jsonify(statistics), 200


@dashboard_bp.route("/available-years", methods=["GET"], strict_slashes=False)
def get_available_years() -> tuple[Response, int]:
    """Get list of years that have flights in the database.

    ---
    tags:
      - Dashboard
    summary: Get available years
    description: Retrieve a list of all years that have flights in the database
    responses:
      200:
        description: List of available years
        schema:
          type: object
          properties:
            years:
              type: array
              items:
                type: integer
              description: List of years with flight data
              example: [2022, 2023, 2024]
    """
    with Session(engine) as session:
        years = dashboard_service.get_available_years(session)
        return jsonify({"years": years}), 200


@dashboard_bp.route("/expiring-qualifications", methods=["GET"], strict_slashes=False)
def get_expiring_qualifications() -> tuple[Response, int]:
    """Get top 10 qualifications with lowest remaining days across all crew members.

    ---
    tags:
      - Dashboard
    summary: Get expiring qualifications
    description: |
      Retrieve the top 10 qualifications with the lowest remaining days across all crew members.
      Returns a list sorted from lowest to highest remaining days.
      Same crew member may appear multiple times if they have multiple qualifications among the lowest remaining days.
    responses:
      200:
        description: List of expiring qualifications
        schema:
          type: object
          properties:
            expiring_qualifications:
              type: array
              maxItems: 10
              items:
                type: object
                properties:
                  crew_member:
                    type: object
                    properties:
                      nip:
                        type: integer
                      name:
                        type: string
                      rank:
                        type: string
                  qualification_name:
                    type: string
                    description: Name of the qualification
                  remaining_days:
                    type: integer
                    description: Number of days until expiration (can be negative if expired)
                  expiry_date:
                    type: string
                    format: date
                    description: Date when the qualification expires
    """
    with Session(engine) as session:
        expiring_qualifications = dashboard_service.get_expiring_qualifications(session)
        return jsonify({"expiring_qualifications": expiring_qualifications}), 200


"""Dashboard routes - thin request/response handlers."""

from datetime import date

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.dashboard.policies import require_authenticated
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
        name: date_from
        type: string
        format: date
        required: false
        description: Start date (YYYY-MM-DD). Defaults to Jan 1 of current year.
      - in: query
        name: date_to
        type: string
        format: date
        required: false
        description: End date (YYYY-MM-DD). Defaults to today.
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
            date_from:
              type: string
              format: date
              description: Start date of range
            date_to:
              type: string
              format: date
              description: End date of range
    """
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    date_from_str = request.args.get("date_from")
    date_to_str = request.args.get("date_to")

    date_from = None
    date_to = None
    if date_from_str:
        try:
            date_from = date.fromisoformat(date_from_str)
        except ValueError:
            return jsonify({"error": f"Invalid date_from: '{date_from_str}'. Expected YYYY-MM-DD."}), 400
    if date_to_str:
        try:
            date_to = date.fromisoformat(date_to_str)
        except ValueError:
            return jsonify({"error": f"Invalid date_to: '{date_to_str}'. Expected YYYY-MM-DD."}), 400

    with Session(engine) as session:
        try:
            session.execute(text("SET statement_timeout = '0'"))
        except Exception:
            pass
        statistics = dashboard_service.get_flight_statistics(
            date_from, date_to, session
        )
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
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    with Session(engine) as session:
        years = dashboard_service.get_available_years(session)
        return jsonify({"years": years}), 200


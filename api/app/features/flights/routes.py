"""Flights routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy.orm import Session

from config import engine  # type: ignore

from app.features.flights.schemas import (
    FlightCreateSchema,
    FlightUpdateSchema,
    validate_request,
)
from app.features.flights.service import FlightService

flights_bp = Blueprint("flights", __name__)
flight_service = FlightService()

# Schema instances
flight_create_schema = FlightCreateSchema()
flight_update_schema = FlightUpdateSchema()


@flights_bp.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_flights() -> tuple[Response, int]:
    """Handle GET (list all flights) and POST (create flight) requests."""
    if request.method == "GET":
        with Session(engine) as session:
            flights = flight_service.get_all_flights(session)
            return jsonify(flights), 200

    # POST - Create new flight
    # verify_jwt_in_request()  # Commented out in original
    flight_data: dict | None = request.get_json()
    if flight_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(flight_create_schema, flight_data)
    if errors:
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    with Session(engine, autoflush=False) as session:
        result = flight_service.create_flight(validated_data, session)

        if "message" in result and isinstance(result["message"], int):
            return jsonify(result), 201

        return jsonify(result), 400


@flights_bp.route("/<int:flight_id>", methods=["DELETE", "PATCH"], strict_slashes=False)
def handle_flights(flight_id: int) -> tuple[Response, int]:
    """Handle DELETE and PATCH requests for a specific flight."""
    if request.method == "PATCH":
        verify_jwt_in_request()
        flight_data: dict | None = request.get_json()
        if flight_data is None:
            return jsonify({"message": "Request body must be JSON"}), 400

        validated_data, errors = validate_request(flight_update_schema, flight_data)
        if errors:
            error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
            return jsonify({"message": error_message}), 400

        with Session(engine, autoflush=False) as session:
            result = flight_service.update_flight(flight_id, validated_data, session)

            if "message" in result:
                return jsonify(result), 204

            return jsonify(result), 400

    if request.method == "DELETE":
        verify_jwt_in_request()

        with Session(engine, autoflush=False) as session:
            result = flight_service.delete_flight(flight_id, session)

            if "deleted_id" in result:
                return jsonify(result), 200

            return jsonify(result), 404

    return jsonify({"message": "Bad Manual Request"}), 403


@flights_bp.route("/reprocess-all-qualifications", methods=["POST"], strict_slashes=False)
def reprocess_all_qualifications() -> tuple[Response, int]:
    """Reprocess all flights and update crew qualifications."""
    verify_jwt_in_request()

    with Session(engine, autoflush=False) as session:
        result = flight_service.reprocess_all_qualifications(session)
        return jsonify(result), 200


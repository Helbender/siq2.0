"""Flights routes - thin request/response handlers."""

import logging

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.flights.schemas import (
    FlightCreateSchema,
    FlightUpdateSchema,
    format_validation_errors,
    validate_request,
)
from app.features.flights.service import FlightService
from app.shared.permissions import require_permission

logger = logging.getLogger(__name__)
flights_bp = Blueprint("flights", __name__)
flight_service = FlightService()

# Schema instances
flight_create_schema = FlightCreateSchema()
flight_update_schema = FlightUpdateSchema()


@flights_bp.route("/", methods=["GET"], strict_slashes=False)
@require_permission("flights.read")
def list_flights() -> tuple[Response, int]:
    """List all flights.

    ---
    tags:
      - Flights
    summary: List all flights
    security:
      - Bearer: []
    responses:
      200:
        description: List of all flights
        schema:
          type: array
          items:
            type: object
    """
    try:
        page_str = request.args.get("page")
        per_page_str = request.args.get("per_page")
        page = max(1, int(page_str or 1))
        per_page = min(500, max(1, int(per_page_str or 100)))
        airtask = request.args.get("airtask") or None
        tail_number = request.args.get("tail_number") or None
        action = request.args.get("action") or None
        atd = request.args.get("atd") or None
        date_from = request.args.get("date_from") or None
        date_to = request.args.get("date_to") or None
        with Session(engine) as session:
            return jsonify(
                flight_service.get_all_flights_paginated(
                    session,
                    page,
                    per_page,
                    airtask=airtask,
                    tail_number=tail_number,
                    action=action,
                    atd=atd,
                    date_from=date_from,
                    date_to=date_to,
                )
            ), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        logger.exception("[flights] GET / error: %s", e)
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500


@flights_bp.route("/", methods=["POST"], strict_slashes=False)
@require_permission("flights.write")
def create_flight_route() -> tuple[Response, int]:
    """Create a new flight.

    ---
    tags:
      - Flights
    summary: Create a new flight
    security:
      - Bearer: []
    responses:
      201:
        description: Flight created successfully
        schema:
          type: object
          properties:
            message:
              type: integer
              description: Created flight ID
      400:
        description: Validation error or bad request
    """
    flight_data: dict | None = request.get_json()
    if flight_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(flight_create_schema, flight_data)
    if errors:
        error_message = format_validation_errors(errors)
        logger.warning("[flights] POST validation failed: %s", error_message)
        return jsonify({"message": error_message}), 400

    with Session(engine, autoflush=False) as session:
        result = flight_service.create_flight(validated_data, session)

        if "message" in result and isinstance(result["message"], int):
            return jsonify(result), 201

        msg = result.get("message", result)
        logger.warning("[flights] POST create_flight failed: %s", msg)
        return jsonify(result), 400


@flights_bp.route("/anomaly-descriptions", methods=["GET"], strict_slashes=False)
@require_permission("flights.read")
def get_anomaly_descriptions() -> tuple[Response, int]:
    """Return distinct anomaly descriptions for an aircraft (tail number).

    Query params: tailnumber (required, integer).
    """
    try:
        tailnumber = int(request.args.get("tailnumber", 0))
    except (ValueError, TypeError):
        return jsonify({"message": "tailnumber must be an integer"}), 400

    if tailnumber <= 0:
        return jsonify([]), 200

    with Session(engine) as session:
        descriptions = flight_service.get_anomaly_descriptions_by_tailnumber(session, tailnumber)
        return jsonify(descriptions), 200


@flights_bp.route("/by-crew", methods=["GET"], strict_slashes=False)
@require_permission("flights.read")
def search_flights_by_crew() -> tuple[Response, int]:
    """Search flights by crew member name or NIP, with optional date range.

    Query params: search (required), date_from (optional YYYY-MM-DD), date_to (optional YYYY-MM-DD).
    """
    search = request.args.get("search", "")
    date_from = request.args.get("date_from") or None
    date_to = request.args.get("date_to") or None

    try:
        with Session(engine) as session:
            flights = flight_service.get_flights_by_crew_search(session, search, date_from=date_from, date_to=date_to)
            return jsonify(flights), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        logger.exception("[flights] GET /by-crew error: %s", e)
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500


@flights_bp.route("/<int:flight_id>", methods=["DELETE", "PATCH", "PUT"], strict_slashes=False)
@require_permission("flights.write")
def handle_flights(flight_id: int) -> tuple[Response, int]:
    """Handle DELETE, PATCH and PUT requests for a specific flight.

    ---
    tags:
      - Flights
    summary: Update or delete a flight
    description: |
      PATCH/PUT: Update flight information
      DELETE: Delete a flight by ID
    parameters:
      - in: path
        name: flight_id
        type: integer
        required: true
        description: Flight ID
      - in: body
        name: body
        description: Updated flight data (for PATCH)
        required: false
        schema:
          type: object
          properties:
            airtask:
              type: string
            date:
              type: string
              format: date
            origin:
              type: string
            destination:
              type: string
            ATD:
              type: string
            ATA:
              type: string
            ATE:
              type: string
            flightType:
              type: string
            flightAction:
              type: string
            tailNumber:
              type: string
            totalLandings:
              type: integer
            passengers:
              type: integer
            doe:
              type: integer
            cargo:
              type: integer
            numberOfCrew:
              type: integer
            orm:
              type: integer
            fuel:
              type: integer
            activationFirst:
              type: string
            activationLast:
              type: string
            readyAC:
              type: string
            medArrival:
              type: string
            flight_pilots:
              type: array
              items:
                type: object
    security:
      - Bearer: []
    responses:
      200:
        description: Flight deleted successfully (DELETE)
        schema:
          type: object
          properties:
            deleted_id:
              type: integer
      204:
        description: Flight updated successfully (PATCH)
        schema:
          type: object
          properties:
            message:
              type: string
      400:
        description: Validation error or bad request
        schema:
          type: object
          properties:
            message:
              type: string
      403:
        description: Forbidden
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Flight not found
        schema:
          type: object
          properties:
            message:
              type: string
    """
    logger.info("[flights] %s /api/flights/%s", request.method, flight_id)

    if request.method in ("PATCH", "PUT"):
        flight_data: dict | None = request.get_json()
        if flight_data is None:
            logger.warning("[flights] PATCH/PUT %s: body is not JSON", flight_id)
            return jsonify({"message": "Request body must be JSON"}), 400

        validated_data, errors = validate_request(flight_update_schema, flight_data)
        if errors:
            error_message = format_validation_errors(errors)
            logger.warning("[flights] PATCH/PUT %s validation failed: %s", flight_id, error_message)
            return jsonify({"message": error_message}), 400

        with Session(engine, autoflush=False) as session:
            result = flight_service.update_flight(flight_id, validated_data, session)

            if "message" in result:
                logger.info("[flights] PATCH/PUT %s updated successfully", flight_id)
                return jsonify(result), 204

            msg = result.get("message", result)
            logger.warning("[flights] PATCH/PUT %s update failed: %s", flight_id, msg)
            return jsonify(result), 400

    if request.method == "DELETE":
        with Session(engine, autoflush=False) as session:
            result = flight_service.delete_flight(flight_id, session)

            if "deleted_id" in result:
                logger.info("[flights] DELETE %s deleted successfully", flight_id)
                return jsonify(result), 200

            logger.warning("[flights] DELETE %s not found", flight_id)
            return jsonify(result), 404

    logger.warning("[flights] %s %s method not handled", request.method, flight_id)
    return jsonify({"message": "Bad Manual Request"}), 403


@flights_bp.route("/reprocess-all-qualifications", methods=["POST"], strict_slashes=False)
@require_permission("flights.write")
def reprocess_all_qualifications() -> tuple[Response, int]:
    """Reprocess all flights and update crew qualifications.

    ---
    tags:
      - Flights
    summary: Reprocess all flight qualifications
    description: Reprocess all flights in the database and update crew member qualifications based on flight data
    security:
      - Bearer: []
    responses:
      200:
        description: Qualification reprocessing completed
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Reprocessing completed"
            processed:
              type: integer
              description: Number of flights processed
            updated:
              type: integer
              description: Number of qualifications updated
            errors:
              type: array
              items:
                type: object
    """
    with Session(engine, autoflush=False) as session:
        result = flight_service.reprocess_all_qualifications(session)
        return jsonify(result), 200

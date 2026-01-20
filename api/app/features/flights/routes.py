"""Flights routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.flights.policies import require_authenticated
from app.features.flights.schemas import (
    FlightCreateSchema,
    FlightUpdateSchema,
    validate_request,
)
from app.features.flights.service import FlightService
from app.shared.enums import Role
from app.shared.permissions import require_role

flights_bp = Blueprint("flights", __name__)
flight_service = FlightService()

# Schema instances
flight_create_schema = FlightCreateSchema()
flight_update_schema = FlightUpdateSchema()


@flights_bp.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_flights() -> tuple[Response, int]:
    """Handle GET (list all flights) and POST (create flight) requests.

    ---
    tags:
      - Flights
    summary: List all flights or create a new flight
    description: |
      GET: Retrieve all flights from the database
      POST: Create a new flight with crew and pilot information
    parameters:
      - in: body
        name: body
        description: Flight data (for POST)
        required: false
        schema:
          type: object
          required:
            - airtask
            - date
            - flight_pilots
          properties:
            airtask:
              type: string
              minLength: 1
              maxLength: 7
              example: "MISS01"
            date:
              type: string
              format: date
              pattern: "^\\d{4}-\\d{2}-\\d{2}$"
              example: "2024-01-15"
            origin:
              type: string
              maxLength: 4
              example: "LPPT"
            destination:
              type: string
              maxLength: 4
              example: "LPMA"
            ATD:
              type: string
              description: Actual time of departure (HH:MM)
              example: "08:30"
            ATA:
              type: string
              description: Actual time of arrival (HH:MM)
              example: "10:45"
            ATE:
              type: string
              description: Actual time en route (HH:MM)
              example: "02:15"
            flightType:
              type: string
              example: "Training"
            flightAction:
              type: string
              example: "Search and Rescue"
            tailNumber:
              type: string
              example: "FAP-502"
            totalLandings:
              type: integer
              default: 0
            passengers:
              type: integer
              default: 0
            doe:
              type: integer
              default: 0
            cargo:
              type: integer
              default: 0
            numberOfCrew:
              type: integer
              default: 0
            orm:
              type: integer
              default: 0
            fuel:
              type: integer
              default: 0
            activationFirst:
              type: string
              default: "__:__"
            activationLast:
              type: string
              default: "__:__"
            readyAC:
              type: string
              default: "__:__"
            medArrival:
              type: string
              default: "__:__"
            flight_pilots:
              type: array
              minItems: 1
              items:
                type: object
                required:
                  - nip
                properties:
                  nip:
                    type: integer
                  name:
                    type: string
                  position:
                    type: string
                  ATR:
                    type: integer
                  ATN:
                    type: integer
                  precapp:
                    type: integer
                  nprecapp:
                    type: integer
                  QUAL1:
                    type: string
                  QUAL2:
                    type: string
                  QUAL3:
                    type: string
                  QUAL4:
                    type: string
                  QUAL5:
                    type: string
                  QUAL6:
                    type: string
    responses:
      200:
        description: List of all flights (GET)
        schema:
          type: array
          items:
            type: object
      201:
        description: Flight created successfully (POST)
        schema:
          type: object
          properties:
            message:
              type: integer
              description: Created flight ID
      400:
        description: Validation error or bad request
        schema:
          type: object
          properties:
            message:
              type: string
    """
    if request.method == "GET":
        # Check authentication and require READONLY level (20) or above for viewing
        auth_error = require_authenticated()
        if auth_error:
            return auth_error

        # Check role level for viewing flights
        from flask_jwt_extended import get_jwt, get_jwt_identity

        from app.features.auth.repository import AuthRepository

        nip_identity = get_jwt_identity()
        claims = get_jwt()

        # Handle admin case
        if isinstance(nip_identity, str) and nip_identity == "admin":
            user_role_level = Role.SUPER_ADMIN.level
        else:
            try:
                nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid user identity"}), 401

            # Get role level from JWT claims first
            user_role_level = claims.get("roleLevel")
            if user_role_level is None:
                # Fallback to database
                repository = AuthRepository()
                with Session(engine) as session:
                    current_user = repository.find_user_by_nip(session, nip)
                    if current_user is None:
                        return jsonify({"error": "User not found"}), 404
                    user_role_level = current_user.role.level if current_user.role else current_user.role_level

        if user_role_level is None or user_role_level < Role.READONLY.level:
            return jsonify({"error": "Forbidden - READONLY level or above required"}), 403

        try:
            with Session(engine) as session:
                flights = flight_service.get_all_flights(session)
                return jsonify(flights), 200
        except Exception as e:
            print(f"Error in GET /flights: {e}")
            import traceback

            traceback.print_exc()
            return jsonify({"message": f"Internal server error: {str(e)}"}), 500

    # POST - Create new flight
    # Require FLYERS level (60) or above for creating flights
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    # Check role level for creating flights
    from flask_jwt_extended import get_jwt, get_jwt_identity

    from app.features.auth.repository import AuthRepository

    nip_identity = get_jwt_identity()
    claims = get_jwt()

    # Handle admin case
    if isinstance(nip_identity, str) and nip_identity == "admin":
        user_role_level = Role.SUPER_ADMIN.level
    else:
        try:
            nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid user identity"}), 401

        # Get role level from JWT claims first
        user_role_level = claims.get("roleLevel")
        if user_role_level is None:
            # Fallback to database
            repository = AuthRepository()
            with Session(engine) as session:
                current_user = repository.find_user_by_nip(session, nip)
                if current_user is None:
                    return jsonify({"error": "User not found"}), 404
                user_role_level = current_user.role.level if current_user.role else current_user.role_level

    if user_role_level is None or user_role_level < Role.USER.level:
        return jsonify({"error": "Forbidden - USER level or above required"}), 403

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
@require_role(Role.FLYERS.level)
def handle_flights(flight_id: int) -> tuple[Response, int]:
    """Handle DELETE and PATCH requests for a specific flight.

    ---
    tags:
      - Flights
    summary: Update or delete a flight
    description: |
      PATCH: Update flight information
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
    if request.method == "PATCH":
        # Check authentication
        auth_error = require_authenticated()
        if auth_error:
            return auth_error

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
        # Check authentication
        auth_error = require_authenticated()
        if auth_error:
            return auth_error

        with Session(engine, autoflush=False) as session:
            result = flight_service.delete_flight(flight_id, session)

            if "deleted_id" in result:
                return jsonify(result), 200

            return jsonify(result), 404

    return jsonify({"message": "Bad Manual Request"}), 403


@flights_bp.route("/reprocess-all-qualifications", methods=["POST"], strict_slashes=False)
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
    # Check authentication
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    with Session(engine, autoflush=False) as session:
        result = flight_service.reprocess_all_qualifications(session)
        return jsonify(result), 200

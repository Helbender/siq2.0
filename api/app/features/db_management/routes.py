"""Database management routes - thin request/response handlers."""

import json
import traceback
from io import BytesIO

from flask import Blueprint, Response, jsonify, request, send_file
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.db_management.service import DatabaseManagementService
from app.shared.permissions import require_role
from app.shared.enums import Role

db_management_bp = Blueprint("db_management", __name__)
db_management_service = DatabaseManagementService()


@db_management_bp.route("/flights-by-year", methods=["GET"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def get_flights_by_year() -> tuple[Response, int]:
    """Get count of flights grouped by year.

    ---
    tags:
      - Database Management
    summary: Get flights count by year
    description: Retrieve statistics showing number of flights per year
    security:
      - Bearer: []
    responses:
      200:
        description: List of years with flight counts
        schema:
          type: array
          items:
            type: object
            properties:
              year:
                type: integer
                example: 2024
              flight_count:
                type: integer
                example: 150
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            stats = db_management_service.get_flights_by_year(session)
            return jsonify(stats), 200
    except Exception as e:
        print(f"Error in GET /db-management/flights-by-year: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/flights-by-year/<int:year>", methods=["DELETE"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def delete_year(year: int) -> tuple[Response, int]:
    """Delete all flights for a specific year.

    This will cascade delete all FlightPilots records associated with those flights.

    ---
    tags:
      - Database Management
    summary: Delete all flights for a year
    description: |
      Delete all flights for a specific year. This operation will:
      - Update pilot qualifications before deletion
      - Delete all flights for the year
      - Cascade delete all FlightPilots records (automatic)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: year
        type: integer
        required: true
        description: Year to delete flights for
        example: 2023
    responses:
      200:
        description: Year deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Successfully deleted 150 flights for year 2023"
            year:
              type: integer
              example: 2023
            deleted_count:
              type: integer
              example: 150
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: No flights found for the specified year
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            result = db_management_service.delete_year(session, year)
            
            if result["deleted_count"] == 0:
                return jsonify({"error": f"No flights found for year {year}"}), 404
            
            return jsonify(result), 200
    except Exception as e:
        print(f"Error in DELETE /db-management/flights-by-year/{year}: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/rebackup-flights", methods=["POST"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def rebackup_flights() -> tuple[Response, int]:
    """Rebackup all flights to Google Drive.

    ---
    tags:
      - Database Management
    summary: Rebackup all flights to Google Drive
    description: |
      Process all flights in the database and upload them to Google Drive.
      This operation runs in the background and may take some time.
    security:
      - Bearer: []
    responses:
      200:
        description: Backup process started
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Queued 150 flights for backup to Google Drive"
            total_flights:
              type: integer
              example: 150
            queued:
              type: integer
              example: 150
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            result = db_management_service.rebackup_flights(session)
            return jsonify(result), 200
    except Exception as e:
        print(f"Error in POST /db-management/rebackup-flights: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/rebackup-flights/<int:year>", methods=["POST"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def rebackup_flights_by_year(year: int) -> tuple[Response, int]:
    """Rebackup all flights for a specific year to Google Drive.

    ---
    tags:
      - Database Management
    summary: Rebackup flights for a year to Google Drive
    description: |
      Process all flights for a specific year and upload them to Google Drive.
      This operation runs in the background and may take some time.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: year
        type: integer
        required: true
        description: Year to backup flights for
        example: 2024
    responses:
      200:
        description: Backup process started
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Queued 150 flights for year 2024 for backup to Google Drive"
            year:
              type: integer
              example: 2024
            total_flights:
              type: integer
              example: 150
            queued:
              type: integer
              example: 150
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: No flights found for the specified year
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            result = db_management_service.rebackup_flights_by_year(session, year)
            
            if result.get("total_flights", 0) == 0:
                return jsonify({"error": f"No flights found for year {year}"}), 404
            
            return jsonify(result), 200
    except Exception as e:
        print(f"Error in POST /db-management/rebackup-flights/{year}: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/export/qualifications", methods=["GET"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def export_qualifications() -> tuple[Response, int]:
    """Export all qualifications as JSON download.

    ---
    tags:
      - Database Management
    summary: Download qualifications backup
    description: Export all qualifications to a JSON file for backup
    security:
      - Bearer: []
    responses:
      200:
        description: Qualifications backup file
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            qualifications = db_management_service.export_qualifications(session)
            
            # Create JSON file in memory
            json_data = json.dumps(qualifications, indent=2, ensure_ascii=False)
            json_bytes = BytesIO(json_data.encode("utf-8"))
            
            return send_file(
                json_bytes,
                mimetype="application/json",
                as_attachment=True,
                download_name="qualifications_backup.json",
            ), 200
    except Exception as e:
        print(f"Error in GET /db-management/export/qualifications: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/export/users", methods=["GET"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def export_users() -> tuple[Response, int]:
    """Export all users as JSON download.

    ---
    tags:
      - Database Management
    summary: Download users backup
    description: Export all users to a JSON file for backup
    security:
      - Bearer: []
    responses:
      200:
        description: Users backup file
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        with Session(engine) as session:
            users = db_management_service.export_users(session)
            
            # Create JSON file in memory
            json_data = json.dumps(users, indent=2, ensure_ascii=False)
            json_bytes = BytesIO(json_data.encode("utf-8"))
            
            return send_file(
                json_bytes,
                mimetype="application/json",
                as_attachment=True,
                download_name="users_backup.json",
            ), 200
    except Exception as e:
        print(f"Error in GET /db-management/export/users: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@db_management_bp.route("/import/qualifications", methods=["POST"], strict_slashes=False)
@require_role(Role.SUPER_ADMIN.level)
def import_qualifications() -> tuple[Response, int]:
    """Import qualifications from JSON backup file.

    ---
    tags:
      - Database Management
    summary: Upload qualifications backup
    description: Import qualifications from a JSON backup file
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: JSON file containing qualifications backup
    responses:
      200:
        description: Import completed successfully
        schema:
          type: object
          properties:
            message:
              type: string
            created:
              type: integer
            updated:
              type: integer
            errors:
              type: integer
            error_details:
              type: array
              items:
                type: string
      400:
        description: Bad request - invalid file or format
        schema:
          type: object
          properties:
            error:
              type: string
      403:
        description: Forbidden - Super Admin access required
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Read and parse JSON file
        try:
            file_content = file.read()
            qualifications_data = json.loads(file_content.decode("utf-8"))
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Invalid JSON file: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Error reading file: {str(e)}"}), 400

        if not isinstance(qualifications_data, list):
            return jsonify({"error": "JSON file must contain an array of qualifications"}), 400

        with Session(engine) as session:
            result = db_management_service.import_qualifications(qualifications_data, session)
            return jsonify(result), 200

    except Exception as e:
        print(f"Error in POST /db-management/import/qualifications: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

"""Users routes - thin request/response handlers."""

import json

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy.orm import Session

from config import engine  # type: ignore

from app.features.users.schemas import (
    UserCreateSchema,
    UserUpdateSchema,
    validate_request,
)
from app.features.users.service import UserService

users_bp = Blueprint("users", __name__)
user_service = UserService()

# Schema instances
user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()


@users_bp.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_user() -> tuple[Response, int]:
    """Handle GET (list all users) and POST (create user) requests.

    ---
    tags:
      - Users
    summary: List all users or create a new user
    description: |
      GET: Retrieve all users from the database
      POST: Create a new user
    parameters:
      - in: body
        name: body
        description: User data (for POST)
        required: false
        schema:
          type: object
          required:
            - nip
            - name
            - tipo
          properties:
            nip:
              type: integer
              description: User NIP
              example: 123456
            name:
              type: string
              description: User full name
              example: "João Silva"
            tipo:
              type: string
              description: Crew type (TipoTripulante enum value)
              example: "Piloto"
            rank:
              type: string
              description: User rank
              example: "Tenente"
            position:
              type: string
              description: User position
              example: "Piloto de Linha"
            email:
              type: string
              format: email
              description: User email address
              example: "joao.silva@example.com"
            admin:
              type: boolean
              description: Whether user has admin privileges
              default: false
            status:
              type: string
              description: User status
              default: "Presente"
    responses:
      200:
        description: List of all users (GET)
        schema:
          type: array
          items:
            type: object
            properties:
              nip:
                type: integer
              name:
                type: string
              tipo:
                type: string
              rank:
                type: string
              position:
                type: string
              email:
                type: string
              admin:
                type: boolean
              status:
                type: string
      201:
        description: User created successfully (POST)
        schema:
          type: object
          properties:
            id:
              type: integer
              description: Created user NIP
      400:
        description: Validation error or bad request
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Validation error"
    """
    if request.method == "GET":
        with Session(engine) as session:
            users = user_service.get_all_users(session)
            return jsonify(users), 200

    # POST - Create new user
    # verify_jwt_in_request()  # Commented out in original
    user_data: dict | None = request.get_json()
    if user_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(user_create_schema, user_data)
    if errors:
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    with Session(engine) as session:
        result = user_service.create_user(validated_data, session)

        if "id" in result:
            return jsonify(result), 201

        return jsonify(result), 400


@users_bp.route("/<nip>", methods=["DELETE", "PATCH"], strict_slashes=False)
def modify_user(nip: int) -> tuple[Response, int]:
    """Handle DELETE and PATCH requests for a specific user.

    ---
    tags:
      - Users
    summary: Update or delete a user
    description: |
      PATCH: Update user information
      DELETE: Delete a user by NIP
    parameters:
      - in: path
        name: nip
        type: integer
        required: true
        description: User NIP
      - in: body
        name: body
        description: Updated user data (for PATCH)
        required: false
        schema:
          type: object
          properties:
            name:
              type: string
            tipo:
              type: string
            rank:
              type: string
            position:
              type: string
            email:
              type: string
              format: email
            admin:
              type: boolean
            status:
              type: string
    security:
      - Bearer: []
    responses:
      200:
        description: User updated or deleted successfully
        schema:
          type: object
          properties:
            deleted_id:
              type: integer
              description: Deleted user NIP (DELETE)
            nip:
              type: integer
              description: Updated user NIP (PATCH)
      400:
        description: Validation error
        schema:
          type: object
          properties:
            message:
              type: string
      403:
        description: Forbidden or unauthorized
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: User not found
        schema:
          type: object
          properties:
            message:
              type: string
    """
    verify_jwt_in_request()

    if request.method == "DELETE":
        with Session(engine) as session:
            result = user_service.delete_user(nip, session)

            if "deleted_id" in result:
                return jsonify(result), 200

            return jsonify(result), 404

    if request.method == "PATCH":
        user_data: dict | None = request.get_json()
        if user_data is None:
            return jsonify({"message": "Request body must be JSON"}), 400

        validated_data, errors = validate_request(user_update_schema, user_data)
        if errors:
            error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
            return jsonify({"message": error_message}), 400

        with Session(engine) as session:
            result = user_service.update_user(nip, validated_data, session)

            if "message" in result:
                status_code = 404 if "not found" in result["message"] else 403
                return jsonify(result), status_code

            return jsonify(result), 200

    return jsonify({"message": "Bad Manual Request"}), 403


@users_bp.route("/add_users", methods=["POST"], strict_slashes=False)
def add_users() -> tuple[Response, int]:
    """Add users from JSON file upload.

    ---
    tags:
      - Users
    summary: Bulk create users from JSON file
    description: Upload a JSON file containing an array of users to create them in bulk
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: JSON file containing array of user objects
    security:
      - Bearer: []
    responses:
      201:
        description: Users created successfully
        schema:
          type: object
          properties:
            created:
              type: integer
              description: Number of users created
            failed:
              type: integer
              description: Number of users that failed to create
            errors:
              type: array
              items:
                type: object
      400:
        description: Invalid file or JSON format
        schema:
          type: object
          properties:
            error:
              type: string
    """
    verify_jwt_in_request()

    if "file" not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Nome de ficheiro vazio"}), 400

    try:
        content = file.read().decode("utf-8")
        data = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Erro ao ler ficheiro JSON: {e!s}"}), 400

    if not isinstance(data, list):
        return jsonify({"error": "JSON file must contain an array of users"}), 400

    with Session(engine) as session:
        result = user_service.bulk_create_users(data, session)
        return jsonify(result), 201


@users_bp.route("/backup", methods=["GET"], strict_slashes=False)
def backup_users() -> tuple[Response, int]:
    """Create backup of all users and upload to Google Drive.

    ---
    tags:
      - Users
    summary: Create users backup
    description: Export all users to JSON and upload to Google Drive
    responses:
      200:
        description: Backup created and uploaded successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Backup created and uploaded to Google Drive"
            file_id:
              type: string
              description: Google Drive file ID
    """
    with Session(engine) as session:
        result = user_service.backup_users(session)
        return jsonify(result), 200


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
    """Handle GET (list all users) and POST (create user) requests."""
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
    """Handle DELETE and PATCH requests for a specific user."""
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
    """Add users from JSON file upload."""
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
    """Create backup of all users and upload to Google Drive."""
    with Session(engine) as session:
        result = user_service.backup_users(session)
        return jsonify(result), 200


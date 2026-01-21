"""Users routes - thin request/response handlers."""

import json

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.users.policies import (
    can_modify_user,
    get_current_user_role_level,
    require_authenticated,
    require_can_modify_user,
)
from app.features.users.schemas import (
    UserCreateSchema,
    UserUpdateSchema,
    validate_request,
)
from app.features.users.repository import UserRepository
from app.features.users.service import UserService
from app.shared.enums import Role

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
        try:
            # Check authentication
            auth_error = require_authenticated()
            if auth_error:
                return auth_error
            
            # All users can see all users - no role-based filtering for viewing
            with Session(engine) as session:
                all_users = user_service.get_all_users(session)
                return jsonify(all_users), 200
        except Exception as e:
            print(f"Error in GET /users: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"message": f"Internal server error: {str(e)}"}), 500

    # POST - Create new user
    # Check authentication
    auth_error = require_authenticated()
    if auth_error:
        return auth_error
    
    user_data: dict | None = request.get_json()
    if user_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(user_create_schema, user_data)
    if errors:
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    # Check role level permissions for new user
    if "roleLevel" in validated_data:
        from flask_jwt_extended import get_jwt_identity
        current_user_role_level = get_current_user_role_level()
        current_user_nip = get_jwt_identity()
        new_user_role_level = validated_data["roleLevel"]
        # For creating new users, we don't have a target NIP yet, so pass None
        # READONLY users cannot create new users (they can only modify themselves)
        if current_user_role_level == Role.READONLY.level:
            return jsonify({
                "message": "Readonly users cannot create new users"
            }), 403
        if not can_modify_user(current_user_role_level, new_user_role_level, current_user_nip, None):
            return jsonify({
                "message": "You can only create users with roles at or below your role level"
            }), 403

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
    # Check authentication
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    if request.method == "DELETE":
        with Session(engine) as session:
            # Check if current user can modify the target user
            target_user = UserRepository.find_by_nip(session, nip)
            if target_user is None:
                return jsonify({"message": f"User with NIP {nip} not found"}), 404
            
            # Check role level permissions
            permission_error = require_can_modify_user(target_user)
            if permission_error:
                return permission_error
            
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
            # Check if current user can modify the target user
            target_user = UserRepository.find_by_nip(session, nip)
            if target_user is None:
                return jsonify({"message": f"User with NIP {nip} not found"}), 404
            
            # Check role level permissions
            permission_error = require_can_modify_user(target_user)
            if permission_error:
                return permission_error
            
            # If updating roleLevel, check that new level is at or below current user's level
            if "roleLevel" in validated_data:
                current_user_role_level = get_current_user_role_level()
                new_role_level = validated_data["roleLevel"]
                if not can_modify_user(current_user_role_level, new_role_level):
                    return jsonify({
                        "message": "You can only assign roles at or below your role level"
                    }), 403
            
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
    # Check authentication
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

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


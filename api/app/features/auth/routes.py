"""Authentication routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import unset_jwt_cookies
from sqlalchemy.orm import Session

from config import engine  # type: ignore

from app.features.auth.schemas import (
    LoginRequestSchema,
    PasswordUpdateRequestSchema,
    RecoveryRequestSchema,
    validate_request,
)
from app.features.auth.service import AuthService

auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()

# Schema instances
login_schema = LoginRequestSchema()
recovery_schema = RecoveryRequestSchema()
password_update_schema = PasswordUpdateRequestSchema()


@auth_bp.route("/token", methods=["POST"])
def create_token() -> tuple[Response | dict[str, str], int]:
    """Handle user login and return JWT token."""
    login_data: dict | None = request.get_json()
    if login_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(login_schema, login_data)
    if errors:
        # Format Marshmallow validation errors for user-friendly response
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    with Session(engine) as session:
        result = auth_service.authenticate_user(
            validated_data["nip"],
            validated_data["password"],
            session,
        )

        if "access_token" in result:
            return result, 201

        status_code = 401 if "Wrong password" in result.get("message", "") else 404
        return jsonify(result), status_code


@auth_bp.route("/logout", methods=["POST"])
def logout() -> tuple[Response, int]:
    """Clear the login token on server side."""
    response = jsonify({"msg": "logout sucessful"})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/recovery", methods=["POST"])
def recover_process() -> tuple[Response, int]:
    """Validate password recovery token."""
    recovery_data: dict | None = request.get_json()
    if recovery_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(recovery_schema, recovery_data)
    if errors:
        # Format Marshmallow validation errors for user-friendly response
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    with Session(engine) as session:
        result = auth_service.validate_recovery_token(
            validated_data["email"],
            validated_data["token"],
            session,
        )

        if "nip" in result:
            return jsonify(result), 200

        status_code = 403 if "already was used" in result.get("message", "") else 408
        return jsonify(result), status_code


@auth_bp.route("/recover/<email>", methods=["POST"])
def recover_pass(email: str) -> tuple[Response, int]:
    """Initiate password recovery by sending recovery email."""
    with Session(engine) as session:
        result = auth_service.initiate_password_recovery(email, session)

        if "Recovery email sent" in result.get("message", ""):
            return jsonify(result), 200

        return jsonify(result), 404


@auth_bp.route("/storenewpass/<nip>", methods=["PATCH"])
def store_new_password(nip: int) -> tuple[Response, int]:
    """Update user password."""
    user_data: dict | None = request.get_json()
    if user_data is None:
        return jsonify({"message": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(password_update_schema, user_data)
    if errors:
        # Format Marshmallow validation errors for user-friendly response
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"message": error_message}), 400

    with Session(engine) as session:
        result = auth_service.update_password(nip, validated_data["password"], session)

        if "message" in result:
            status_code = 403 if "can not be empty" in result["message"] else 404
            return jsonify(result), status_code

        return jsonify(result), 200

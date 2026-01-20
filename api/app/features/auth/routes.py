"""Authentication routes - thin request/response handlers."""

import os

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, unset_jwt_cookies
from sqlalchemy.orm import Session

from app.core.config import engine
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


@auth_bp.route("/login", methods=["POST"])
def create_token() -> tuple[Response | dict[str, str], int]:
    """Handle user login and return JWT token.

    ---
    tags:
      - Authentication
    summary: User login
    description: Authenticate a user and receive a JWT access token
    parameters:
      - in: body
        name: body
        description: Login credentials
        required: true
        schema:
          type: object
          required:
            - nip
            - password
          properties:
            nip:
              type: integer
              description: User NIP (or "admin" for admin login)
              example: 123456
            password:
              type: string
              description: User password
              example: "password123"
    responses:
      201:
        description: Login successful
        schema:
          type: object
          properties:
            access_token:
              type: string
              description: JWT access token
              example: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
      400:
        description: Validation error
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Validation error"
            errors:
              type: object
      401:
        description: Wrong password
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Wrong password"
      404:
        description: User not found
        schema:
          type: object
          properties:
            message:
              type: string
              example: "No user with the NIP 123456"
    """
    try:
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
                response = jsonify(result)
                # Set refresh token in httpOnly cookie
                cookie_kwargs = AuthService.get_refresh_token_cookie_kwargs(result["refresh_token"])
                response.set_cookie(**cookie_kwargs)
                return response, 201

            status_code = 401 if "Wrong password" in result.get("message", "") else 404
            return jsonify(result), status_code
    except Exception as e:
        print(f"Error in POST /token: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current authenticated user."""
    try:
        nip_identity = get_jwt_identity()

        with Session(engine) as session:
            result = auth_service.get_current_user(nip_identity, session)

            if "error" in result:
                status_code = 404 if "not found" in result["error"] else 400
                return jsonify(result), status_code

            return jsonify(result), 200
    except Exception as e:
        import traceback

        print(f"[auth/me] Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to get user"}), 500


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token."""
    try:
        nip = get_jwt_identity()
        print(f"[auth/refresh] Refreshing token for NIP: {nip}")
        access_token, error = AuthService.refresh_access_token(nip)

        if error:
            print(f"[auth/refresh] Error refreshing token: {error}")
            return jsonify({"error": error}), 404

        print(f"[auth/refresh] Successfully refreshed token for NIP: {nip}")
        return jsonify({"access_token": access_token}), 200
    except Exception as e:
        import traceback

        print(f"[auth/refresh] Exception during refresh: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to refresh token"}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout() -> tuple[Response, int]:
    """Clear the login token on server side."""
    response = jsonify({"msg": "logout sucessful"})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/clear-refresh-token", methods=["POST"])
def clear_refresh_token() -> tuple[Response, int]:
    """Manually clear the refresh token cookie.
    
    This endpoint allows you to clear the refresh token cookie without logging out.
    Useful for testing or forcing a re-login.
    """
    response = jsonify({"msg": "Refresh token cleared successfully"})
    # Clear the siq2_refresh_token cookie by setting it to empty with expires=0
    response.set_cookie(
        "siq2_refresh_token",
        "",
        expires=0,
        path="/api/auth",
        httponly=True,
        samesite="Lax",
        secure=os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true",
    )
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

"""JWT configuration and error handlers."""

import os
from datetime import timedelta

from flask import Flask, jsonify, make_response, request
from flask_jwt_extended import JWTManager


def setup_jwt(app: Flask) -> JWTManager:
    """Configure JWT for the Flask application.

    Args:
        app: Flask application instance

    Returns:
        JWTManager instance
    """
    JWT_KEY: str = os.environ.get("JWT_KEY", "")

    # Validate JWT_KEY is set and secure
    if not JWT_KEY:
        print("WARNING: JWT_KEY environment variable is not set or empty!")
        print("This will cause token signature verification to fail.")
        print("Please set JWT_KEY in your .env file.")
        print("Run 'python scripts/generate_jwt_key.py' to generate a secure key.")
    elif len(JWT_KEY) < 32:
        print(f"WARNING: JWT_KEY is too short (length: {len(JWT_KEY)})!")
        print("JWT keys should be at least 32 characters for security.")
        print("If you changed JWT_KEY, existing tokens will be invalid.")
        print("Users will need to log in again to get new tokens.")
        print("Run 'python scripts/generate_jwt_key.py' to generate a secure key.")
        print(f"JWT_KEY loaded (length: {len(JWT_KEY)}) - but it's insecure!")
    else:
        print(f"JWT_KEY loaded successfully (length: {len(JWT_KEY)})")

    app.config["JWT_SECRET_KEY"] = JWT_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    # Allow access tokens in headers and refresh tokens in cookies
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"
    # Refresh tokens will be read from cookies
    app.config["JWT_REFRESH_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_REFRESH_COOKIE_NAME"] = "siq2_refresh_token"  # Unique name to avoid conflicts with other apps
    app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/auth"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_CSRF_IN_COOKIES"] = False
    app.config["JWT_CSRF_CHECK_FORM"] = False
    # Cookie settings. For cross-origin (e.g. frontend on render.com, API on another subdomain),
    # set JWT_COOKIE_SECURE=true and JWT_COOKIE_SAMESITE=None so the refresh cookie is sent.
    app.config["JWT_COOKIE_SECURE"] = os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true"
    app.config["JWT_COOKIE_HTTPONLY"] = True
    samesite = os.environ.get("JWT_COOKIE_SAMESITE", "Lax")
    if samesite.lower() == "none":
        app.config["JWT_COOKIE_SAMESITE"] = "None"
        app.config["JWT_COOKIE_SECURE"] = True  # required when SameSite=None
    else:
        app.config["JWT_COOKIE_SAMESITE"] = "Lax"

    jwt = JWTManager(app)
    _register_jwt_error_handlers(jwt, app)
    return jwt


def _register_jwt_error_handlers(jwt: JWTManager, app: Flask) -> None:
    """Register JWT error handlers.

    Args:
        jwt: JWTManager instance
        app: Flask application instance
    """

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"[JWT] Invalid token on {request.path}")

        response = make_response(jsonify({"error": "Invalid or expired token"}), 401)

        if request.path == "/api/auth/refresh":
            response.set_cookie(
                "siq2_refresh_token",
                "",
                expires=0,
                path="/api/auth",
                httponly=True,
                samesite=app.config.get("JWT_COOKIE_SAMESITE", "Lax"),
                secure=app.config.get("JWT_COOKIE_SECURE", False),
            )

        return response

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authorization token is missing"}), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Fresh token required"}), 401

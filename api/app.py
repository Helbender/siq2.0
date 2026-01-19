from __future__ import annotations  # noqa: D100, INP001

import os
from datetime import timedelta

from dotenv import load_dotenv
from flasgger import Swagger  # type: ignore
from flask import Flask, jsonify, request
from flask_cors import CORS  # type: ignore
from flask_jwt_extended import (
    JWTManager,
)

from app.api.openapi import OPENAPI_CONFIG
from app.api.routes import api
from config import setup_database

# logging.basicConfig(level=logging.DEBUG)  # noqa: ERA001
# logger = logging.getLogger(__name__)  # noqa: ERA001


load_dotenv(dotenv_path="./.env")
JWT_KEY: str = os.environ.get("JWT_KEY", "")
# APPLY_CORS: bool = bool(os.environ.get("APPLY_CORS", True))
APPLY_CORS: bool = os.environ.get("APPLY_CORS", "true").lower() in ("1", "true", "yes")

# Validate JWT_KEY is set
if not JWT_KEY:
    print("WARNING: JWT_KEY environment variable is not set or empty!")
    print("This will cause token signature verification to fail.")
    print("Please set JWT_KEY in your .env file.")
else:
    print(f"JWT_KEY loaded successfully (length: {len(JWT_KEY)})")

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
# Allow access tokens in headers and refresh tokens in cookies
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
# Refresh tokens will be read from cookies
app.config["JWT_REFRESH_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/auth"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_CSRF_IN_COOKIES"] = False
app.config["JWT_CSRF_CHECK_FORM"] = False
# Cookie settings
app.config["JWT_COOKIE_SECURE"] = os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true"
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
jwt = JWTManager(app)

application = app  # to work with CPANEL PYTHON APPS


if APPLY_CORS:
    print("\n\nCORS is enabled\n\n")

    CORS(
        app,
        origins=[
            "http://0.0.0.0:5173",
            "http://172.16.7.225:5173",
            "https://esq502.onrender.com",
            "http://localhost:5173",
            "https://siq-react-vite.onrender.com",
        ],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Origin",
        ],
        supports_credentials=True,
    )


# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token has expired"}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    import base64
    import json
    import traceback

    from flask import make_response

    auth_header = request.headers.get("Authorization", "NOT FOUND")
    cookies = request.cookies
    is_refresh_endpoint = request.path == "/api/auth/refresh"

    print(f"[JWT] Invalid token error: {error}")
    print(f"[JWT] Error type: {type(error)}")
    print(f"[JWT] Request path: {request.path}")
    print(f"[JWT] Is refresh endpoint: {is_refresh_endpoint}")
    print(f"[JWT] JWT_SECRET_KEY configured: {bool(app.config.get('JWT_SECRET_KEY'))}")
    print(f"[JWT] JWT_SECRET_KEY length: {len(app.config.get('JWT_SECRET_KEY', ''))}")

    if is_refresh_endpoint:
        print(f"[JWT] Refresh endpoint - cookies received: {list(cookies.keys())}")
        refresh_token = cookies.get("refresh_token", "NOT FOUND")
        if refresh_token != "NOT FOUND":
            print(f"[JWT] Refresh token cookie length: {len(refresh_token)}")
            print(f"[JWT] Refresh token cookie value (first 100 chars): {refresh_token[:100]}")
            # Check if token has proper JWT structure (3 parts separated by dots)
            token_parts = refresh_token.split(".")
            print(f"[JWT] Refresh token parts count: {len(token_parts)}")
            if len(token_parts) != 3:
                print(f"[JWT] WARNING: Token appears corrupted - expected 3 parts, got {len(token_parts)}")
            else:
                # Try to decode header and payload (without verification) to inspect token
                try:
                    # Decode header (add padding if needed)
                    header_padded = token_parts[0] + "=" * (4 - len(token_parts[0]) % 4)
                    header_decoded = base64.urlsafe_b64decode(header_padded)
                    header_json = json.loads(header_decoded)
                    print(f"[JWT] Token header: {header_json}")
                    
                    # Decode payload (add padding if needed)
                    payload_padded = token_parts[1] + "=" * (4 - len(token_parts[1]) % 4)
                    payload_decoded = base64.urlsafe_b64decode(payload_padded)
                    payload_json = json.loads(payload_decoded)
                    print(f"[JWT] Token payload (identity): {payload_json.get('sub', 'N/A')}")
                    print(f"[JWT] Token payload (exp): {payload_json.get('exp', 'N/A')}")
                    print(f"[JWT] Token payload (type): {payload_json.get('type', 'N/A')}")
                except Exception as decode_error:
                    print(f"[JWT] Could not decode token parts: {decode_error}")
        else:
            print("[JWT] Refresh token cookie NOT FOUND")
        print(f"[JWT] Cookie header: {request.headers.get('Cookie', 'NOT FOUND')[:200]}")

    print(f"[JWT] Authorization header: {auth_header[:50] if len(auth_header) > 50 else auth_header}")
    traceback.print_exc()

    # Return 401 (Unauthorized) instead of 422 (Unprocessable Entity) for authentication failures
    # 422 should be reserved for validation errors, not auth failures
    status_code = 401
    error_message = "Invalid or expired token"
    
    # Provide more specific error message for signature verification failures
    if "Signature verification failed" in str(error):
        error_message = "Token signature verification failed. Please log in again."
        print("[JWT] Token signature verification failed - likely JWT_SECRET_KEY mismatch")
    
    response = make_response(jsonify({"error": error_message, "details": str(error)}), status_code)

    # If it's a refresh endpoint with invalid token, clear the cookie
    if is_refresh_endpoint:
        response.set_cookie(
            "refresh_token",
            "",
            expires=0,
            path="/api/auth",
            httponly=True,
            samesite="Lax",
            secure=app.config.get("JWT_COOKIE_SECURE", False),
        )
        print("[JWT] Cleared invalid refresh token cookie")

    return response


@jwt.unauthorized_loader
def missing_token_callback(error):
    # Log details if refresh token is missing
    if request.path == "/api/auth/refresh":
        cookies = request.cookies
        print("[auth.refresh] Missing token")
        print(f"[auth.refresh] Cookies received: {list(cookies.keys())}")
        print(f"[auth.refresh] Cookie header: {request.headers.get('Cookie', 'NOT FOUND')}")
    return jsonify({"error": "Authorization token is missing"}), 401


@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Fresh token required"}), 401


# Initialize Swagger/OpenAPI documentation
swagger = Swagger(app, config=OPENAPI_CONFIG)

# Main api resgistration
app.register_blueprint(api, url_prefix="/api")

# Setup database
setup_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=True)  # noqa: S201

from __future__ import annotations  # noqa: D100, INP001

import json
import os
from datetime import UTC, datetime, timedelta

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS  # type: ignore
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
)
from flasgger import Swagger  # type: ignore

from config import setup_database
from app.api.routes import api
from app.api.openapi import OPENAPI_CONFIG

# logging.basicConfig(level=logging.DEBUG)  # noqa: ERA001
# logger = logging.getLogger(__name__)  # noqa: ERA001


load_dotenv(dotenv_path="./.env")
JWT_KEY: str = os.environ.get("JWT_KEY", "")
# APPLY_CORS: bool = bool(os.environ.get("APPLY_CORS", True))
APPLY_CORS: bool = os.environ.get("APPLY_CORS", "true").lower() in ("1", "true", "yes")


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
app.config["JWT_COOKIE_SECURE"] = (
    os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true"
)
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
    import traceback
    from flask import make_response

    auth_header = request.headers.get("Authorization", "NOT FOUND")
    cookies = request.cookies
    is_refresh_endpoint = request.path == "/api/auth/refresh"
    
    print(f"[JWT] Invalid token error: {error}")
    print(f"[JWT] Error type: {type(error)}")
    print(f"[JWT] Request path: {request.path}")
    print(f"[JWT] Is refresh endpoint: {is_refresh_endpoint}")
    
    if is_refresh_endpoint:
        print(f"[JWT] Refresh endpoint - cookies received: {list(cookies.keys())}")
        print(f"[JWT] Refresh token cookie value: {cookies.get('refresh_token', 'NOT FOUND')[:50] if cookies.get('refresh_token') else 'NOT FOUND'}")
    
    print(
        f"[JWT] Authorization header: {auth_header[:50] if len(auth_header) > 50 else auth_header}"
    )
    traceback.print_exc()
    
    response = make_response(jsonify({"error": "Invalid token", "details": str(error)}), 422)
    
    # If it's a refresh endpoint with invalid token, clear the cookie
    if is_refresh_endpoint:
        response.set_cookie(
            "refresh_token",
            "",
            expires=0,
            path="/api/auth",
            httponly=True,
            samesite="Lax",
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
        print(
            f"[auth.refresh] Cookie header: {request.headers.get('Cookie', 'NOT FOUND')}"
        )
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

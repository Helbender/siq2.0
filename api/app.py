from __future__ import annotations  # noqa: D100, INP001

import json
import os
from datetime import UTC, datetime, timedelta

from dotenv import load_dotenv
from flask import Flask, Response
from flask_cors import CORS  # type: ignore
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
)

from config import setup_database
from app.api.routes import api

# logging.basicConfig(level=logging.DEBUG)  # noqa: ERA001
# logger = logging.getLogger(__name__)  # noqa: ERA001


load_dotenv(dotenv_path="./.env")
JWT_KEY: str = os.environ.get("JWT_KEY", "")
# APPLY_CORS: bool = bool(os.environ.get("APPLY_CORS", True))
APPLY_CORS: bool = os.environ.get("APPLY_CORS", "true").lower() in ("1", "true", "yes")


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
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


# Token refresh functionality
@app.after_request
def refresh_expiring_jwts(response: Response) -> Response:
    """Handle Token Expiration - Refresh token if it expires within 30 minutes."""
    try:
        # Check if there's a valid JWT token in the request
        # This will raise an exception if no JWT is present
        jwt_payload = get_jwt()
        exp_timestamp = jwt_payload["exp"]
        now = datetime.now(UTC)

        # Calculate if token expires within 30 minutes
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))

        # If token expires within 30 minutes, create a new one
        if target_timestamp > exp_timestamp:
            # Get the current user identity and claims
            identity = get_jwt_identity()
            claims = jwt_payload.get("additional_claims", {})

            # Create new access token with same identity and claims
            access_token = create_access_token(identity=identity, additional_claims=claims)

            # Add the new token to the response
            data = response.get_json()
            if isinstance(data, dict):
                data["access_token"] = access_token
                response.data = json.dumps(data)

        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT or no JWT at all.
        # This is normal for public endpoints, so just return the original response
        return response


# Main api resgistration
app.register_blueprint(api, url_prefix="/api")

# Setup database
setup_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=True)  # noqa: S201

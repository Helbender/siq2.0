from __future__ import annotations  # noqa: D100, INP001

import json
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from flask import Flask, Response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    verify_jwt_in_request,
)
from routes.api_blueprint import api

# logging.basicConfig(level=logging.DEBUG)  # noqa: ERA001
# logger = logging.getLogger(__name__)  # noqa: ERA001

load_dotenv(dotenv_path="./.env")
JWT_KEY: str = os.environ.get("JWT_KEY", "")
APPLY_CORS: bool = bool(os.environ.get("APPLY_CORS", False))
print(JWT_KEY)


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

application = app  # to work with CPANEL PYTHON APPS


if APPLY_CORS:
    CORS(
        app,
        origins="http://0.0.0.0:5173",
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Origin",
        ],
        supports_credentials=True,
    )


# apli login routes
@app.after_request
def refresh_expiring_jwts(response: Response) -> Response:
    """Handle Token Expiration."""
    verify_jwt_in_request()
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token
                response.data = json.dumps(data)
        return response  # noqa: TRY300
    except (RuntimeError, KeyError) as e:
        print("Error")
        print(e)
        # Case where there is not a valid JWT. Just return the original respone
        return response


# Main api resgistration
app.register_blueprint(api, url_prefix="/api")

if __name__ == "__main__":
    app.run(port=5051, debug=True)  # noqa: S201

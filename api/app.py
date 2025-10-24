from __future__ import annotations  # noqa: D100, INP001

import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS  # type: ignore
from flask_jwt_extended import (
    JWTManager,
)

from config import setup_database
from routes.api_blueprint import api

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
    # CORS(
    #     app,
    #     origins=[
    #         "http://0.0.0.0:5173",
    #         "http://localhost:5173",
    #     ],
    #     allow_headers=[
    #         "Content-Type",
    #         "Authorization",
    #         "Access-Control-Allow-Credentials",
    #         "Access-Control-Allow-Origin",
    #     ],
    #     supports_credentials=True,
    # )
    CORS(
        app,
        origins=[
            "https://esq502.onrender.com",
            "http://localhost:5173",
            "https://siq-react-vite.onrender.com",
        ],
        supports_credentials=True,
    )

# apli login routes
# @app.after_request
# def refresh_expiring_jwts(response: Response) -> Response:
#     """Handle Token Expiration."""
#     try:
#         exp_timestamp = get_jwt()["exp"]
#         now = datetime.now(timezone.utc)
#         target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
#         if target_timestamp > exp_timestamp:
#             access_token = create_access_token(identity=get_jwt_identity())
#             data = response.get_json()
#             if type(data) is dict:
#                 data["access_token"] = access_token
#                 response.data = json.dumps(data)
#         return response  # noqa: TRY300
#     except (RuntimeError, KeyError) as e:
#         print(f"\nError\n{e}\n")
#         # Case where there is not a valid JWT. Just return the original respone
#         return response


# Main api resgistration
app.register_blueprint(api, url_prefix="/api")

# Setup database
setup_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=True)  # noqa: S201

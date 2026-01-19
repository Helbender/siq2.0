"""Flask application factory."""

import os

from dotenv import load_dotenv
from flasgger import Swagger  # type: ignore
from flask import Flask
from flask_cors import CORS  # type: ignore

from app.api.openapi import OPENAPI_CONFIG
from app.api.routes import api
from app.core.database import setup_database
from app.core.jwt import setup_jwt

load_dotenv(dotenv_path="./.env")


def create_app() -> Flask:
    """Create and configure Flask application.

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    application = app  # to work with CPANEL PYTHON APPS

    # Setup JWT
    setup_jwt(app)

    # Setup CORS
    APPLY_CORS: bool = os.environ.get("APPLY_CORS", "true").lower() in ("1", "true", "yes")
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

    # Initialize Swagger/OpenAPI documentation
    swagger = Swagger(app, config=OPENAPI_CONFIG)

    # Register API blueprint
    app.register_blueprint(api, url_prefix="/api")

    # Setup database
    setup_database()

    return app

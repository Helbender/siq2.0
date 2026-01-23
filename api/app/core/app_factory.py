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
from app.utils.email import mail

load_dotenv(dotenv_path="./.env")


def create_app() -> Flask:
    """Create and configure Flask application.

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)

    # Setup JWT
    setup_jwt(app)

    # Configure Flask-Mail using environment variables
    # All SMTP settings must be provided via environment variables
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port_str = os.environ.get("SMTP_PORT", "587")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    
    if not smtp_server or not smtp_user:
        print("WARNING: SMTP_SERVER or SMTP_USER not configured. Email functionality will not work.")
    
    smtp_port = int(smtp_port_str)
    app.config["MAIL_SERVER"] = smtp_server
    app.config["MAIL_PORT"] = smtp_port
    # Port 465 uses SSL, port 587 uses TLS
    app.config["MAIL_USE_SSL"] = smtp_port == 465
    app.config["MAIL_USE_TLS"] = smtp_port == 587
    app.config["MAIL_USERNAME"] = smtp_user
    app.config["MAIL_PASSWORD"] = smtp_password
    app.config["MAIL_DEFAULT_SENDER"] = (
        "SIQ - Recuperar Password",
        smtp_user,
    )

    mail.init_app(app)
    # Setup CORS
    apply_cors: bool = os.environ.get("APPLY_CORS", "true").lower() in ("1", "true", "yes")
    if apply_cors:
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
    Swagger(app, config=OPENAPI_CONFIG)

    # Register API blueprint
    app.register_blueprint(api, url_prefix="/api")

    # Setup database
    setup_database()

    return app

from __future__ import annotations  # noqa: D100, INP001

from flask import Blueprint

from app.features.auth.routes import auth_bp  # type: ignore
from app.features.dashboard.routes import dashboard_bp  # type: ignore
from app.features.flights.routes import flights_bp  # type: ignore
from app.features.qualifications.routes import qualifications_bp  # type: ignore
from app.features.users.routes import users_bp  # type: ignore

# Main Blueprint to register with application
api = Blueprint("api", __name__)

# Register auth blueprint
api.register_blueprint(auth_bp, url_prefix="")

# Register users blueprint
api.register_blueprint(users_bp, url_prefix="/users")

# Register flights blueprint
api.register_blueprint(flights_bp, url_prefix="/flights")

# Register qualifications blueprint (v2 routes)
api.register_blueprint(qualifications_bp, url_prefix="/v2")

# Register dashboard blueprint
api.register_blueprint(dashboard_bp, url_prefix="/dashboard")

from __future__ import annotations  # noqa: D100, INP001

from flask import Blueprint

from app.features.auth.routes import auth_bp  # type: ignore
from routes.dashboard_blueprint import dashboard  # type: ignore
from routes.flight_blueprint import flights  # type:ignore
from routes.routes import v2  # type:ignore
from routes.users_blueprint import users  # type:ignore

# Main Blueprint to register with application
api = Blueprint("api", __name__)

# Register auth blueprint
api.register_blueprint(auth_bp, url_prefix="")

# Register user with api blueprint
api.register_blueprint(users, url_prefix="/users")

# Register flight blueprints with api blueprint
api.register_blueprint(flights, url_prefix="/flights")

# Register dashboard blueprints with api blueprint
api.register_blueprint(dashboard, url_prefix="/dashboard")

api.register_blueprint(v2, url_prefix="/v2")

"""Shared permission utilities and decorators."""

from functools import wraps
from typing import Callable

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def admin_required(f: Callable) -> Callable:
    """Decorator to require admin privileges for a route.

    Usage:
        @app.route('/admin-only')
        @admin_required
        def admin_route():
            return "Admin only"
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if not claims.get("admin", False):
            return jsonify({"message": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated_function


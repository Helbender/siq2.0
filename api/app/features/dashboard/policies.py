"""Dashboard policies - permission checks only."""

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request


def require_authenticated() -> tuple[dict, int] | None:
    """Require user to be authenticated.

    Returns:
        None if authenticated, or (error_response, status_code) if not
    """
    try:
        verify_jwt_in_request()
        return None
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

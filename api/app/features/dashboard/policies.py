"""Dashboard policies - permission checks only."""

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


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


def require_admin() -> tuple[dict, int] | None:
    """Require user to have admin privileges.

    Returns:
        None if admin, or (error_response, status_code) if not
    """
    verify_jwt_in_request()
    claims = get_jwt()
    if not claims.get("admin", False):
        return jsonify({"message": "Admin access required"}), 403
    return None

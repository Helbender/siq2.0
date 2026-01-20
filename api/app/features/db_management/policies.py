"""Database management policies - permission checks only."""

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

from app.shared.enums import Role


def require_super_admin() -> tuple[dict, int] | None:
    """Require user to have SUPER_ADMIN privileges.

    Returns:
        None if SUPER_ADMIN, or (error_response, status_code) if not
    """
    verify_jwt_in_request()
    claims = get_jwt()
    nip_identity = get_jwt_identity()
    
    # Handle admin case
    if isinstance(nip_identity, str) and nip_identity == "admin":
        return None
    
    # Get role level from JWT claims
    user_role_level = claims.get("roleLevel")
    
    if user_role_level is None or user_role_level < Role.SUPER_ADMIN.level:
        return jsonify({"error": "Super Admin access required"}), 403
    
    return None

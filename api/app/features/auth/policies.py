"""Authentication policies - permission checks only."""

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.shared.enums import Role


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


def get_current_user_role_level() -> int | None:
    """Get current authenticated user's role level from JWT claims or database.
    
    Returns:
        User's role level, or None if not found
    """
    verify_jwt_in_request()
    claims = get_jwt()
    
    # First try to get from JWT claims
    role_level = claims.get("roleLevel")
    if role_level is not None:
        return role_level
    
    # Fallback: get from database
    nip_identity = get_jwt_identity()
    
    # Handle admin case
    if isinstance(nip_identity, str) and nip_identity == "admin":
        return Role.SUPER_ADMIN.level
    
    try:
        nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
    except (ValueError, TypeError):
        return None
    
    repository = AuthRepository()
    with Session(engine) as session:
        current_user = repository.find_user_by_nip(session, nip)
        if current_user is None:
            return None
        
        # Get role level from role relationship if exists, otherwise use role_level field
        return current_user.role.level if current_user.role else current_user.role_level


def require_admin() -> tuple[dict, int] | None:
    """Require user to have admin privileges (SUPER_ADMIN role level).

    Returns:
        None if admin, or (error_response, status_code) if not
    """
    verify_jwt_in_request()
    role_level = get_current_user_role_level()
    if role_level is None or role_level < Role.SUPER_ADMIN.level:
        return jsonify({"message": "Admin access required"}), 403
    return None

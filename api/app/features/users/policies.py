"""Users policies - permission checks only."""

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.features.users.models import Tripulante
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


def can_modify_user(
    current_user_role_level: int | None,
    target_user_role_level: int | None,
    current_user_nip: int | str | None = None,
    target_user_nip: int | str | None = None,
) -> bool:
    """Check if current user can modify target user based on role levels.
    
    Users can only modify users at or below their own level.
    READONLY users can only modify their own data.
    
    Args:
        current_user_role_level: Current user's role level
        target_user_role_level: Target user's role level (defaults to USER level if None)
        current_user_nip: Current user's NIP (for READONLY check)
        target_user_nip: Target user's NIP (for READONLY check)
    
    Returns:
        True if current user can modify target user, False otherwise
    """
    if current_user_role_level is None:
        return False
    
    # READONLY users can only modify their own data
    if current_user_role_level == Role.READONLY.level:
        if current_user_nip is None or target_user_nip is None:
            return False
        # Convert to strings for comparison to handle int/str mismatch
        return str(current_user_nip) == str(target_user_nip)
    
    # If target user has no role level, default to USER level (40)
    target_level = target_user_role_level if target_user_role_level is not None else Role.USER.level
    
    return current_user_role_level >= target_level


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


def require_can_modify_user(target_user: Tripulante) -> tuple[dict, int] | None:
    """Require that current user can modify the target user based on role levels.
    
    Args:
        target_user: The user being modified
    
    Returns:
        None if allowed, or (error_response, status_code) if not
    """
    verify_jwt_in_request()
    from flask_jwt_extended import get_jwt_identity
    
    current_user_role_level = get_current_user_role_level()
    target_user_role_level = target_user.role.level if target_user.role else target_user.role_level
    current_user_nip = get_jwt_identity()
    target_user_nip = target_user.nip
    
    if not can_modify_user(
        current_user_role_level,
        target_user_role_level,
        current_user_nip,
        target_user_nip,
    ):
        if current_user_role_level == Role.READONLY.level:
            return jsonify({"message": "Readonly users can only modify their own data"}), 403
        return jsonify({"message": "You can only modify users at or below your role level"}), 403
    
    return None

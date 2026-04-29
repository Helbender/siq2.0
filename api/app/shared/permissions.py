"""Shared permission utilities and decorators."""

from collections.abc import Callable
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.shared.enums import Role

# Fallback role levels used when permissions are not yet seeded in the database.
_PERMISSION_MIN_LEVEL: dict[str, int] = {
    "flights.read": Role.READONLY.level,
    "flights.write": Role.FLYERS.level,
    "users.read": Role.READONLY.level,
    "users.write": Role.UNIF.level,
    "qualifications.read": Role.READONLY.level,
    "qualifications.write": Role.UNIF.level,
    "dashboard.read": Role.READONLY.level,
    "db.backup": Role.SUPER_ADMIN.level,
}


def check_permission(permission: str) -> tuple | None:
    """Inline permission check for multi-method routes.

    Returns:
        None if allowed, or (error_response, status_code) if not.
    """
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    nip_identity = get_jwt_identity()
    claims = get_jwt()

    jwt_perms = claims.get("permissions")
    if jwt_perms is not None and permission in jwt_perms:
        return None

    try:
        nip = int(nip_identity)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user identity"}), 403

    role_level = claims.get("roleLevel")

    if role_level is None or jwt_perms is not None:
        repository = AuthRepository()
        with Session(engine) as session:
            current_user = repository.find_user_by_nip(session, nip)
            if current_user is None:
                return jsonify({"error": "User not found"}), 403
            user_role = current_user.role
            role_level = user_role.level if user_role else current_user.role_level

            if user_role and user_role.permissions:
                perm_names = {p.name for p in user_role.permissions}
                if permission in perm_names:
                    return None
                return jsonify({"error": f"Permission required: {permission}"}), 403

    min_level = _PERMISSION_MIN_LEVEL.get(permission, Role.UNIF.level)
    if role_level is not None and role_level >= min_level:
        return None

    return jsonify({"error": f"Permission required: {permission}"}), 403


def admin_required(f: Callable) -> Callable:
    """Decorator to require admin privileges for a route (SUPER_ADMIN role level).

    Usage:
        @app.route('/admin-only')
        @admin_required
        def admin_route():
            return "Admin only"
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        nip_identity = get_jwt_identity()
        claims = get_jwt()

        # Try to get role level from JWT claims first (faster)
        user_role_level = claims.get("roleLevel")

        if user_role_level is None:
            try:
                nip = int(nip_identity)
            except (ValueError, TypeError):
                return jsonify({"message": "Admin access required"}), 403

            repository = AuthRepository()
            with Session(engine) as session:
                current_user = repository.find_user_by_nip(session, nip)

                if current_user is None:
                    return jsonify({"message": "Admin access required"}), 403

                # Get role level from role relationship if exists, otherwise use role_level field
                user_role_level = current_user.role.level if current_user.role else current_user.role_level

        if user_role_level is None or user_role_level < Role.SUPER_ADMIN.level:
            return jsonify({"message": "Admin access required"}), 403

        return f(*args, **kwargs)

    return decorated_function


def require_role(min_level: int):
    """Decorator to require a minimum role level for a route.

    Args:
        min_level: Minimum role level required (e.g., 80 for UNIF, 100 for Super Admin)

    Usage:
        @app.route('/protected')
        @require_role(80)
        def protected_route():
            return "Protected content"
    """

    def wrapper(fn: Callable) -> Callable:
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            nip_identity = get_jwt_identity()
            claims = get_jwt()

            # Try to get role level from JWT claims first (faster)
            user_role_level = claims.get("roleLevel")

            if user_role_level is None:
                try:
                    nip = int(nip_identity)
                except (ValueError, TypeError):
                    return jsonify({"error": "Invalid user identity"}), 403

                repository = AuthRepository()
                with Session(engine) as session:
                    current_user = repository.find_user_by_nip(session, nip)

                    if current_user is None:
                        return jsonify({"error": "User not found"}), 403

                    # Get role level from role relationship if exists, otherwise use role_level field
                    user_role_level = current_user.role.level if current_user.role else current_user.role_level

            if user_role_level is None or user_role_level < min_level:
                return jsonify({"error": "Forbidden"}), 403

            return fn(*args, **kwargs)

        return decorated

    return wrapper


def require_permission(permission: str) -> Callable:
    """Require a specific named permission (e.g. "flights.read").

    Resolution order:
    1. Admin identity → always allowed.
    2. JWT ``permissions`` claim present and contains the permission → allowed.
    3. JWT ``permissions`` claim present but permission missing → check DB.
    4. JWT has no ``permissions`` claim (old token) → fall back to role-level check.

    If the ``permissions`` table is not yet seeded the fallback map
    ``_PERMISSION_MIN_LEVEL`` preserves existing access patterns by role level.
    """

    def wrapper(fn: Callable) -> Callable:
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            nip_identity = get_jwt_identity()
            claims = get_jwt()

            jwt_perms = claims.get("permissions")

            # Fast path: permission present in JWT
            if jwt_perms is not None and permission in jwt_perms:
                return fn(*args, **kwargs)

            try:
                nip = int(nip_identity)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid user identity"}), 403

            role_level = claims.get("roleLevel")
            user_role = None

            if role_level is None or jwt_perms is not None:
                # Either no role level in claims, or claims has permissions but not this one
                # → always check DB for up-to-date info
                repository = AuthRepository()
                with Session(engine) as session:
                    current_user = repository.find_user_by_nip(session, nip)
                    if current_user is None:
                        return jsonify({"error": "User not found"}), 403
                    user_role = current_user.role
                    role_level = user_role.level if user_role else current_user.role_level

                    if user_role and user_role.permissions:
                        perm_names = {p.name for p in user_role.permissions}
                        if permission in perm_names:
                            return fn(*args, **kwargs)
                        return jsonify({"error": f"Permission required: {permission}"}), 403

            # Permissions not seeded yet — fall back to role level
            min_level = _PERMISSION_MIN_LEVEL.get(permission, Role.UNIF.level)
            if role_level is not None and role_level >= min_level:
                return fn(*args, **kwargs)

            return jsonify({"error": f"Permission required: {permission}"}), 403

        return decorated

    return wrapper

"""Shared permission utilities and decorators."""

from functools import wraps
from typing import Callable

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.shared.enums import Role


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
        
        # Handle admin case
        if isinstance(nip_identity, str) and nip_identity == "admin":
            # Admin identity has SUPER_ADMIN level, so allow access
            return f(*args, **kwargs)
        
        # Try to get role level from JWT claims first (faster)
        user_role_level = claims.get("roleLevel")
        
        # If not in claims, get from database
        if user_role_level is None:
            try:
                nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
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
            
            # Handle admin case
            if isinstance(nip_identity, str) and nip_identity == "admin":
                admin_level = Role.SUPER_ADMIN.level
                if admin_level < min_level:
                    return jsonify({"error": "Forbidden"}), 403
                return fn(*args, **kwargs)
            
            # Try to get role level from JWT claims first (faster)
            user_role_level = claims.get("roleLevel")
            
            # If not in claims, get from database
            if user_role_level is None:
                try:
                    nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
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


"""Authentication service containing business logic for auth operations."""

import os
from datetime import timedelta
from typing import Any

from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.shared.enums import Role
from app.utils.email import hash_code, send_email


class AuthService:
    """Service class for authentication business logic."""

    def __init__(self):
        """Initialize auth service with repository."""
        self.repository = AuthRepository()

    def authenticate_user(self, nip: str | int, password: str, session: Session) -> dict[str, Any]:
        """Authenticate a user and return token or error.

        Args:
            nip: User NIP (can be string or int, "admin" for admin login)
            password: User password
            session: Database session

        Returns:
            dict with "access_token" key on success, or "message" key on error
        """
        # Handle admin login
        if nip == "admin" and password == "admin":
            tripulante = self.repository.find_first_user(session)
            if tripulante is None:
                access_token = create_access_token(
                    identity="admin",
                    additional_claims={
                        "name": "ADMIN",
                        "roleLevel": Role.SUPER_ADMIN.level,
                    },
                )
                refresh_token = create_refresh_token(identity="admin")
                return {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            return {"message": "Can not login as admin. Db already populated"}

        # Handle regular user login
        tripulante = self.repository.find_user_by_nip(session, int(nip))

        if tripulante is None:
            return {"message": f"No user with the NIP {nip}"}

        if hash_code(password) != tripulante.password:
            return {"message": "Wrong password"}

        # Ensure identity is consistently a string for JWT
        nip_str = str(nip)
        # Get roleLevel from role relationship if exists, otherwise use role_level field
        role_level = tripulante.role.level if tripulante.role else tripulante.role_level
        access_token = create_access_token(
            identity=nip_str,
            additional_claims={
                "name": tripulante.name,
                "roleLevel": role_level,
            },
        )
        refresh_token = create_refresh_token(identity=nip_str)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def refresh_access_token(nip: str | int) -> tuple[str | None, str | None]:
        """Generate a new access token for a user.

        Args:
            nip: User NIP (can be string or int)

        Returns:
            tuple of (access_token, error) where error is None on success
        """
        from sqlalchemy.orm import Session

        # Handle admin case
        if str(nip) == "admin":
            new_access_token = create_access_token(
                identity="admin",
                additional_claims={
                    "name": "ADMIN",
                    "roleLevel": Role.SUPER_ADMIN.level,
                },
            )
            return new_access_token, None

        with Session(engine) as session:
            repository = AuthRepository()
            # Convert to int for database query
            nip_int = int(nip) if isinstance(nip, str) else nip
            tripulante = repository.find_user_by_nip(session, nip_int)

            if tripulante is None:
                return None, "User not found"

            # Always use string for JWT identity for consistency
            nip_str = str(nip_int)
            # Get roleLevel from role relationship if exists, otherwise use role_level field
            role_level = tripulante.role.level if tripulante.role else tripulante.role_level
            new_access_token = create_access_token(
                identity=nip_str,
                additional_claims={
                    "name": tripulante.name,
                    "roleLevel": role_level,
                },
            )

            return new_access_token, None

    def get_current_user(self, nip_identity: str | int, session: Session) -> dict[str, Any]:
        """Get current authenticated user by NIP identity.

        Args:
            nip_identity: User NIP from JWT identity (can be string or int, or "admin")
            session: Database session

        Returns:
            dict with user data on success, or error message
        """
        # Handle admin case
        if isinstance(nip_identity, str) and nip_identity == "admin":
            return {
                "nip": "admin",
                "name": "ADMIN",
                "roleLevel": Role.SUPER_ADMIN.level,
            }

        # Convert to int for database query
        try:
            nip = int(nip_identity) if isinstance(nip_identity, str) else int(nip_identity)
        except (ValueError, TypeError):
            return {"error": f"Invalid user identity: {nip_identity}"}

        tripulante = self.repository.find_user_by_nip(session, nip)

        if tripulante is None:
            return {"error": f"User with NIP {nip} not found"}

        return tripulante.to_json()

    @staticmethod
    def get_refresh_token_cookie_kwargs(refresh_token: str) -> dict[str, Any]:
        """Get cookie kwargs for refresh token.

        Uses JWT_COOKIE_SECURE and JWT_COOKIE_SAMESITE from env. For cross-origin
        (e.g. frontend and API on different Render subdomains), set
        JWT_COOKIE_SECURE=true and JWT_COOKIE_SAMESITE=None.
        """
        secure = os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true"
        samesite_raw = os.environ.get("JWT_COOKIE_SAMESITE", "Lax")
        if samesite_raw.lower() == "none":
            samesite = "None"
            secure = True  # required when SameSite=None
        else:
            samesite = "Lax"
        return {
            "key": "siq2_refresh_token",
            "value": refresh_token,
            "httponly": True,
            "samesite": samesite,
            "secure": secure,
            "max_age": int(timedelta(days=30).total_seconds()),
            "path": "/api/auth",
        }

    def create_reset_token(self, user, session: Session) -> str:
        """Create a password reset token for a user.

        Args:
            user: Tripulante instance
            session: Database session

        Returns:
            Reset token string
        """
        import json
        import secrets
        from datetime import UTC, datetime

        token = secrets.token_urlsafe(32)
        # Store token in user's recover field (can be refactored to use a separate table)
        token_data = {
            "token": token,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        self.repository.update_user_recovery_token(session, user, json.dumps(token_data))
        return token

    def reset_password(self, token: str, new_password: str, session: Session) -> dict[str, Any]:
        """Reset user password using a reset token.

        Args:
            token: Reset token
            new_password: New password (plain text)
            session: Database session

        Returns:
            dict with success message or error message
        """
        import json
        from datetime import UTC, datetime, timedelta

        from sqlalchemy import select

        from app.features.users.models import Tripulante  # type: ignore

        if not new_password:
            return {"message": "Password can not be empty"}

        # Find user by token (this is a simple implementation - can be optimized)

        stmt = select(Tripulante).where(Tripulante.recover != "")
        users = session.execute(stmt).scalars().all()

        for user in users:
            try:
                recover_data = json.loads(user.recover)
                if recover_data.get("token") == token:
                    # Check if token is expired (24 hours)
                    token_timestamp = datetime.fromisoformat(recover_data["timestamp"])
                    if datetime.now(UTC) - token_timestamp > timedelta(hours=24):
                        return {"message": "Token expired"}

                    # Update password
                    hashed_password = hash_code(new_password)
                    self.repository.update_user_password(session, user, hashed_password)
                    return {"message": "Password updated successfully"}
            except (json.JSONDecodeError, KeyError, ValueError):
                continue

        return {"message": "Invalid token"}

    @staticmethod
    def send_reset_password_email(user, token: str) -> None:
        """Send password reset email to user.

        Args:
            user: Tripulante instance with email attribute
            token: Reset token
        """
        frontend_url = os.environ.get("FRONTEND_URL", "https://siq-react-vite.onrender.com")
        reset_link = f"{frontend_url}/reset-password?token={token}"

        send_email(
            subject="Reset da password",
            recipients=user.email,
            body=f"Usa este link: {reset_link}",
            html=f"<p>Usa este link:</p><a href='{reset_link}'>{reset_link}</a>",
        )

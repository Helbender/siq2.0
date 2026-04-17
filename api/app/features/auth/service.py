"""Authentication service containing business logic for auth operations."""

import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy.orm import Session

from app.features.auth.repository import AuthRepository
from app.shared.enums import Role
from app.utils.email import hash_code, send_email


class AuthError(Exception):
    """Raised by AuthService when an operation fails with a known HTTP status."""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthService:
    """Service class for authentication business logic."""

    def __init__(self):
        """Initialize auth service with repository."""
        self.repository = AuthRepository()

    def authenticate_user(self, nip: str | int, password: str, session: Session) -> dict[str, Any]:
        """Authenticate a user and return tokens.

        Args:
            nip: User NIP (can be string or int, "admin" for admin login)
            password: User password
            session: Database session

        Returns:
            dict with "access_token" and "refresh_token" keys on success

        Raises:
            AuthError: If credentials are invalid or user not found
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
            raise AuthError("Can not login as admin. Db already populated", 403)

        # Handle regular user login
        tripulante = self.repository.find_user_by_nip(session, int(nip))

        if tripulante is None:
            raise AuthError(f"No user with the NIP {nip}", 404)

        if hash_code(password) != tripulante.password:
            raise AuthError("Wrong password", 401)

        nip_str = str(nip)
        role_level = tripulante.role.level if tripulante.role else tripulante.role_level
        permissions = [p.name for p in tripulante.role.permissions] if tripulante.role else []
        access_token = create_access_token(
            identity=nip_str,
            additional_claims={
                "name": tripulante.name,
                "roleLevel": role_level,
                "permissions": permissions,
            },
        )
        refresh_token = create_refresh_token(identity=nip_str)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def refresh_access_token(self, nip: str | int, session: Session) -> str:
        """Generate a new access token for a user.

        Args:
            nip: User NIP (can be string or int)
            session: Database session

        Returns:
            New access token string

        Raises:
            AuthError: If user not found
        """
        if str(nip) == "admin":
            return create_access_token(
                identity="admin",
                additional_claims={
                    "name": "ADMIN",
                    "roleLevel": Role.SUPER_ADMIN.level,
                },
            )

        nip_int = int(nip)
        tripulante = self.repository.find_user_by_nip(session, nip_int)

        if tripulante is None:
            raise AuthError("User not found", 404)

        role_level = tripulante.role.level if tripulante.role else tripulante.role_level
        permissions = [p.name for p in tripulante.role.permissions] if tripulante.role else []
        return create_access_token(
            identity=str(nip_int),
            additional_claims={
                "name": tripulante.name,
                "roleLevel": role_level,
                "permissions": permissions,
            },
        )

    def get_current_user(self, nip_identity: str | int, session: Session) -> dict[str, Any]:
        """Get current authenticated user by NIP identity.

        Args:
            nip_identity: User NIP from JWT identity (can be string or int, or "admin")
            session: Database session

        Returns:
            dict with user data on success

        Raises:
            AuthError: If identity is invalid or user not found
        """
        if isinstance(nip_identity, str) and nip_identity == "admin":
            return {
                "nip": "admin",
                "name": "ADMIN",
                "roleLevel": Role.SUPER_ADMIN.level,
                "role": {
                    "name": Role.SUPER_ADMIN.name,
                    "level": Role.SUPER_ADMIN.level,
                },
            }

        try:
            nip = int(nip_identity)
        except (ValueError, TypeError) as err:
            raise AuthError(f"Invalid user identity: {nip_identity}", 400) from err

        tripulante = self.repository.find_user_by_nip(session, nip)

        if tripulante is None:
            raise AuthError(f"User with NIP {nip} not found", 404)

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
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        self.repository.set_reset_token(session, user, token, expires_at)
        return token

    def reset_password(self, token: str, new_password: str, session: Session) -> None:
        """Reset user password using a reset token.

        Args:
            token: Reset token
            new_password: New password (plain text)
            session: Database session

        Raises:
            AuthError: If password is empty, token is expired, or token is invalid
        """
        if not new_password:
            raise AuthError("Password can not be empty", 400)

        user = self.repository.find_user_by_reset_token(session, token)

        if user is None:
            raise AuthError("Invalid token", 404)

        if user.reset_token_expires_at is None or datetime.now(UTC) > user.reset_token_expires_at:
            raise AuthError("Token expired", 404)

        hashed_password = hash_code(new_password)
        self.repository.update_user_password(session, user, hashed_password)

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

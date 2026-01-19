"""Authentication service containing business logic for auth operations."""

import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from flask import request
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.auth.repository import AuthRepository
from app.utils.email import hash_code, main


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
                    additional_claims={"admin": True, "name": "ADMIN"},
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
        access_token = create_access_token(
            identity=nip_str,
            additional_claims={"admin": tripulante.admin, "name": tripulante.name},
        )
        refresh_token = create_refresh_token(identity=nip_str)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def validate_recovery_token(self, email: str, token: str, session: Session) -> dict[str, Any]:
        """Validate a password recovery token.

        Args:
            email: User email
            token: Recovery token
            session: Database session

        Returns:
            dict with "message" and optionally "nip" on success, or error message
        """
        tripulante = self.repository.find_user_by_email(session, email)

        if tripulante is None:
            return {"message": "User not found"}

        try:
            recover_data = json.loads(tripulante.recover)
        except json.JSONDecodeError:
            return {"message": "Token already was used"}

        if token != recover_data["token"]:
            return {"message": "Invalid token"}

        now = datetime.now(UTC)
        token_timestamp = datetime.fromisoformat(recover_data["timestamp"])
        exp_timestamp = now + timedelta(hours=12)
        # Original logic: if exp_timestamp > token_timestamp, token is valid
        # This seems backwards but matches original implementation
        if exp_timestamp > token_timestamp:
            self.repository.clear_user_recovery_token(session, tripulante)
            return {"message": "Token Valid", "nip": tripulante.nip}

        return {"message": "Token Expired"}

    def initiate_password_recovery(self, email: str, session: Session) -> dict[str, Any]:
        """Initiate password recovery process by sending recovery email.

        Args:
            email: User email
            session: Database session

        Returns:
            dict with "message" key indicating success or error
        """
        tripulante = self.repository.find_user_by_email(session, email)

        if tripulante is None:
            return {"message": "User not found"}

        json_data = main(email)
        self.repository.update_user_recovery_token(session, tripulante, json_data)
        return {"message": "Recovery email sent"}

    def update_password(self, nip: int, new_password: str, session: Session) -> dict[str, Any]:
        """Update user password.

        Args:
            nip: User NIP
            new_password: New password (plain text)
            session: Database session

        Returns:
            dict with user data on success, or error message
        """
        if not new_password:
            return {"message": "Password can not be empty"}

        tripulante = self.repository.find_user_by_nip(session, nip)

        if tripulante is None:
            return {"message": "User not found"}

        hashed_password = hash_code(new_password)
        self.repository.update_user_password(session, tripulante, hashed_password)
        return tripulante.to_json()

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
                additional_claims={"admin": True, "name": "ADMIN"},
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
            new_access_token = create_access_token(
                identity=nip_str,
                additional_claims={"admin": tripulante.admin, "name": tripulante.name},
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
            return {"nip": "admin", "name": "ADMIN", "admin": True}

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

        Args:
            refresh_token: Refresh token string

        Returns:
            dict with cookie kwargs for setting refresh token
        """
        return {
            "key": "refresh_token",
            "value": refresh_token,
            "httponly": True,
            "samesite": "Lax",
            "secure": request.is_secure if not os.environ.get("FLASK_ENV") == "development" else False,
            "max_age": int(timedelta(days=30).total_seconds()),
            "path": "/api/auth",
        }

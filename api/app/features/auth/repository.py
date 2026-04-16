"""Authentication repository - database access only."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.features.users.models import Tripulante  # type: ignore


class AuthRepository:
    """Repository for authentication database operations."""

    @staticmethod
    def find_user_by_nip(session: Session, nip: int) -> Tripulante | None:
        """Find a user by NIP.

        Args:
            session: Database session
            nip: User NIP

        Returns:
            Tripulante instance or None if not found
        """
        stmt = select(Tripulante).options(joinedload(Tripulante.role)).where(Tripulante.nip == nip)
        return session.execute(stmt).unique().scalar_one_or_none()  # type: ignore

    @staticmethod
    def find_user_by_email(session: Session, email: str) -> Tripulante | None:
        """Find a user by email.

        Args:
            session: Database session
            email: User email

        Returns:
            Tripulante instance or None if not found
        """
        stmt = select(Tripulante).options(joinedload(Tripulante.role)).where(Tripulante.email == email)
        return session.execute(stmt).unique().scalar_one_or_none()  # type: ignore

    @staticmethod
    def find_first_user(session: Session) -> Tripulante | None:
        """Find the first user in the database.

        Args:
            session: Database session

        Returns:
            First Tripulante instance or None if database is empty
        """
        return session.execute(select(Tripulante)).scalars().first()  # type: ignore

    @staticmethod
    def find_user_by_reset_token(session: Session, token: str) -> Tripulante | None:
        """Find a user by their password reset token (index-backed lookup).

        Args:
            session: Database session
            token: Reset token string

        Returns:
            Tripulante instance or None if not found
        """
        stmt = select(Tripulante).where(Tripulante.reset_token == token)
        return session.execute(stmt).scalar_one_or_none()  # type: ignore

    @staticmethod
    def update_user_password(session: Session, user: Tripulante, hashed_password: str) -> None:
        """Update user password and clear the reset token.

        Args:
            session: Database session
            user: Tripulante instance
            hashed_password: Hashed password string
        """
        user.password = hashed_password
        user.reset_token = None
        user.reset_token_expires_at = None
        session.commit()

    @staticmethod
    def set_reset_token(session: Session, user: Tripulante, token: str, expires_at: "datetime") -> None:
        """Persist a password reset token and its expiry on the user row.

        Args:
            session: Database session
            user: Tripulante instance
            token: Plain reset token string
            expires_at: Token expiry datetime (timezone-aware)
        """
        user.reset_token = token
        user.reset_token_expires_at = expires_at
        session.commit()

    @staticmethod
    def clear_reset_token(session: Session, user: Tripulante) -> None:
        """Clear password reset token fields.

        Args:
            session: Database session
            user: Tripulante instance
        """
        user.reset_token = None
        user.reset_token_expires_at = None
        session.commit()

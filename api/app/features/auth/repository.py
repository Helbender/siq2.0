"""Authentication repository - database access only."""

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
        return session.execute(select(Tripulante)).first()  # type: ignore

    @staticmethod
    def update_user_password(session: Session, user: Tripulante, hashed_password: str) -> None:
        """Update user password.

        Args:
            session: Database session
            user: Tripulante instance
            hashed_password: Hashed password string
        """
        user.password = hashed_password
        user.recover = ""
        session.commit()

    @staticmethod
    def update_user_recovery_token(session: Session, user: Tripulante, recovery_data: str) -> None:
        """Update user recovery token.

        Args:
            session: Database session
            user: Tripulante instance
            recovery_data: Recovery token JSON string
        """
        user.recover = recovery_data
        session.commit()

    @staticmethod
    def clear_user_recovery_token(session: Session, user: Tripulante) -> None:
        """Clear user recovery token.

        Args:
            session: Database session
            user: Tripulante instance
        """
        user.recover = ""
        session.commit()

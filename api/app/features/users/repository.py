"""Users repository - database access only."""

from sqlalchemy import delete, exc, select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session

from app.features.users.models import Tripulante  # type: ignore


class UserRepository:
    """Repository for user database operations."""

    @staticmethod
    def find_all(session: Session) -> list[Tripulante]:
        """Get all users/tripulantes from database.

        Args:
            session: Database session

        Returns:
            List of Tripulante instances
        """
        return session.execute(select(Tripulante)).scalars().all()

    @staticmethod
    def find_by_nip(session: Session, nip: int) -> Tripulante | None:
        """Find a user by NIP.

        Args:
            session: Database session
            nip: User NIP

        Returns:
            Tripulante instance or None if not found
        """
        stmt = select(Tripulante).where(Tripulante.nip == nip)
        try:
            return session.execute(stmt).scalar_one()
        except NoResultFound:
            return None

    @staticmethod
    def create(session: Session, user: Tripulante) -> tuple[Tripulante | None, str | None]:
        """Create a new user/tripulante.

        Args:
            session: Database session
            user: Tripulante instance to create

        Returns:
            Tuple of (created_user, error_message)
            If successful: (user, None)
            If error: (None, error_message)
        """
        try:
            session.add(user)
            session.commit()
            return user, None
        except exc.IntegrityError as e:
            session.rollback()
            return None, str(e.orig)

    @staticmethod
    def delete_by_nip(session: Session, nip: int) -> bool:
        """Delete a user/tripulante by NIP.

        Args:
            session: Database session
            nip: User NIP

        Returns:
            True if deleted, False if not found
        """
        result = session.execute(delete(Tripulante).where(Tripulante.nip == nip))

        if result.rowcount == 1:
            session.commit()
            return True

        return False

    @staticmethod
    def update(session: Session, user: Tripulante) -> None:
        """Update a user/tripulante.

        Args:
            session: Database session
            user: Tripulante instance to update
        """
        session.commit()

    @staticmethod
    def bulk_create(session: Session, users: list[Tripulante]) -> dict[str, int]:
        """Create multiple users.

        Args:
            session: Database session
            users: List of Tripulante instances to create

        Returns:
            dict with created and failed counts
        """
        created = 0
        failed = 0

        def check_integrity():
            nonlocal created, failed
            try:
                session.commit()
                created += 1
            except IntegrityError:
                session.rollback()
                failed += 1

        for user in users:
            session.add(user)
            check_integrity()

        session.commit()
        return {"created": created, "failed": failed}

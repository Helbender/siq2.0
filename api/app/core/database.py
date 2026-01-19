"""Database setup and initialization."""

from sqlalchemy import exc

from app.core.config import engine
from app.shared.models import Base


def setup_database():
    """Initialize database tables."""
    try:
        # Import all models to register them with Base
        from app.features.flights.models import Flight, FlightPilots  # noqa: F401
        from app.features.qualifications.models import Qualificacao  # noqa: F401
        from app.features.users.models import Tripulante, TripulanteQualificacao  # noqa: F401

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database setup completed successfully.")
    except exc.SQLAlchemyError as e:
        print(f"An error occurred while setting up the database: {e}")

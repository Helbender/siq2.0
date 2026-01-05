import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, exc

# Load enviroment variables
load_dotenv(dotenv_path="./.env")

USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")


PILOT_USER: list = ["PI", "PC", "CP", "P", "PA"]
CREW_USER: list = ["OC", "OCI", "OCA", "CT", "CTA", "CTI", "OPV", "OPVI", "OPVA"]

# Define connection string
# connection_string = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
connection_string = os.environ.get("DB_URL", "sqlite:///database.db")
print(f"\nConnection string: {connection_string}")
# Create the SQLAlchemy engine with improved configuration
engine = create_engine(
    connection_string,
    pool_size=200,  # Adjust based on your needs
    max_overflow=10,  # Allow some overflow
    pool_timeout=30,  # Wait time for getting a connection
    pool_recycle=3600,  # Recycle connections every hour
    pool_pre_ping=True,
)


def setup_database():
    """Initialize database tables."""
    try:
        from models.basemodels import Base
        from app.features.flights.models import Flight, FlightPilots  # noqa: F401
        from models.qualificacoes import Qualificacao  # noqa: F401
        from models.tripulantes import Tripulante, TripulanteQualificacao  # noqa: F401

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database setup completed successfully.")
    except exc.SQLAlchemyError as e:
        print(f"An error occurred while setting up the database: {e}")

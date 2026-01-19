"""Application configuration."""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load environment variables
load_dotenv(dotenv_path="./.env")

USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

PILOT_USER: list = ["PI", "PC", "CP", "P", "PA"]
CREW_USER: list = ["OC", "OCI", "OCA", "CT", "CTA", "CTI", "OPV", "OPVI", "OPVA"]

# Define connection string
connection_string = os.environ.get("DB_URL", "sqlite:///database.db")
# print(f"\nConnection string: {connection_string}")

# Create the SQLAlchemy engine with improved configuration
engine = create_engine(
    connection_string,
    pool_size=200,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,
)

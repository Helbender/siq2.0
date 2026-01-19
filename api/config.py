"""Legacy config file - imports from core for backward compatibility."""

from app.core.config import CREW_USER, PILOT_USER, engine
from app.core.database import setup_database

__all__ = ["engine", "setup_database", "PILOT_USER", "CREW_USER"]

#!/usr/bin/env python3
"""Script to set a specific user to a desired role level.

Usage:
    python set_user_role_level.py <nip> <level>
    
Examples:
    python set_user_role_level.py 123456 100  # Set user to Super Admin
    python set_user_role_level.py 123456 80   # Set user to UNIF
    python set_user_role_level.py 123456 60   # Set user to Flyers
    python set_user_role_level.py 123456 40   # Set user to User
    python set_user_role_level.py 123456 20   # Set user to Readonly

Available role levels:
    100 - Super Admin
    80  - UNIF
    60  - Flyers
    40  - User
    20  - Readonly
"""

import argparse
import os
import sys

from sqlalchemy import select, inspect
from sqlalchemy.orm import Session, load_only

# Add the api/ directory to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from config import engine
# Import all models to register them with SQLAlchemy
from app.features.flights.models import Flight, FlightPilots  # noqa: F401
from app.features.qualifications.models import Qualificacao  # noqa: F401
from app.features.users.models import Tripulante, TripulanteQualificacao  # noqa: F401
from app.shared.enums import Role
from app.shared.rbac_models import Permission, Role as RoleModel  # noqa: F401


def set_user_role_level(nip: int, level: int):
    """Set a specific user to a desired role level.

    Args:
        nip: User NIP
        level: Desired role level (20, 40, 60, 80, or 100)
    """
    # Validate level
    valid_levels = [Role.READONLY.level, Role.USER.level, Role.FLYERS.level, Role.UNIF.level, Role.SUPER_ADMIN.level]
    if level not in valid_levels:
        print(f"Error: Invalid role level {level}")
        print(f"Valid levels are: {valid_levels}")
        return

    with Session(engine) as session:
        # Get the role from database
        role = session.execute(
            select(RoleModel).where(RoleModel.level == level)
        ).scalar_one_or_none()

        if role is None:
            print(f"Error: Role with level {level} not found in database.")
            print("Please run the migration first to create default roles.")
            return

        # Check if role_level column exists in the database
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('tripulantes')]
        has_role_level = 'role_level' in columns
        
        # Get user by NIP - use raw SQL update to avoid column issues
        # First, get user name with a simple query
        from sqlalchemy import text
        result = session.execute(
            text("SELECT name FROM tripulantes WHERE nip = :nip"),
            {"nip": nip}
        ).first()
        
        if result is None:
            print(f"Error: User with NIP {nip} not found.")
            return
        
        user_name = result[0]
        
        # Now update the user using raw SQL to avoid model column issues
        if has_role_level:
            session.execute(
                text("UPDATE tripulantes SET role_level = :level, role_id = :role_id WHERE nip = :nip"),
                {"level": level, "role_id": role.id, "nip": nip}
            )
        else:
            session.execute(
                text("UPDATE tripulantes SET role_id = :role_id WHERE nip = :nip"),
                {"role_id": role.id, "nip": nip}
            )
        
        session.commit()

        role_name_map = {
            Role.SUPER_ADMIN.level: "Super Admin",
            Role.UNIF.level: "UNIF",
            Role.FLYERS.level: "Flyers",
            Role.USER.level: "User",
            Role.READONLY.level: "Readonly",
        }

        print(f"Successfully updated user {nip} ({user_name}) to {role_name_map[level]} (level {level})")
        print(f"Role ID: {role.id} ({role.name})")


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Set a specific user to a desired role level",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s 123456 100  # Set user to Super Admin
  %(prog)s 123456 80   # Set user to UNIF
  %(prog)s 123456 60   # Set user to Flyers
  %(prog)s 123456 40   # Set user to User
  %(prog)s 123456 20   # Set user to Readonly

Available role levels:
  100 - Super Admin
  80  - UNIF
  60  - Flyers
  40  - User
  20  - Readonly
        """,
    )
    parser.add_argument("nip", type=int, help="User NIP")
    parser.add_argument("level", type=int, help="Desired role level (20, 40, 60, 80, or 100)")

    args = parser.parse_args()

    set_user_role_level(args.nip, args.level)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Script to set all users to the lowest role level (Readonly - 20).

This script updates all users in the database to have the lowest role level.
It updates both the role_level field and assigns them to the Readonly role.
"""

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


def set_all_users_to_lowest_level():
    """Set all users to the lowest role level (Readonly - 20)."""
    readonly_level = Role.READONLY.level  # 20

    with Session(engine) as session:
        # Get the Readonly role from database
        readonly_role = session.execute(
            select(RoleModel).where(RoleModel.level == readonly_level)
        ).scalar_one_or_none()

        if readonly_role is None:
            print(f"Error: Readonly role (level {readonly_level}) not found in database.")
            print("Please run the migration first to create default roles.")
            return

        # Check if role_level column exists in the database
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('tripulantes')]
        has_role_level = 'role_level' in columns
        
        # Get all users - only load columns that exist
        if has_role_level:
            users = session.execute(select(Tripulante)).scalars().all()
        else:
            # Load only columns that exist (excluding role_level)
            users = session.execute(
                select(Tripulante).options(
                    load_only(
                        Tripulante.nip, Tripulante.name, Tripulante.rank,
                        Tripulante.position, Tripulante.email, Tripulante.admin,
                        Tripulante.role_id, Tripulante.recover, Tripulante.squadron,
                        Tripulante.password, Tripulante.tipo, Tripulante.status
                    )
                )
            ).scalars().all()

        if not users:
            print("No users found in database.")
            return

        updated_count = 0
        for user in users:
            # Update role_level field if it exists in the database
            if has_role_level:
                user.role_level = readonly_level
            # Assign to Readonly role
            user.role_id = readonly_role.id
            updated_count += 1

        session.commit()
        print(f"Successfully updated {updated_count} user(s) to Readonly level ({readonly_level})")
        print(f"All users now have role_id: {readonly_role.id} ({readonly_role.name})")


if __name__ == "__main__":
    print("Setting all users to lowest level (Readonly - 20)...")
    set_all_users_to_lowest_level()

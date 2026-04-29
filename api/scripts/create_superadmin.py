#!/usr/bin/env python3
"""Bootstrap a SUPER_ADMIN crew member when the database is empty.

Usage:
    uv run python scripts/create_superadmin.py --nip 12345 --name "Nome" --password "senha"

The script fails if a user with the given NIP already exists.
"""

import argparse
import os
import sys

api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.users.models import Tripulante  # noqa: F401
from app.shared.enums import Role, StatusTripulante, TipoTripulante
from app.shared.rbac_models import Role as RoleModel
from app.utils.email import hash_code
from config import engine


def create_superadmin(nip: int, name: str, password: str) -> None:
    with Session(engine) as session:
        existing = session.get(Tripulante, nip)
        if existing is not None:
            print(f"Error: user with NIP {nip} already exists ({existing.name}).")
            sys.exit(1)

        role = session.execute(
            select(RoleModel).where(RoleModel.level == Role.SUPER_ADMIN.level)
        ).scalar_one_or_none()

        user = Tripulante(
            nip=nip,
            name=name,
            rank="",
            position="",
            email="",
            password=hash_code(password),
            tipo=TipoTripulante.PILOTO,
            status=StatusTripulante.PRESENTE,
            role_level=Role.SUPER_ADMIN.level,
            role_id=role.id if role else None,
        )
        session.add(user)
        session.commit()
        print(f"Created SUPER_ADMIN: NIP={nip}, name='{name}'")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap a SUPER_ADMIN user")
    parser.add_argument("--nip", type=int, required=True, help="Numeric NIP")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--password", required=True, help="Plain-text password (will be hashed)")
    args = parser.parse_args()
    create_superadmin(args.nip, args.name, args.password)


if __name__ == "__main__":
    main()

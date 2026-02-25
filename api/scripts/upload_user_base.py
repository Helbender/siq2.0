#!/usr/bin/env python3
"""Upload users from user_base.json to the database.

Converts old model format (pilots/crew with admin flag) to current model
(Tripulante with tipo, status, role_level). If a user exists (by NIP), updates
their fields; otherwise creates a new user.

Old format:
  - pilots: [{ nip, name, rank, position, email, admin, recover, squadron, password }]
  - crew:   [{ nip, name, rank, position, email, admin, recover, squadron, password }]

Current model: Tripulante with nip, name, rank, position, email, recover, squadron,
  password, tipo, status, role_level, role_id

Usage:
    cd api && python scripts/upload_user_base.py [--file path/to/user_base.json] [--dry-run]
"""

import argparse
import json
import os
import sys

# Add the api/ directory to Python path
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from sqlalchemy import select
from sqlalchemy.orm import Session

# Import related models so SQLAlchemy can resolve Tripulante relationships
from app.features.flights.models import Flight, FlightPilots  # noqa: F401
from app.features.qualifications.models import Qualificacao  # noqa: F401
from app.features.users.models import Tripulante, TripulanteQualificacao  # noqa: F401
from app.features.users.repository import UserRepository
from app.shared.enums import Role, StatusTripulante, TipoTripulante
from app.shared.rbac_models import Role as RoleModel
from app.utils.email import hash_code
from config import engine


# Position to TipoTripulante mapping (aligned with CrewTypesProvider and config)
POSITION_TO_TIPO = {
    "PI": TipoTripulante.PILOTO,
    "PC": TipoTripulante.PILOTO,
    "P": TipoTripulante.PILOTO,
    "CP": TipoTripulante.PILOTO,
    "PA": TipoTripulante.PILOTO,
    "OCI": TipoTripulante.OPERADOR_CABINE,
    "OC": TipoTripulante.OPERADOR_CABINE,
    "OCA": TipoTripulante.OPERADOR_CABINE,
    "CTI": TipoTripulante.CONTROLADOR_TATICO,
    "CT": TipoTripulante.CONTROLADOR_TATICO,
    "CTA": TipoTripulante.CONTROLADOR_TATICO,
    "OPVI": TipoTripulante.OPERADOR_VIGILANCIA,
    "OPV": TipoTripulante.OPERADOR_VIGILANCIA,
    "OPVA": TipoTripulante.OPERADOR_VIGILANCIA,
}


def _admin_to_role_level(admin: bool) -> int:
    """Map old admin boolean to role level. admin=True -> FLYERS, admin=False -> USER."""
    return Role.FLYERS.level if admin else Role.USER.level


def _position_to_tipo(position: str | None, default: TipoTripulante) -> TipoTripulante:
    """Map position code to TipoTripulante. Strips whitespace for lookup."""
    if not position:
        return default
    pos = str(position).strip().upper()
    return POSITION_TO_TIPO.get(pos, default)


def convert_old_user_to_new(old: dict, tipo: TipoTripulante) -> dict:
    """Convert old user record to current model fields."""
    admin = old.get("admin", False)
    role_level = _admin_to_role_level(admin)

    return {
        "nip": int(old["nip"]),
        "name": str(old.get("name", "")).strip(),
        "rank": (old.get("rank") or "").strip() or None,
        "position": (old.get("position") or "").strip() or None,
        "email": (old.get("email") or "").strip() or "",
        "recover": (old.get("recover") or "").strip() or "",
        "squadron": (old.get("squadron") or "").strip() or "",
        "password": (old.get("password") or "").strip() or hash_code("12345"),
        "tipo": tipo,
        "status": StatusTripulante.PRESENTE,
        "role_level": role_level,
    }


def load_users_from_json(filepath: str) -> list[dict]:
    """Load and convert all users from user_base.json format."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    users: list[dict] = []

    for old in data.get("pilots", []):
        user = convert_old_user_to_new(old, TipoTripulante.PILOTO)
        users.append(user)

    for old in data.get("crew", []):
        position = old.get("position") or ""
        tipo = _position_to_tipo(position, TipoTripulante.OPERADOR_CABINE)
        user = convert_old_user_to_new(old, tipo)
        users.append(user)

    return users


def upsert_users(
    session: Session,
    users: list[dict],
    dry_run: bool = False,
) -> tuple[int, int]:
    """Create or update users. Returns (created_count, updated_count)."""
    repo = UserRepository()
    created = 0
    updated = 0

    for u in users:
        nip = u["nip"]
        existing = repo.find_by_nip(session, nip)

        if existing:
            if not dry_run:
                existing.name = u["name"]
                existing.rank = u["rank"]
                existing.position = u["position"]
                existing.email = u["email"]
                existing.recover = u["recover"]
                existing.squadron = u["squadron"]
                existing.password = u["password"]
                existing.tipo = u["tipo"]
                existing.status = u["status"]
                # Leave role_level and role_id unchanged for existing users

                repo.update(session, existing)
            updated += 1
        else:
            if not dry_run:
                # New users get USER level; only existing users keep role_level from JSON
                role_level = Role.USER.level
                new_user = Tripulante(
                    nip=u["nip"],
                    name=u["name"],
                    rank=u["rank"],
                    position=u["position"],
                    email=u["email"],
                    recover=u["recover"],
                    squadron=u["squadron"],
                    password=u["password"],
                    tipo=u["tipo"],
                    status=u["status"],
                    role_level=role_level,
                )
                if role_level is not None:
                    role = session.execute(
                        select(RoleModel).where(RoleModel.level == role_level)
                    ).scalar_one_or_none()
                    new_user.role_id = role.id if role else None

                _, err = repo.create(session, new_user)
                if err:
                    print(f"  ⚠️  Failed to create NIP {nip}: {err}")
                    continue
            created += 1

    return created, updated


def main():
    parser = argparse.ArgumentParser(
        description="Upload users from user_base.json to the database (create or update by NIP)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--file",
        "-f",
        type=str,
        default=None,
        help="Path to user_base.json (default: scripts/user_base.json)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and convert only, do not write to database",
    )
    args = parser.parse_args()

    filepath = args.file
    if not filepath:
        filepath = os.path.join(api_dir, "scripts", "user_base.json")

    if not os.path.isfile(filepath):
        print(f"❌ Error: File not found: {filepath}")
        sys.exit(1)

    print(f"📂 Loading users from: {filepath}")
    users = load_users_from_json(filepath)
    print(f"   Found {len(users)} user(s)")

    if args.dry_run:
        print("🔍 Dry run: no changes will be written")
        for u in users[:5]:
            print(f"   - NIP {u['nip']}: {u['name']} ({u['tipo'].value}) role_level={u['role_level']}")
        if len(users) > 5:
            print(f"   ... and {len(users) - 5} more")
        return

    with Session(engine) as session:
        try:
            created, updated = upsert_users(session, users, dry_run=False)
            session.commit()
            print(f"✅ Done: {created} created, {updated} updated")
        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    main()

"""One-off script to remove duplicate tripulante_qualificacoes rows.

Keeps one row per (tripulante_id, qualificacao_id) with the latest
data_ultima_validacao (and highest id as tiebreaker). Run this before
applying the migration that adds the unique constraint, or run it
standalone to clean existing duplicates.

Usage (from api/):
  python scripts/cleanup_duplicate_tripulante_qualificacoes.py
"""

from __future__ import annotations

import os
import sys

api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, api_dir)

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from sqlalchemy import select
from sqlalchemy.orm import Session

# Load related models so SQLAlchemy mappers can resolve (same registry)
from app.features.flights.models import FlightPilots  # noqa: F401
from app.features.qualifications.models import Qualificacao  # noqa: F401
from app.features.users.models import TripulanteQualificacao
from config import engine


def main() -> None:
    with Session(engine) as session:
        all_tq = (
            session.execute(
                select(TripulanteQualificacao).order_by(
                    TripulanteQualificacao.tripulante_id,
                    TripulanteQualificacao.qualificacao_id,
                    TripulanteQualificacao.data_ultima_validacao.desc(),
                    TripulanteQualificacao.id.desc(),
                )
            )
            .scalars()
            .all()
        )

        # Keep first occurrence per (tripulante_id, qualificacao_id) (already ordered by latest date, then id)
        seen: set[tuple[int, int]] = set()
        to_delete: list[TripulanteQualificacao] = []
        for tq in all_tq:
            key = (tq.tripulante_id, tq.qualificacao_id)
            if key in seen:
                to_delete.append(tq)
            else:
                seen.add(key)

        if not to_delete:
            print("No duplicate tripulante_qualificacoes found.")
            return

        print(f"Found {len(to_delete)} duplicate row(s) to remove (keeping latest data_ultima_validacao per pair).")
        for tq in to_delete:
            session.delete(tq)
        session.commit()
        print(f"Deleted {len(to_delete)} duplicate(s). Done.")


if __name__ == "__main__":
    main()

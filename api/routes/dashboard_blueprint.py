from __future__ import annotations  # noqa: D100, INP001

from datetime import UTC, datetime


from config import engine  # type: ignore
from flask import Blueprint, Response, jsonify
from models.crew import Crew  # type: ignore
from models.flights import Flight  # type: ignore
from models.pilots import Pilot  # type: ignore
from models.users import year_init, User  # type: ignore
from sqlalchemy import func, select, extract
from sqlalchemy.orm import Session

dashboard = Blueprint("dashboard", __name__)


@dashboard.route("/", strict_slashes=False)
def send_data() -> tuple[Response | dict[str, str], int]:
    """Send data to dashboard."""

    print("Dashboard route called")
    # verify_jwt_in_request()
    with Session(engine) as session:
        # Get the current year
        current_year = datetime.now(UTC).year

        # Get the first year in the database
        first_year = session.execute(select(func.min(year_init)).select_from(Pilot)).scalar()

        # Get the last year in the database
        last_year = session.execute(select(func.max(year_init)).select_from(Pilot)).scalar()

        # Get the number of pilots0
        pilots = session.execute(select(func.count()).select_from(Pilot)).scalar()

        # Get the number of crew members
        crew = session.execute(select(func.count()).select_from(Crew)).scalar()

        # Get the number of general users members
        users = session.execute(select(func.count()).select_from(User)).scalar()

        # Get the number of flights
        flights = session.execute(
            select(func.count()).select_from(Flight).where(extract("year", Flight.date) == current_year)
        ).scalar()
        print(f"Number of flights in 2025: {flights}")

    alerta: dict = is_pilot_qualified("Alerta")
    vrp: dict = is_pilot_qualified("VRP")
    cur: dict = is_pilot_qualified("Currencies")

    data: dict = {
        "numberUser": [
            {"name": "Pilotos", "value": pilots},
            {"name": "OCs", "value": crew},
            {"name": "Usuários", "value": users},
        ],
        "alerta": [
            {"name": "Qualificados", "value": alerta["qualificados"]},
            {"name": "Não qualificados", "value": alerta["nao_qualificados"]},
        ],
        "vrp": [
            {"name": "Qualificados", "value": vrp["qualificados"]},
            {"name": "Não qualificados", "value": vrp["nao_qualificados"]},
        ],
        "currencies": [
            {"name": "Qualificados", "value": cur["qualificados"]},
            {"name": "Não qualificados", "value": cur["nao_qualificados"]},
        ],
        "flights": flights,
    }
    # print("Data to be sent:", data)
    return jsonify(data), 200


def is_pilot_qualified(type_qual):
    with Session(engine) as session:
        result: list = []
        stmt = select(Pilot).order_by(Pilot.nip)
        if session.execute(stmt).scalars().all() is not None:
            result.extend(session.execute(stmt).scalars().all())

        qualificados: int = 0
        não_qualificados: int = 0

        for i in result:
            # print(f"\nNome: {i.name}")
            # print(i.qualification.is_qualified())
            if i.qualification.is_qualified(type_qual):
                qualificados += 1
            else:
                não_qualificados += 1

    print(f"Qualificados: {qualificados}")
    print(f"Não qualificados: {não_qualificados}")
    return {"qualificados": qualificados, "nao_qualificados": não_qualificados}

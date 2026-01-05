from __future__ import annotations  # noqa: D100, INP001

import base64
import json
import os
import sys

# Add the api/ directory to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from config import engine
from app.features.flights.models import Flight, FlightPilots
from models.tripulantes import Tripulante
from sqlalchemy import select
from sqlalchemy.orm import Session

# Dicionário que queremos salvar
# meu_dicionario = {"nome": "João", "idade": 30, "cidade": "Lisboa"}

flights: list = []
i = 0

with Session(engine) as session:
    stmt = select(Flight).order_by(Flight.date.desc())
    flights_obj = session.execute(stmt).scalars()

    # Iterates through flights and creates JSON response
    for row in flights_obj:
        flights.append(row.to_json())  # Flight main data to JSON

        # Retrieves the Pilots from the DB
        stmt2 = select(FlightPilots).where(FlightPilots.flight_id == row.fid)
        flight_pilots = session.execute(stmt2).scalars()

        # Creates Empty list of pilots and crew to append to JSON
        flights[i][
            "flight_pilots"
        ] = []  # "flight_pilots" key used for compatability with the FRONTEND

        for flight_pilot in flight_pilots:
            result = session.execute(
                select(Tripulante).where(Tripulante.nip == flight_pilot.pilot_id),
            ).scalar_one_or_none()
            if result is None:
                flights[i]["flight_pilots"].append(
                    {"pilotName": "Not found, maybe deleted"}
                )
            else:
                flights[i]["flight_pilots"].append(flight_pilot.to_json())

        # NOTE: FlightCrew model does not exist in the current codebase
        # The original code attempted to query FlightCrew, but this functionality
        # appears to have been removed or never implemented
        i += 1


def flight_to_file(flight):
    print(flight)
    # Converter o dicionário para uma string JSON
    dados_json = json.dumps(flight)

    # Codificar a string JSON para binário usando base64
    dados_codificados = base64.b64encode(dados_json.encode("utf-8"))

    # Gravar os dados codificados em um arquivo binário
    # with open(f"database/1M_{flight["airtask"]}_{flight["date"]}_{flight["ATD"]}", "wb") as arquivo:
    with open("dados.bin", "wb") as arquivo:
        arquivo.write(dados_codificados)

    print("Dicionário gravado em formato JSON codificado em arquivo.")


for flight in flights:
    flight_to_file(flight)

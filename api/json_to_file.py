from __future__ import annotations  # noqa: D100, INP001

import base64
import json

from config import engine
from models.crew import Crew
from models.flights import Flight, FlightCrew, FlightPilots
from models.pilots import Pilot
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
                select(Pilot).where(Pilot.nip == flight_pilot.pilot_id),
            ).scalar_one_or_none()
            if result is None:
                flights[i]["flight_pilots"].append(
                    {"pilotName": "Not found, maybe deleted"}
                )
            else:
                flights[i]["flight_pilots"].append(flight_pilot.to_json())

        stmt3 = select(FlightCrew).where(FlightCrew.flight_id == row.fid)
        flight_crews = session.execute(stmt3).scalars()

        for flight_crew in flight_crews:
            result = session.execute(
                select(Crew).where(Crew.nip == flight_crew.crew_id),
            ).scalar_one_or_none()
            if result is None:
                flights[i]["flight_pilots"].append(
                    {"pilotName": "Not found, maybe deleted"}
                )
            else:
                flights[i]["flight_pilots"].append(flight_crew.to_json())
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

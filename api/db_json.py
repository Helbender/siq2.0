from __future__ import annotations  # noqa: D100, INP001

import json

from config import engine
from functions.sendemail import hash_code
from models.crew import Crew, QualificationCrew
from models.pilots import Pilot, Qualification
from models.users import User
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Dicionário que queremos salvar
# meu_dicionario = {"nome": "João", "idade": 30, "cidade": "Lisboa"}

# flights: list = []
# i = 0

# with Session(engine) as session:
#     stmt = select(Flight).order_by(Flight.date.desc())
#     flights_obj = session.execute(stmt).scalars()

#     # Iterates through flights and creates JSON response
#     for row in flights_obj:
#         flights.append(row.to_json())  # Flight main data to JSON

#         # Retrieves the Pilots from the DB
#         stmt2 = select(FlightPilots).where(FlightPilots.flight_id == row.fid)
#         flight_pilots = session.execute(stmt2).scalars()

#         # Creates Empty list of pilots and crew to append to JSON
#         flights[i]["flight_pilots"] = []  # "flight_pilots" key used for compatability with the FRONTEND

#         for flight_pilot in flight_pilots:
#             result = session.execute(
#                 select(Pilot).where(Pilot.nip == flight_pilot.pilot_id),
#             ).scalar_one_or_none()
#             if result is None:
#                 flights[i]["flight_pilots"].append({"pilotName": "Not found, maybe deleted"})
#             else:
#                 flights[i]["flight_pilots"].append(flight_pilot.to_json())

#         stmt3 = select(FlightCrew).where(FlightCrew.flight_id == row.fid)
#         flight_crews = session.execute(stmt3).scalars()

#         for flight_crew in flight_crews:
#             result_crew = session.execute(
#                 select(Crew).where(Crew.nip == flight_crew.crew_id),
#             ).scalar_one_or_none()
#             if result_crew is None:
#                 flights[i]["flight_pilots"].append({"pilotName": "Not found, maybe deleted"})
#             else:
#                 flights[i]["flight_pilots"].append(flight_crew.to_json())
#         i += 1


def download():
    with Session(engine) as session:
        lista = session.execute(select(Pilot)).scalars()
        lista2 = session.execute(select(Crew)).scalars()
        lista3 = session.execute(select(User)).scalars()

        with open("user_base.json", "w") as file:
            d = {"pilots": [], "crew": [], "users": []}
            for a in lista:
                d["pilots"].append(a.to_json())

            for b in lista2:
                d["crew"].append(b.to_json())
            for c in lista3:
                d["users"].append(c.to_json())
            json.dump(d, file, indent=4)
    return d


def upload():
    def check_integrity(session):
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            print(e)

    with open("user_base.json") as file:
        lista = json.load(file)
        with Session(engine) as session:
            for item in lista["pilots"]:
                obj = Pilot(qualification=Qualification())
                for k, v in item.items():
                    if k == "qualification":
                        continue
                    setattr(obj, k, v)
                obj.password = hash_code("12345")
                # print(obj.to_json())
                session.add(obj)
                check_integrity(session)
                continue
            for item in lista["crew"]:
                obj = Crew(qualification=QualificationCrew())
                for k, v in item.items():
                    if k == "qualification":
                        continue
                    setattr(obj, k, v)
                obj.password = hash_code("12345")
                # print(obj.to_json())
                session.add(obj)
                check_integrity(session)
                continue
            for item in lista["users"]:
                obj = User()
                for k, v in item.items():
                    if k == "qualification":
                        continue
                    setattr(obj, k, v)
                obj.password = hash_code("12345")
                # print(obj.to_json())
                session.add(obj)
                check_integrity(session)
                continue


def teste(a):
    try:
        int(a)
    except ValueError:
        int(a)
    finally:
        print("HAHAHA")


if __name__ == "__main__":
    download()
    # service = autenticar_drive()
    # print("\nservice autenticated\n")
    # for flight in flights:
    #     enviar_dados_para_pasta(
    #         service,
    #         flight,
    #         f"1M_{flight['airtask']}_{flight['date']}_{flight['ATD']}",
    #         "1AlVQSS8A6mu-bVJpP-ux--RKDnqnx4As",
    #     )

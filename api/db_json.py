from __future__ import annotations  # noqa: D100, INP001

import json

from functions.sendemail import hash_code
from models.crew import Crew, QualificationCrew
from models.flights import *
from models.pilots import Pilot, Qualification
from models.users import Base, User
from sqlalchemy import create_engine, exc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

DB_PASS = "siq"  # "G69ksWgAlMz~")  # Ensure to set this in your .env file
DB_USER = "siq"  # "esqpt_siq2")  # Ensure to set this in your .env file
DB_HOST = "localhost"  # "esq502.pt")
DB_PORT = 3306  # 3306)
DB_NAME = "siq"  # "esqpt_siq")

# connection_string = "sqlite:///database/mydb.db"

PILOT_USER: list = ["PI", "PC", "CP", "P", "PA"]
CREW_USER: list = ["OC", "OCI", "OCA", "CT", "CTA", "CTI", "OPV", "OPVI", "OPVA"]

# Define connection string
connection_string = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    # Create the SQLAlchemy engine with improved configuration
    engine = create_engine(
        connection_string,
        pool_size=200,  # Adjust based on your needs
        max_overflow=10,  # Allow some overflow
        pool_timeout=30,  # Wait time for getting a connection
        pool_recycle=3600,  # Recycle connections every hour
        pool_pre_ping=True,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database setup completed successfully.")

except exc.SQLAlchemyError as e:
    print(f"An error occurred while setting up the database:\n {e}")


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


def teste():
    with Session(engine) as session:
        result: list = []
        stmt = select(Pilot).order_by(Pilot.nip)
        if session.execute(stmt).scalars().all() is not None:
            result.extend(session.execute(stmt).scalars().all())
        ordered_list: list = sorted([row.to_json(qualification_data=True) for row in result], key=lambda x: x["nip"])

    qualificados: int = 0
    não_qualificados: int = 0
    for i in result:
        print(i.qualification.is_qualified())
        if i.qualification.is_qualified():
            qualificados += 1
        else:
            não_qualificados += 1
    # q = 0
    # nq = 0
    # keys = list(ordered_list[0]["qualification"].keys())
    # print(keys)
    # sem = keys[4:-4]
    # f = keys[-6:-2]
    # for i in ordered_list:
    #     for k in sem:
    #         print(f"{k}: {i['qualification'][k]}")
    #         if int(i["qualification"][k][0]) > 180:
    #             qualificado = True
    #         else:
    #             qualificado = False
    #             break
    #     for k in f:
    #         print(f"{k}: {i['qualification'][k]}")
    #         if int(i["qualification"][k][0]) > 45:
    #             qualificado = True
    #         else:
    #             qualificado = False
    #             break
    #     if qualificado:
    #         q += 1
    #     else:
    #         nq += 1
    print(f"Qualificados: {qualificados}")
    print(f"Não qualificados: {não_qualificados}")
    return {"qualificados": qualificados, "nao_qualificados": não_qualificados}


if __name__ == "__main__":
    teste()

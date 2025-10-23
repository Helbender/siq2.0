from __future__ import annotations  # noqa: D100, INP001
import os


from datetime import date
from config import CREW_USER, PILOT_USER, engine  # type: ignore
from models.crew import Crew, QualificationCrew  # type: ignore
from models.flights import Flight, FlightCrew, FlightPilots  # type: ignore
from models.pilots import Pilot, Qualification  # type: ignore
from models.users import year_init  # type: ignore
from sqlalchemy import func, select, exc
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from datetime import datetime, UTC
import json
import base64


load_dotenv(dotenv_path="./.env")
ID_PASTA_VOO = os.environ.get("ID_PASTA_VOO", "")
ID_PASTA_PDF = os.environ.get("ID_PASTA_PDF", "")


def update_qualifications(
    flight_id: int,
    session: Session,
    tripulante: FlightPilots | FlightCrew,
) -> None:
    """Update qualification of all crew before flight delete."""
    if isinstance(tripulante, FlightPilots):
        # pilot_qualification = session.query(Qualification).filter_by(pilot_id=tripulante.pilot_id).first()  # noqa: ERA001
        pilot_qualification: Qualification = session.execute(
            select(Qualification).filter_by(pilot_id=tripulante.pilot_id),
        ).scalar_one()

        # Process repetion Qualifications
        qualification_fields = [
            "day_landings",
            "night_landings",
            "prec_app",
            "nprec_app",
        ]
        # Query the most recent dates for day landings from other flights
        for i in range(len(qualification_fields)):
            process_repetion_qual(
                session,
                flight_id,
                tripulante,
                pilot_qualification,
                qualification_fields[i],
            )

        # For each qualification type, find the last relevant flight before the one being deleted
        qualification_fields = ["qa1", "qa2", "bsp1", "bsp2", "ta", "vrp1", "vrp2", "cto", "sid", "mono", "nfp"]
        for field in qualification_fields:
            last_qualification_date = session.execute(
                select(func.max(Flight.date))
                .join(FlightPilots)
                .where(FlightPilots.pilot_id == tripulante.pilot_id)
                .where(Flight.fid != flight_id)
                .where(getattr(FlightPilots, field) != 0),
            ).scalar_one_or_none()

            # Check if Date is None so to set a base Date
            last_qualification_date = (
                date(year_init, 1, 1) if last_qualification_date is None else last_qualification_date
            )

            # Update the tripulante's qualifications table
            setattr(pilot_qualification, f"last_{field}_date", last_qualification_date)

    elif isinstance(tripulante, FlightCrew):
        crew_qualification = session.query(QualificationCrew).filter_by(crew_id=tripulante.crew_id).first()

        # For each qualification type, find the last relevant flight before the one being deleted
        qualification_fields = [
            "bsoc",
        ]

        for field in qualification_fields:
            last_qualification_date = session.execute(
                select(func.max(Flight.date))
                .join(FlightCrew)
                # .where(Flight.flight_crew.any(pilot_id=tripulante.crew_id))
                .where(FlightCrew.crew_id == tripulante.crew_id)
                .where(Flight.fid != flight_id)
                .where(getattr(FlightCrew, field) != 0),
            ).scalar_one_or_none()
            # last_qualification_date = (
            #     session.query(func.max(Flight.date))
            #     .filter(
            #         and_(
            #             Flight.flight_crew.any(crew_id=tripulante.crew_id),
            #             Flight.fid != flight_id,
            #             (getattr(FlightCrew, field) != 0),
            #         ),
            #     )
            #     .scalar()
            # )
            # print(f"\n{tripulante.crew_id}\nLast Qualification {field}: {last_qualification_date}\n\n")
            # Check if Date is None so to set a base Date
            if last_qualification_date is None:
                last_qualification_date = date(year_init, 1, 1)
            # Update the tripulante's qualifications table
            setattr(crew_qualification, f"last_{field}_date", last_qualification_date)


def process_repetion_qual(
    session: Session,
    flight_id: int,
    tripulante: FlightPilots,
    pilot_qualification: Qualification,
    qualification_field: str,
) -> None:
    """Update Qualification table with data from other flights when deleting flights.

    Used for repetion based qualifications
    """
    # print(f"\nProcessing {qualification_field}")
    recent_qualications = session.execute(
        select(Flight.date, getattr(FlightPilots, qualification_field))  # FlightPilots.day_landings)
        .join(FlightPilots)
        .where(Flight.flight_pilots.any(pilot_id=tripulante.pilot_id))
        .where(Flight.fid != flight_id)
        .where(getattr(FlightPilots, qualification_field) > 0)
        .order_by(Flight.date.desc()),
        # .limit(5 - len(day_landings_dates)),
    ).all()

    # print(f"\nRecent {qualification_field}:\t{recent_qualications}\n")

    # Ensure there are no more than 5 entries
    qualification_dates = [date[0].strftime("%Y-%m-%d") for date in recent_qualications]

    # Sort the dates in reverse chronological order
    qualification_dates.sort(reverse=True)

    # Update the qualification record
    setattr(
        pilot_qualification,
        f"last_{qualification_field}",
        " ".join(qualification_dates[:5]),
    )
    # print(f"After Qual {qualification_field}:\t{getattr(pilot_qualification, f'last_{qualification_field}')}\n")


def add_crew_and_pilots(session: Session, flight: Flight, pilot: dict, edit: bool = False) -> None:
    """Check type of crew and add it to respective Model Object."""
    # Garanties data integrety while introducing several flights

    for i in range(1, 7):
        QUAL = "QUAL" + str(i)
        if QUAL in pilot and pilot[QUAL] != "":
            pilot[pilot[QUAL]] = True

    if pilot["position"] in PILOT_USER:
        for k in ["ATR", "ATN", "precapp", "nprecapp"]:
            try:
                pilot[k] = 0 if pilot[k] == "" else pilot[k]
            except KeyError:
                pilot[k] = 0
        for k in ["QA1", "QA2", "BSP1", "BSP2", "TA", "VRP1", "VRP2", "CTO", "SID", "MONO", "NFP"]:
            if k not in pilot.keys():
                pilot[k] = False
        pilot_obj: Pilot = session.get(Pilot, pilot["nip"])  # type: ignore  # noqa: PGH003
        if pilot_obj is None:
            return
        qual_p: Qualification = session.get(Qualification, pilot["nip"])  # type: ignore  # noqa: PGH003

        # Check if the pilot already exists in the database and edit it if true
        if edit:
            # Update the existing FlightPilots object
            flight_pilot: FlightPilots = session.execute(
                select(FlightPilots)
                .where(FlightPilots.flight_id == flight.fid)
                .where(FlightPilots.pilot_id == pilot["nip"]),
            ).scalar_one_or_none()
            if flight_pilot is not None:
                flight_pilot.position = pilot["position"]
                flight_pilot.day_landings = int(pilot["ATR"])
                flight_pilot.night_landings = int(pilot["ATN"])
                flight_pilot.prec_app = int(pilot["precapp"])
                flight_pilot.nprec_app = int(pilot["nprecapp"])
                flight_pilot.qa1 = pilot["QA1"]
                flight_pilot.qa2 = pilot["QA2"]
                flight_pilot.bsp1 = pilot["BSP1"]
                flight_pilot.bsp2 = pilot["BSP2"]
                flight_pilot.ta = pilot["TA"]
                flight_pilot.vrp1 = pilot["VRP1"]
                flight_pilot.vrp2 = pilot["VRP2"]
                flight_pilot.cto = pilot["CTO"]
                flight_pilot.sid = pilot["SID"]
                flight_pilot.mono = pilot["MONO"]
                flight_pilot.nfp = pilot["NFP"]
        else:
            flight_pilot = FlightPilots(
                position=pilot["position"],
                day_landings=int(pilot["ATR"]),
                night_landings=int(pilot["ATN"]),
                prec_app=int(pilot["precapp"]),
                nprec_app=int(pilot["nprecapp"]),
                qa1=pilot["QA1"],
                qa2=pilot["QA2"],
                bsp1=pilot["BSP1"],
                bsp2=pilot["BSP2"],
                ta=pilot["TA"],
                vrp1=pilot["VRP1"],
                vrp2=pilot["VRP2"],
                cto=pilot["CTO"],
                sid=pilot["SID"],
                mono=pilot["MONO"],
                nfp=pilot["NFP"],
            )

        qual_p.update(flight_pilot, flight.date)

        pilot_obj.flight_pilots.append(flight_pilot)
        flight.flight_pilots.append(flight_pilot)

    elif pilot["position"] in CREW_USER:
        for k in ["BSOC"]:
            if k not in pilot.keys():
                pilot[k] = False

        crew_obj: Crew = session.get(Crew, pilot["nip"])  # type: ignore  # noqa: PGH003
        if crew_obj is None:
            print(f"Error: Crew {pilot['nip']} not found")
            return
        qual_c: QualificationCrew = session.get(QualificationCrew, pilot["nip"])  # type: ignore  # noqa: PGH003

        if edit:
            # Update the existing FlightCrew object
            flight_crew: FlightCrew = session.execute(
                select(FlightCrew).where(FlightCrew.flight_id == flight.fid).where(FlightCrew.crew_id == pilot["nip"]),
            ).scalar_one_or_none()
            if flight_crew is not None:
                flight_crew.position = pilot["position"]
                flight_crew.bsoc = pilot["BSOC"]
            else:
                flight_crew = FlightCrew(
                    position=pilot["position"],
                    bsoc=pilot["BSOC"],
                )
        else:
            flight_crew = FlightCrew(
                position=pilot["position"],
                bsoc=pilot["BSOC"],
            )
        qual_c.update(flight_crew, flight.date)

        crew_obj.flight_crew.append(flight_crew)
        flight.flight_crew.append(flight_crew)
    else:
        print("Not a valid Crew Member")


# Caminho base onde começa a estrutura ano/mes/dia
base_path = os.getcwd()
print(base_path)
load_dotenv(dotenv_path="./.env")
ID_PASTA_VOO = os.environ.get("ID_PASTA_VOO", "")
ID_PASTA_PDF = os.environ.get("ID_PASTA_PDF", "")


# Iterar por todos os diretórios e ficheiros
with Session(engine, autoflush=False) as session:
    #     f = []
    #     stmt = select(Flight).order_by(Flight.date.desc())
    #     flights_obj = session.execute(stmt).scalars()
    #     print("Flights READY")
    #     # Iterates through flights and creates JSON response
    #     for row in flights_obj:
    #         f.append(row.to_json())
    # for i in f:
    #     print(i["airtask"])
    #     print(i["date"])
    #     nome_arquivo_voo = f"1M {i['airtask']} {i['date'].replace('-', '')} {i['ATD'].strip(':')} {i['tailNumber']}.1m"
    #     # nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")
    #     upload_with_service_account(dados=i, nome_arquivo_drive=nome_arquivo_voo, id_pasta=ID_PASTA_VOO)
    # Iterar por todos os diretórios e ficheiros
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith(".1m"):
                file_path = os.path.join(root, file)
                print(f"Processando ficheiro: {file_path}")
                with open(file_path, "rb") as f:
                    conteudo_base64 = f.read()

                # Decodificar base64 → JSON string → dicionário Python
                json_str = base64.b64decode(conteudo_base64).decode("utf-8")
                f = json.loads(json_str)
                flight = Flight(
                    airtask=f["airtask"],
                    date=datetime.strptime(f["date"], "%d-%b-%Y").replace(tzinfo=UTC).date(),
                    origin=f["origin"],
                    destination=f["destination"],
                    departure_time=f["ATD"],
                    arrival_time=f["ATA"],
                    flight_type=f["flightType"],
                    flight_action=f["flightAction"],
                    tailnumber=f["tailNumber"],
                    total_time=f["ATE"],
                    atr=f["totalLandings"],
                    passengers=f["passengers"],
                    doe=f["doe"],
                    cargo=f["cargo"],
                    number_of_crew=f["numberOfCrew"],
                    orm=f["orm"],
                    fuel=f["fuel"],
                )

                session.add(flight)
                pilot: dict

                # for i in range(6):
                try:
                    for pilot in f["flight_pilots"]:
                        add_crew_and_pilots(session, flight, pilot)
                except KeyError:
                    print("KeyError")
                    continue
    try:
        session.flush()
        print("Session Flushed")
    except exc.IntegrityError as e:
        session.rollback()
        print("\n", e.orig.__repr__())
    else:
        session.commit()
        print("Session Commited")

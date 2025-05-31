from __future__ import annotations  # noqa: D100, INP001

import os
import time
from datetime import UTC, date, datetime
from threading import Thread

from config import CREW_USER, PILOT_USER, engine  # type:ignore  # noqa: PGH003
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from functions.gdrive import tarefa_enviar_para_drive  # type:ignore  # noqa: PGH003
from models.crew import Crew, QualificationCrew  # type:ignore  # noqa: PGH003
from models.flights import Flight, FlightCrew, FlightPilots  # type:ignore  # noqa: PGH003
from models.pilots import Pilot, Qualification  # type:ignore  # noqa: PGH003
from models.users import year_init  # type:ignore  # noqa: PGH003
from sqlalchemy import exc, func, select
from sqlalchemy.orm import Session

flights = Blueprint("flights", __name__)

# Load enviroment variables
load_dotenv(dotenv_path="./.env")
DEV = bool(os.environ.get("DEV", "0"))


# FLight ROUTES
@flights.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_flights() -> tuple[Response, int]:
    """Retrieve all flights from the db and sends to frontend.

    Returns:
        tuple[Response, int]: _description_

    """
    # Retrieve all flights from db
    if request.method == "GET":
        start_time = time.perf_counter()
        flights: list = []

        with Session(engine) as session:
            stmt = select(Flight).order_by(Flight.date.desc())
            flights_obj = session.execute(stmt).scalars()
            # Iterates through flights and creates JSON response
            # flights = [row.to_json() for row in flights_obj]  # Flight main data to JSON
            for row in flights_obj:
                flights.append(row.to_json())  # Flight main data to JSON

        end_time = time.perf_counter()
        print(f"Tempo medio: {(end_time - start_time) / len(flights):.4f} segundos")
        print(f"Tempo total: {end_time - start_time:.4f} segundos")
        return jsonify(flights), 200

    # Retrieves flight from Frontend and saves is to DB
    if request.method == "POST":
        verify_jwt_in_request()
        f: dict = request.get_json()

        with Session(engine) as session:
            flight: Flight = session.execute(
                select(Flight)
                .where(Flight.airtask == f["airtask"])
                .where(Flight.date == datetime.strptime(f["date"], "%Y-%m-%d").replace(tzinfo=UTC).date())
                .where(Flight.tailnumber == f["tailNumber"])
                .where(Flight.departure_time == f["ATD"]),
            ).scalar_one_or_none()

            if flight is not None:
                return jsonify({"message": f"O voo já existe com o ID {flight.fid}"}), 400

        flight = Flight(
            airtask=f["airtask"],
            date=datetime.strptime(f["date"], "%Y-%m-%d").replace(tzinfo=UTC).date(),
            origin=f.get("origin", ""),
            destination=f.get("destination", ""),
            departure_time=f.get("ATD", ""),
            arrival_time=f.get("ATA", ""),
            flight_type=f.get("flightType", ""),
            flight_action=f.get("flightAction", ""),
            tailnumber=f.get("tailNumber", ""),
            total_time=f.get("ATE", ""),
            atr=f.get("totalLandings", 0),
            passengers=f.get("passengers", 0),
            doe=f.get("doe", 0),
            cargo=f.get("cargo", 0),
            number_of_crew=f.get("numberOfCrew", 0),
            orm=f.get("orm", 0),
            fuel=f.get("fuel", 0),
            activation_first=f.get("activationFirst", "__:__"),
            activation_last=f.get("activationLast", "__:__"),
            ready_ac=f.get("readyAC", "__:__"),
            med_arrival=f.get("medArrival", "__:__"),
        )
        with Session(engine, autoflush=False) as session:
            session.add(flight)
            pilot: dict

            # for i in range(6):
            for pilot in f["flight_pilots"]:
                add_crew_and_pilots(session, flight, pilot)
            try:
                session.flush()
            except exc.IntegrityError as e:
                session.rollback()
                print("\n", e.orig.__repr__())
                return jsonify({"message": e.orig.__repr__()}), 400
            else:
                session.commit()
                nome_arquivo_voo = flight.get_file_name()
                nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        # Lançar a tarefa de envio em background
        if not DEV:
            Thread(target=tarefa_enviar_para_drive, args=(f, nome_arquivo_voo, nome_pdf)).start()

        return jsonify({"message": flight.fid}), 201
    return jsonify({"message": "Bad Manual Request"}), 403


@flights.route("/<int:flight_id>", methods=["DELETE", "PATCH"], strict_slashes=False)
def handle_flights(flight_id: int) -> tuple[Response, int]:
    """Handle modifications to the Flights database."""
    if request.method == "PATCH":
        verify_jwt_in_request()
        f: dict = request.get_json()
        with Session(engine, autoflush=False) as session:
            flight: Flight = session.execute(select(Flight).where(Flight.fid == flight_id)).scalar_one_or_none()

            flight.airtask = f.get("airtask", "")
            flight.date = datetime.strptime(f["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
            flight.origin = f.get("origin", "")
            flight.destination = f.get("destination", "")
            flight.departure_time = f.get("ATD", "")
            flight.arrival_time = f.get("ATA", "")
            flight.flight_type = f.get("flightType", "")
            flight.flight_action = f.get("flightAction", "")
            flight.tailnumber = f.get("tailNumber", "")
            flight.total_time = f.get("ATE", "")
            flight.atr = f.get("totalLandings", 0)
            flight.passengers = f.get("passengers", 0)
            flight.doe = f.get("doe", 0)
            flight.cargo = f.get("cargo", 0)
            flight.number_of_crew = f.get("numberOfCrew", 0)
            flight.orm = f.get("orm", 0)
            flight.fuel = f.get("fuel", 0)
            flight.activation_first = f.get("activationFirst", "__:__")
            flight.activation_last = f.get("activationLast", "__:__")
            flight.ready_ac = f.get("readyAC", "__:__")
            flight.med_arrival = f.get("medArrival", "__:__")

            pilot: dict

            for pilot in f["flight_pilots"]:
                update_qualifications(flight_id, session, pilot)
                add_crew_and_pilots(session, flight, pilot, edit=True)

            session.commit()
            session.refresh(flight)
            nome_arquivo_voo = flight.get_file_name()
            nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        if not DEV:
            Thread(target=tarefa_enviar_para_drive, args=(f, nome_arquivo_voo, nome_pdf)).start()
        return jsonify({"message": "Flight changed"}), 204

    if request.method == "DELETE":
        with Session(engine, autoflush=False) as session:
            flight = session.execute(select(Flight).where(Flight.fid == flight_id)).scalar_one_or_none()
            if not flight:
                return jsonify({"msg": "Flight not found"}), 404

            # Iterate over each pilot in the flight
            for pilot in flight.flight_pilots:
                update_qualifications(flight_id, session, pilot)

            # Iterate over each crew in the flight
            for crew in flight.flight_crew:
                update_qualifications(flight_id, session, crew)

            # Commit the updates
            session.commit()
            # Now delete the flight
            session.delete(flight)
            session.commit()
            return jsonify({"deleted_id": f"Flight {flight_id}"}), 200

    return jsonify({"message": "Bad Manual Request"}), 403


def update_qualifications(
    flight_id: int,
    session: Session,
    tripulante: FlightPilots | FlightCrew,
) -> None:
    """Update qualification of all crew before flight delete."""
    if isinstance(tripulante, FlightPilots):
        # pilot_qualification = session.query(Qualification).filter_by(pilot_id=tripulante.pilot_id).first()
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
        qualification_fields = [
            "bskit",
            "qa1",
            "qa2",
            "bsp1",
            "bsp2",
            "ta",
            "vrp1",
            "vrp2",
            "cto",
            "sid",
            "mono",
            "nfp",
            "paras",
            "nvg",
        ]
        for field in qualification_fields:
            last_qualification_date = session.execute(
                select(func.max(Flight.date))
                .join(FlightPilots)
                .where(FlightPilots.pilot_id == tripulante.pilot_id)
                .where(Flight.fid != flight_id)
                .where(getattr(FlightPilots, field) != False),
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
            "bskit",
        ]

        for field in qualification_fields:
            last_qualification_date = session.execute(
                select(func.max(Flight.date))
                .join(FlightCrew)
                .where(FlightCrew.crew_id == tripulante.crew_id)
                .where(Flight.fid != flight_id)
                .where(getattr(FlightCrew, field) != False),
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


def add_crew_and_pilots(session: Session, flight: Flight, pilot: dict, edit: bool = False) -> None:  # noqa: FBT001, FBT002
    """Check type of crew and add it to respective Model Object."""
    # Garanties data integrety while introducing several flights

    for i in range(1, 7):
        qual = "QUAL" + str(i)
        if qual in pilot and pilot[qual] != "":
            pilot[pilot[qual]] = True

    if pilot["position"] in PILOT_USER:
        for k in ["ATR", "ATN", "precapp", "nprecapp"]:
            try:
                pilot[k] = 0 if pilot[k] == "" else pilot[k]
            except KeyError:
                pilot[k] = 0
        for k in [
            "QA1",
            "QA2",
            "BSP1",
            "BSP2",
            "TA",
            "VRP1",
            "VRP2",
            "CTO",
            "SID",
            "MONO",
            "NFP",
            "PARAS",
            "BSKIT",
            "NVG",
        ]:
            if k not in pilot:
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
                flight_pilot.qa1 = pilot.get("QA1", False)
                flight_pilot.qa2 = pilot.get("QA2", False)
                flight_pilot.bsp1 = pilot.get("BSP1", False)
                flight_pilot.bsp2 = pilot.get("BSP2", False)
                flight_pilot.ta = pilot.get("TA", False)
                flight_pilot.vrp1 = pilot.get("VRP1", False)
                flight_pilot.vrp2 = pilot.get("VRP2", False)
                flight_pilot.cto = pilot.get("CTO", False)
                flight_pilot.sid = pilot.get("SID", False)
                flight_pilot.mono = pilot.get("MONO", False)
                flight_pilot.nfp = pilot.get("NFP", False)
                flight_pilot.paras = pilot.get("PARAS", False)
                flight_pilot.nvg = pilot.get("NVG", False)
                flight_pilot.bskit = pilot.get("BSKIT", False)
        else:
            flight_pilot = FlightPilots(
                position=pilot["position"],
                day_landings=int(pilot["ATR"]),
                night_landings=int(pilot["ATN"]),
                prec_app=int(pilot["precapp"]),
                nprec_app=int(pilot["nprecapp"]),
                qa1=pilot.get("QA1", False),
                qa2=pilot.get("QA2", False),
                bsp1=pilot.get("BSP1", False),
                bsp2=pilot.get("BSP2", False),
                ta=pilot.get("TA", False),
                vrp1=pilot.get("VRP1", False),
                vrp2=pilot.get("VRP2", False),
                cto=pilot.get("CTO", False),
                sid=pilot.get("SID", False),
                mono=pilot.get("MONO", False),
                nfp=pilot.get("NFP", False),
                paras=pilot.get("PARAS", False),
                nvg=pilot.get("NVG", False),
                bskit=pilot.get("BSKIT", False),
            )

        qual_p.update(flight_pilot, flight.date)

        pilot_obj.flight_pilots.append(flight_pilot)
        flight.flight_pilots.append(flight_pilot)

    elif pilot["position"] in CREW_USER:
        for k in ["BSOC", "BSKIT"]:
            if k not in pilot:
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
                    bskit=pilot["BSKIT"],
                )
        else:
            flight_crew = FlightCrew(
                position=pilot["position"],
                bsoc=pilot["BSOC"],
                bskit=pilot["BSKIT"],
            )
        qual_c.update(flight_crew, flight.date)

        crew_obj.flight_crew.append(flight_crew)
        flight.flight_crew.append(flight_crew)
    else:
        print("Not a valid Crew Member")

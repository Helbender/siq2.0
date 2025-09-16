from __future__ import annotations  # noqa: D100, INP001

import os
from datetime import UTC, date, datetime
from threading import Thread

from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy import exc, func, select
from sqlalchemy.orm import Session

from config import engine  # type:ignore  # noqa: PGH003
from functions.gdrive import tarefa_enviar_para_drive  # type:ignore  # noqa: PGH003
from models import year_init  # type:ignore  # noqa: PGH003
from models.flights import (  # type:ignore  # noqa: PGH003
    Flight,
    FlightPilots,
)
from models.qualificacoes import Qualificacao  # type:ignore
from models.tripulantes import Tripulante, TripulanteQualificacao  # type:ignore

flights = Blueprint("flights", __name__)

# Load enviroment variables
load_dotenv(dotenv_path="./.env")
DEV = bool(os.environ.get("DEV", "0"))

converter: dict = {"ATR": "day_landings", "ATN": "night_landings", "precapp": "prec_app", "nprecapp": "nprec_app"}


# Flight ROUTES
@flights.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_flights() -> tuple[Response, int]:
    """Retrieve all flights from the db and sends to frontend.

    Returns:
        tuple[Response, int]: _description_

    """
    # Retrieve all flights from db
    if request.method == "GET":
        print("Retrieving all flights")
        flights: list = []

        with Session(engine) as session:
            stmt = (
                select(Flight).order_by(Flight.date.desc())
                # .options(
                #     joinedload(Flight.flight_pilots).joinedload(FlightPilots.pilot),
                #     joinedload(Flight.flight_crew).joinedload(FlightCrew.crew),
                # )
            )
            flights_obj = session.execute(stmt).unique().scalars()
            # end_time = time.perf_counter()
            # print(f"Tempo DB: {end_time - start_time:.4f} segundos")

            # Iterates through flights and creates JSON response
            flights = [row.to_json() for row in flights_obj]  # Flight main data to JSON

        # end_time = time.perf_counter()
        # print(f"Tempo medio: {(end_time - start_time) / len(flights):.4f} segundos")
        # print(f"Tempo total: {end_time - start_time:.4f} segundos")
        print(f"Total Flights: {len(flights)}")
        return jsonify(flights), 200

    # Retrieves flight from Frontend and saves is to DB
    if request.method == "POST":
        # verify_jwt_in_request()
        f: dict = request.get_json()

        print(f"\nAdding Flight {f['airtask']} on {f['date']} to the Database")

        print(f"\nFlight Data: {f}\n")
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

            try:
                f["flight_pilots"]
            except KeyError:
                return jsonify({"message": "At least one pilot is required"}), 400

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
                update_qualifications_on_delete(flight_id, session, pilot)
                add_crew_and_pilots(session, flight, pilot, edit=True)

            session.commit()
            session.refresh(flight)
            nome_arquivo_voo = flight.get_file_name()
            nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        if not DEV:
            Thread(target=tarefa_enviar_para_drive, args=(f, nome_arquivo_voo, nome_pdf)).start()
        return jsonify({"message": "Flight changed"}), 204

    if request.method == "DELETE":
        verify_jwt_in_request()

        with Session(engine, autoflush=False) as session:
            flight: Flight | None = session.execute(select(Flight).where(Flight.fid == flight_id)).scalar_one_or_none()
            if flight is None:
                return jsonify({"msg": "Flight not found"}), 404
            for k, v in flight.to_json().items():
                print(f"{k}: {v}")
            # Iterate over each pilot in the flight
            for pilot in flight.flight_pilots:
                update_qualifications_on_delete(flight_id, session, pilot)

            # Commit the updates
            session.commit()
            # Now delete the flight
            session.delete(flight)
            session.commit()
            return jsonify({"deleted_id": f"Flight {flight_id}"}), 200

    return jsonify({"message": "Bad Manual Request"}), 403


def update_qualifications_on_delete(
    flight_id: int,
    session: Session,
    tripulante: FlightPilots,
) -> None:
    # Find all TripulanteQualificacao records for this pilot
    tripulante_quals = (
        session.execute(
            select(TripulanteQualificacao).where(TripulanteQualificacao.tripulante_id == tripulante.pilot_id)
        )
        .scalars()
        .all()
    )

    for pq in tripulante_quals:
        print(f"\nProcessing Qualification {pq.qualificacao.nome} for Pilot {tripulante.pilot_id}")
        # for q in ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]:
        # print(f"Checking FlightPilots.{q} == {pq.qualificacao.nome}")
        # Find the most recent flight (excluding the one being deleted) where this qualification was validated
        from sqlalchemy import or_

        qual_fields = ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]
        qual_conditions = [getattr(FlightPilots, field) == pq.qualificacao.nome for field in qual_fields]
        last_date = session.execute(
            select(func.max(Flight.date))
            .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
            .where(FlightPilots.pilot_id == tripulante.pilot_id)
            .where(Flight.fid != flight_id)
            .where(or_(*qual_conditions))
        ).scalar_one_or_none()
        print(f"Last date for {pq.qualificacao.nome}: {last_date}")

        # If no other flights, set to None or a base date
        pq.data_ultima_validacao = last_date if last_date else date(year_init, 1, 1)
        print(f"Updated pq.data_ultima_validacao to {pq.data_ultima_validacao}")
        # session.add(pq)

    # """Update qualification of all crew before flight delete."""
    # pilot_qualification: Qualification = session.execute(
    #     select(Qualification).filter_by(pilot_id=tripulante.pilot_id),
    # ).scalar_one()

    # # Process repetion Qualifications
    # qualification_fields = [
    #     "day_landings",
    #     "night_landings",
    #     "prec_app",
    #     "nprec_app",
    # ]
    # # Query the most recent dates for day landings from other flights
    # for i in range(len(qualification_fields)):
    #     process_repetion_qual(
    #         session,
    #         flight_id,
    #         tripulante,
    #         pilot_qualification,
    #         qualification_fields[i],
    #     )

    # # For each qualification type, find the last relevant flight before the one being deleted
    # qualification_fields = [
    #     "bskit",
    #     "qa1",
    #     "qa2",
    #     "bsp1",
    #     "bsp2",
    #     "ta",
    #     "vrp1",
    #     "vrp2",
    #     "cto",
    #     "sid",
    #     "mono",
    #     "nfp",
    #     "paras",
    #     "nvg",
    # ]
    # for field in qualification_fields:
    #     last_qualification_date = session.execute(
    #         select(func.max(Flight.date))
    #         .join(FlightPilots)
    #         .where(FlightPilots.pilot_id == tripulante.pilot_id)
    #         .where(Flight.fid != flight_id)
    #         .where(getattr(FlightPilots, field) != False),
    #     ).scalar_one_or_none()

    #     # Check if Date is None so to set a base Date
    #     last_qualification_date = date(year_init, 1, 1) if last_qualification_date is None else last_qualification_date

    #     # Update the tripulante's qualifications table
    #     setattr(pilot_qualification, f"last_{field}_date", last_qualification_date)


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

    print(f"\nProcessing Pilot/Crew NIP: {pilot['nip']}")
    pilot_obj: Tripulante = session.get(Tripulante, pilot["nip"])  # type: ignore  # noqa: PGH003

    if pilot_obj is None:
        print(f"Error: Pilot {pilot['nip']} not found")
        return
    # Check if the pilot already exists in the database and edit it if true
    if edit:
        # Update the existing FlightPilots object
        flight_pilot: FlightPilots | None = session.execute(
            select(FlightPilots)
            .where(FlightPilots.flight_id == flight.fid)
            .where(FlightPilots.pilot_id == pilot["nip"]),
        ).scalar_one_or_none()
        if flight_pilot is not None:
            flight_pilot.position = pilot["position"]
            flight_pilot.day_landings = pilot.get("ATR", 0)
            flight_pilot.night_landings = pilot.get("ATN", 0)
            flight_pilot.prec_app = pilot.get("precapp", 0)
            flight_pilot.nprec_app = pilot.get("nprecapp", 0)
            flight_pilot.qual1 = pilot.get("QUAL1", False)
            flight_pilot.qual2 = pilot.get("QUAL2", False)
            flight_pilot.qual3 = pilot.get("QUAL3", False)
            flight_pilot.qual4 = pilot.get("QUAL4", False)
            flight_pilot.qual5 = pilot.get("QUAL5", False)
            flight_pilot.qual6 = pilot.get("QUAL6", False)
        else:
            return
    else:
        flight_pilot = FlightPilots(
            position=pilot["position"],
            day_landings=pilot.get("ATR", 0),
            night_landings=pilot.get("ATN", 0),
            prec_app=pilot.get("precapp", 0),
            nprec_app=pilot.get("nprecapp", 0),
            qual1=pilot.get("QUAL1", False),
            qual2=pilot.get("QUAL2", False),
            qual3=pilot.get("QUAL3", False),
            qual4=pilot.get("QUAL4", False),
            qual5=pilot.get("QUAL5", False),
            qual6=pilot.get("QUAL6", False),
        )

    for k in ["QUAL1", "QUAL2", "QUAL3", "QUAL4", "QUAL5", "QUAL6"]:
        update_tripulante_qualificacao(session, pilot_obj, k.lower(), flight, flight_pilot)

    if pilot_obj.tipo.value == "PILOTO":
        print("\n\nA processar PILOTOS")
        for k in ["ATR", "ATN", "precapp", "nprecapp"]:
            update_tripulante_qualificacao(session, pilot_obj, k, flight, flight_pilot, True)

    pilot_obj.flight_pilots.append(flight_pilot)
    flight.flight_pilots.append(flight_pilot)
    session.commit()

    # elif pilot["position"] in CREW_USER:
    #     for k in ["BSOC", "BSKIT"]:
    #         if k not in pilot:
    #             pilot[k] = False

    #     crew_obj: Crew = session.get(Crew, pilot["nip"])  # type: ignore  # noqa: PGH003
    #     if crew_obj is None:
    #         print(f"Error: Crew {pilot['nip']} not found")
    #         return
    #     qual_c: QualificationCrew = session.get(QualificationCrew, pilot["nip"])  # type: ignore  # noqa: PGH003

    #     if edit:
    #         # Update the existing FlightCrew object
    #         flight_crew: FlightCrew = session.execute(
    #             select(FlightCrew)
    #             .where(FlightCrew.flight_id == flight.fid)
    #             .where(FlightCrew.crew_id == pilot["nip"]),
    #         ).scalar_one_or_none()
    #         if flight_crew is not None:
    #             flight_crew.position = pilot["position"]
    #             flight_crew.bsoc = pilot["BSOC"]
    #         else:
    #             flight_crew = FlightCrew(
    #                 position=pilot["position"],
    #                 bsoc=pilot["BSOC"],
    #                 bskit=pilot["BSKIT"],
    #             )
    #     else:
    #         flight_crew = FlightCrew(
    #             position=pilot["position"],
    #             bsoc=pilot["BSOC"],
    #             bskit=pilot["BSKIT"],
    #         )
    #     qual_c.update(flight_crew, flight.date)

    #     crew_obj.flight_crew.append(flight_crew)
    #     flight.flight_crew.append(flight_crew)
    # else:
    #     print("Not a valid Crew Member")


def update_tripulante_qualificacao(
    session: Session,
    pilot_obj: Tripulante,
    qual_name: str,
    flight: Flight,
    flight_pilot: FlightPilots | None = None,
    convert: bool = False,
) -> None:
    if convert:
        smtmt = (
            select(Qualificacao)
            .where(Qualificacao.nome == qual_name)
            .where(Qualificacao.tipo_aplicavel == pilot_obj.tipo)
        )  # type: ignore  # noqa: PGH003
    else:
        smtmt = (
            select(Qualificacao)
            .where(Qualificacao.nome == getattr(flight_pilot, qual_name))
            .where(Qualificacao.tipo_aplicavel == pilot_obj.tipo)
        )  # type: ignore  # noqa: PGH003
    qual: Qualificacao = session.execute(smtmt).scalar_one_or_none()  # type: ignore  # noqa: PGH003

    if qual is None:
        print(f"Error: Qualification {qual_name} not found for type {pilot_obj.tipo.value}")
        return

    pq = session.scalars(
        select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id == pilot_obj.nip,
            TripulanteQualificacao.qualificacao_id == qual.id,
        )
    ).first()
    if not pq:
        pq = TripulanteQualificacao(
            tripulante_id=pilot_obj.nip,
            qualificacao_id=qual.id,
            data_ultima_validacao=flight.date,
        )
        session.add(pq)
        session.flush()
    else:
        nova_data = flight.date

        if pq.data_ultima_validacao is None or pq.data_ultima_validacao < nova_data:
            pq.data_ultima_validacao = nova_data
            session.add(pq)
            session.flush()

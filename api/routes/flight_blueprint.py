from __future__ import annotations  # noqa: D100, INP001

import os
import time
from datetime import UTC, date, datetime
from threading import Thread
from typing import Any

from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy import exc, extract, func, select
from sqlalchemy.orm import Session, joinedload

from config import engine  # type:ignore  # noqa: PGH003
from functions.gdrive import tarefa_enviar_para_drive  # type:ignore  # noqa: PGH003
from models import year_init  # type:ignore  # noqa: PGH003
from models.enums import TipoTripulante  # type:ignore
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


def parse_time_to_minutes(time_str: str) -> int:
    """Parse time string in format 'HH:MM' to total minutes."""
    if not time_str or time_str == "" or time_str == "__:__":
        return 0
    try:
        parts = time_str.split(":")
        if len(parts) != 2:
            return 0
        hours = int(parts[0])
        minutes = int(parts[1])
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        return 0


converter: dict = {"ATR": "day_landings", "ATN": "night_landings", "precapp": "prec_app", "nprecapp": "nprec_app"}


def safe_int_or_none(value) -> int | None:
    """Convert value to integer or return None if not a valid integer."""
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def coerce_qualification_id(value: Any) -> str | None:
    """Convert various qualification representations into a stringified ID."""
    if value in (None, "", False):
        return None
    if isinstance(value, dict):
        value = value.get("id")
    if isinstance(value, (list, tuple)):
        value = value[0] if value else None
    if value in (None, "", False):
        return None
    if isinstance(value, str):
        value = value.strip()
    try:
        return str(int(value))
    except (TypeError, ValueError):
        return None


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
            # Pre-load all qualifications into a cache for efficient lookups
            # This avoids N+1 queries when converting qualification IDs to names
            all_qualifications = session.execute(select(Qualificacao)).scalars().all()
            qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}
            print(f"Loaded {len(qual_cache)} qualifications into cache")

            stmt = (
                select(Flight)
                .order_by(Flight.date.desc())
                .options(
                    joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
                )
            )
            flights_obj = session.execute(stmt).unique().scalars()
            # end_time = time.perf_counter()
            # print(f"Tempo DB: {end_time - start_time:.4f} segundos")

            # Iterates through flights and creates JSON response
            flights = [row.to_json(qual_cache) for row in flights_obj]  # Flight main data to JSON

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
            flight: Flight = session.execute(select(Flight).where(Flight.fid == flight_id)).scalar_one()

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

            # Get all existing FlightPilots before making changes
            existing_flight_pilots = list(flight.flight_pilots)

            # First, revert qualifications for all existing pilots
            for existing_pilot in existing_flight_pilots:
                update_qualifications_on_delete(flight_id, session, existing_pilot)

            # Then process the new pilot data which will update/create qualifications
            for pilot in f["flight_pilots"]:
                add_crew_and_pilots(session, flight, pilot, edit=True)

            session.commit()
            session.refresh(flight)
            nome_arquivo_voo = flight.get_file_name()
            nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")
        print(DEV)
        if not DEV:
            print("NOT DEV")
            Thread(target=tarefa_enviar_para_drive, args=(f, nome_arquivo_voo, nome_pdf)).start()
        return jsonify({"message": "Flight changed"}), 204

    if request.method == "DELETE":
        verify_jwt_in_request()

        with Session(engine, autoflush=False) as session:
            flight_to_delete: Flight | None = session.execute(
                select(Flight).where(Flight.fid == flight_id)
            ).scalar_one_or_none()
            if flight_to_delete is None:
                return jsonify({"msg": "Flight not found"}), 404
            # for k, v in flight_to_delete.to_json().items():
            #     print(f"{k}: {v}")
            # Iterate over each pilot in the flight
            for pilot in flight_to_delete.flight_pilots:
                update_qualifications_on_delete(flight_id, session, pilot)

            # Commit the updates
            session.commit()
            # Now delete the flight
            session.delete(flight_to_delete)
            session.commit()
            return jsonify({"deleted_id": f"Flight {flight_id}"}), 200

    return jsonify({"message": "Bad Manual Request"}), 403


@flights.route("/statistics", methods=["GET"], strict_slashes=False)
def get_flight_statistics() -> tuple[Response, int]:
    """Get flight statistics for dashboard.

    Query Parameters:
        year (int, optional): Year to filter flights. Defaults to current year.

    Returns:
        - total_flights: Total number of flights
        - hours_by_type: Total hours grouped by flight_type (pie chart data)
        - hours_by_action: Total hours grouped by flight_action (pie chart data)
        - total_passengers: Sum of all passengers
        - total_doe: Sum of all DOE
        - total_cargo: Sum of all cargo
    """
    # Get year from query parameter, default to current year
    year = request.args.get("year", type=int)
    if year is None:
        year = datetime.now(UTC).year

    with Session(engine) as session:
        # Get total flights count for the selected year
        total_flights = (
            session.execute(select(func.count(Flight.fid)).where(extract("year", Flight.date) == year)).scalar() or 0
        )

        # Get all flights for the selected year
        all_flights = session.execute(select(Flight).where(extract("year", Flight.date) == year)).scalars().all()

        # Calculate hours by flight_type
        hours_by_type: dict[str, int] = {}  # type -> total minutes
        hours_by_action: dict[str, int] = {}  # action -> total minutes
        total_passengers = 0
        total_doe = 0
        total_cargo = 0
        total_minutes = 0  # Total flight minutes for the year

        for flight in all_flights:
            # Parse total_time to minutes
            minutes = parse_time_to_minutes(flight.total_time)
            total_minutes += minutes  # Add to total

            # Group by flight_type
            flight_type = flight.flight_type  # or "Unknown"
            hours_by_type[flight_type] = hours_by_type.get(flight_type, 0) + minutes

            # Group by flight_action
            flight_action = flight.flight_action  # or "Unknown"
            hours_by_action[flight_action] = hours_by_action.get(flight_action, 0) + minutes

            # Sum passengers, doe, cargo
            total_passengers += flight.passengers or 0
            total_doe += flight.doe or 0
            total_cargo += flight.cargo or 0

        # Convert minutes to hours for display and format for pie charts
        def format_for_pie_chart(data_dict: dict[str, int]) -> list[dict[str, Any]]:
            """Convert minutes dict to pie chart format with hours."""
            result = []
            for key, minutes in data_dict.items():
                hours = minutes / 60
                result.append(
                    {
                        "name": key,
                        "value": hours,  # hours for display
                        "minutes": minutes,  # keep minutes for calculations
                    }
                )
            return result

        # Calculate total hours from total minutes
        total_hours = total_minutes / 60

        statistics = {
            "total_flights": total_flights,
            "total_hours": total_hours,  # Total flight hours for the year
            "hours_by_type": format_for_pie_chart(hours_by_type),
            "hours_by_action": format_for_pie_chart(hours_by_action),
            "total_passengers": total_passengers,
            "total_doe": total_doe,
            "total_cargo": total_cargo,
            "year": year,
        }
        print(statistics)
        return jsonify(statistics), 200


@flights.route("/available-years", methods=["GET"], strict_slashes=False)
def get_available_years() -> tuple[Response, int]:
    """Get list of years that have flights in the database."""
    with Session(engine) as session:
        # Get distinct years from flights
        years = (
            session.execute(
                select(extract("year", Flight.date).label("year"))
                .distinct()
                .order_by(extract("year", Flight.date).desc())
            )
            .scalars()
            .all()
        )
        # Convert to list of integers
        years_list = [int(year) for year in years if year is not None]
        return jsonify({"years": years_list}), 200


@flights.route("/reprocess-all-qualifications", methods=["POST"], strict_slashes=False)
def reprocess_all_qualifications() -> tuple[Response, int]:
    """Reprocess all flights and update crew qualifications.

    This endpoint scans all flights in chronological order and updates
    the qualification dates for all crew members based on their flight records.
    """
    verify_jwt_in_request()

    with Session(engine, autoflush=False) as session:
        print("\nLoading flights and pre-caching data...")

        # Pre-load all flights ordered by date with pilots
        stmt = (
            select(Flight)
            .order_by(Flight.date.asc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        all_flights = session.execute(stmt).unique().scalars().all()

        total_flights = len(all_flights)
        processed = 0
        errors = []

        # Pre-load all Qualificacao records into cache
        # Key: (nome, tipo_aplicavel) -> Qualificacao and id -> Qualificacao
        print("Pre-loading qualifications cache...")
        all_qualifications = session.execute(select(Qualificacao)).scalars().all()
        qual_cache_by_name: dict[tuple[str, TipoTripulante], Qualificacao] = {}
        qual_cache_by_id: dict[int, Qualificacao] = {}
        for qual in all_qualifications:
            qual_cache_by_name[(qual.nome, qual.tipo_aplicavel)] = qual
            qual_cache_by_id[qual.id] = qual

        print(f"Loaded {len(qual_cache_by_name)} qualifications into cache")

        # Pre-load all TripulanteQualificacao records for all pilots we'll process
        # Key: (tripulante_id, qualificacao_id) -> TripulanteQualificacao
        print("Pre-loading pilot qualifications cache...")
        all_pilot_ids = set()
        for flight in all_flights:
            for flight_pilot in flight.flight_pilots:
                if flight_pilot.tripulante:
                    all_pilot_ids.add(flight_pilot.pilot_id)

        pq_cache: dict[tuple[int, int], TripulanteQualificacao] = {}
        if all_pilot_ids:
            all_pq_records = (
                session.execute(
                    select(TripulanteQualificacao).where(TripulanteQualificacao.tripulante_id.in_(all_pilot_ids))
                )
                .scalars()
                .all()
            )
            for pq in all_pq_records:
                pq_cache[(pq.tripulante_id, pq.qualificacao_id)] = pq

        print(f"Loaded {len(pq_cache)} pilot qualifications into cache for {len(all_pilot_ids)} pilots")
        print(f"\nStarting reprocess of {total_flights} flights...")

        start_time = time.perf_counter()
        updates_made = 0

        for flight in all_flights:
            try:
                # Process each pilot in the flight
                for flight_pilot in flight.flight_pilots:
                    # Use already-loaded tripulante from joinedload instead of session.get()
                    pilot_obj: Tripulante | None = flight_pilot.tripulante

                    if pilot_obj is None:
                        errors.append(f"Pilot {flight_pilot.pilot_id} not found in flight {flight.fid}")
                        continue

                    # Update qualification fields using cached lookups
                    for k in ["QUAL1", "QUAL2", "QUAL3", "QUAL4", "QUAL5", "QUAL6"]:
                        qual_value = getattr(flight_pilot, k.lower())
                        if qual_value not in (None, "", False):
                            updates_made += update_tripulante_qualificacao_optimized(
                                session,
                                pilot_obj,
                                qual_value,
                                flight,
                                qual_cache_by_name,
                                qual_cache_by_id,
                                pq_cache,
                            )

                    # For pilots, update landing counts
                    if pilot_obj.tipo.value == "PILOTO":
                        landing_quals = [
                            ("ATR", flight_pilot.day_landings),
                            ("ATN", flight_pilot.night_landings),
                            ("precapp", flight_pilot.prec_app),
                            ("nprecapp", flight_pilot.nprec_app),
                        ]
                        for qual_name, landing_count in landing_quals:
                            if landing_count is not None and landing_count > 0:
                                updates_made += update_tripulante_qualificacao_optimized(
                                    session,
                                    pilot_obj,
                                    qual_name,
                                    flight,
                                    qual_cache_by_name,
                                    qual_cache_by_id,
                                    pq_cache,
                                    True,
                                )

                processed += 1
                if processed % 50 == 0:
                    print(f"\rProcessed: {processed}/{total_flights}", end="", flush=True)
                    # Commit every 50 flights to balance performance and transaction size
                    session.commit()

            except Exception as e:
                errors.append(f"Error processing flight {flight.fid}: {str(e)}")
                session.rollback()
                continue

        # Final commit
        session.commit()
        print(f"\nReprocess completed: {processed}/{total_flights} flights processed successfully")
        print(f"Total qualification updates made: {updates_made}")
        end_time = time.perf_counter()

        print(f"Tempo medio: {(end_time - start_time) / total_flights:.4f} segundos")
        print(f"Tempo total: {end_time - start_time:.4f} segundos")

        if errors:
            print(f"Errors encountered: {len(errors)}")
            for error in errors[:10]:  # Show first 10 errors
                print(f"  - {error}")

        return jsonify(
            {
                "message": f"Successfully reprocessed {processed}/{total_flights} flights",
                "total_flights": total_flights,
                "processed": processed,
                "errors": len(errors),
                "error_details": errors[:10] if errors else [],
            }
        ), 200


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
        qual_conditions = [getattr(FlightPilots, field) == str(pq.qualificacao.id) for field in qual_fields]
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
        session.add(pq)


def add_crew_and_pilots(session: Session, flight: Flight, pilot: dict, edit: bool = False) -> FlightPilots:  # noqa: FBT001, FBT002
    """Check type of crew and add it to respective Model Object."""
    # Garanties data integrety while introducing several flights

    print(f"Processing Pilot/Crew NIP: {pilot['nip']}")
    pilot_obj: Tripulante | None = session.get(Tripulante, pilot["nip"])  # type: ignore  # noqa: PGH003

    if pilot_obj is None:
        print(f"Error: Pilot {pilot['nip']} not found")
        raise ValueError(f"Pilot {pilot['nip']} not found")
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
            flight_pilot.day_landings = safe_int_or_none(pilot.get("ATR"))
            flight_pilot.night_landings = safe_int_or_none(pilot.get("ATN"))
            flight_pilot.prec_app = safe_int_or_none(pilot.get("precapp"))
            flight_pilot.nprec_app = safe_int_or_none(pilot.get("nprecapp"))
            flight_pilot.qual1 = pilot.get("QUAL1")  # coerce_qualification_id(pilot.get("QUAL1"))
            flight_pilot.qual2 = pilot.get("QUAL2")  # coerce_qualification_id(pilot.get("QUAL2"))
            flight_pilot.qual3 = pilot.get("QUAL3")  # coerce_qualification_id(pilot.get("QUAL3"))
            flight_pilot.qual4 = pilot.get("QUAL4")  # coerce_qualification_id(pilot.get("QUAL4"))
            flight_pilot.qual5 = pilot.get("QUAL5")  # coerce_qualification_id(pilot.get("QUAL5"))
            flight_pilot.qual6 = pilot.get("QUAL6")  # coerce_qualification_id(pilot.get("QUAL6"))
        else:
            raise ValueError(f"FlightPilots record not found for pilot {pilot['nip']} in flight {flight.fid}")
    else:
        flight_pilot = FlightPilots(
            position=pilot["position"],
            day_landings=safe_int_or_none(pilot.get("ATR")),
            night_landings=safe_int_or_none(pilot.get("ATN")),
            prec_app=safe_int_or_none(pilot.get("precapp")),
            nprec_app=safe_int_or_none(pilot.get("nprecapp")),
            qual1=pilot.get("QUAL1"),  # coerce_qualification_id(pilot.get("QUAL1")),
            qual2=pilot.get("QUAL2"),  # coerce_qualification_id(pilot.get("QUAL2")),
            qual3=pilot.get("QUAL3"),  # coerce_qualification_id(pilot.get("QUAL3")),
            qual4=pilot.get("QUAL4"),  # coerce_qualification_id(pilot.get("QUAL4")),
            qual5=pilot.get("QUAL5"),  # coerce_qualification_id(pilot.get("QUAL5")),
            qual6=pilot.get("QUAL6"),  # coerce_qualification_id(pilot.get("QUAL6")),
        )

    for k in ["QUAL1", "QUAL2", "QUAL3", "QUAL4", "QUAL5", "QUAL6"]:
        update_tripulante_qualificacao(session, pilot_obj, k.lower(), flight, flight_pilot)

    if pilot_obj.tipo.value == "PILOTO":
        # print("\n\nA processar PILOTOS")
        # Only update qualifications if value is greater than zero
        if flight_pilot.day_landings is not None and flight_pilot.day_landings > 0:
            update_tripulante_qualificacao(session, pilot_obj, "ATR", flight, flight_pilot, True)
        if flight_pilot.night_landings is not None and flight_pilot.night_landings > 0:
            update_tripulante_qualificacao(session, pilot_obj, "ATN", flight, flight_pilot, True)
        if flight_pilot.prec_app is not None and flight_pilot.prec_app > 0:
            update_tripulante_qualificacao(session, pilot_obj, "precapp", flight, flight_pilot, True)
        if flight_pilot.nprec_app is not None and flight_pilot.nprec_app > 0:
            update_tripulante_qualificacao(session, pilot_obj, "nprecapp", flight, flight_pilot, True)

    pilot_obj.flight_pilots.append(flight_pilot)
    flight.flight_pilots.append(flight_pilot)
    session.commit()
    return flight_pilot


def update_tripulante_qualificacao_optimized(
    session: Session,
    pilot_obj: Tripulante,
    qual_identifier: Any,
    flight: Flight,
    qual_cache_by_name: dict[tuple[str, TipoTripulante], Qualificacao],
    qual_cache_by_id: dict[int, Qualificacao],
    pq_cache: dict[tuple[int, int], TripulanteQualificacao],
    convert: bool = False,
) -> int:
    """Optimized version using pre-loaded caches to avoid database queries.

    Returns:
        1 if an update was made, 0 otherwise
    """
    if qual_identifier in (None, "", False):
        return 0

    qual: Qualificacao | None

    if convert:
        qual = None
        try:
            qual_identifier_id = int(qual_identifier)
        except (TypeError, ValueError):
            qual = qual_cache_by_name.get((str(qual_identifier), pilot_obj.tipo))
        else:
            qual = qual_cache_by_id.get(qual_identifier_id) or qual_cache_by_name.get(
                (str(qual_identifier), pilot_obj.tipo)
            )
    else:
        coerced_id = coerce_qualification_id(qual_identifier)
        if coerced_id is None:
            return 0
        qual = qual_cache_by_id.get(int(coerced_id))

    if qual is None:
        return 0

    # Look up or create TripulanteQualificacao
    cache_key = (pilot_obj.nip, qual.id)
    pq = pq_cache.get(cache_key)

    if not pq:
        # Create new record
        pq = TripulanteQualificacao(
            tripulante_id=pilot_obj.nip,
            qualificacao_id=qual.id,
            data_ultima_validacao=flight.date,
        )
        session.add(pq)
        # Add to cache for potential future use in this batch
        pq_cache[cache_key] = pq
        return 1
    else:
        # Update existing record if needed
        nova_data = flight.date
        if pq.data_ultima_validacao is None or pq.data_ultima_validacao < nova_data:
            pq.data_ultima_validacao = nova_data
            session.add(pq)
            return 1

    return 0


def update_tripulante_qualificacao(
    session: Session,
    pilot_obj: Tripulante,
    qual_name: str,
    flight: Flight,
    flight_pilot: FlightPilots | None = None,
    convert: bool = False,
) -> None:
    qual_id: str | int | None = None

    if not convert:
        qual_id = getattr(flight_pilot, qual_name)
    else:
        # When convert is True, look for the qualification in the pilot's existing qualifications
        # First, check if pilot already has this qualification
        for trip_qual in pilot_obj.qualificacoes:
            if trip_qual.qualificacao.nome == qual_name:
                qual_id = trip_qual.qualificacao_id
                break

        # If not found in pilot's qualifications, look it up in the database by name and tipo
        if qual_id is None:
            qual = session.scalars(
                select(Qualificacao).where(
                    Qualificacao.nome == qual_name,
                    Qualificacao.tipo_aplicavel == pilot_obj.tipo,
                )
            ).first()
            if qual:
                qual_id = qual.id

    if qual_id == "" or qual_id is None:
        print("Empty field, skipping qualification update")
        # print(f"Error: Qualification {qual_name} not found for type {pilot_obj.tipo.value}")
        return

    pq = session.scalars(
        select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id == pilot_obj.nip,
            TripulanteQualificacao.qualificacao_id == qual_id,
        )
    ).first()
    if not pq:
        pq = TripulanteQualificacao(
            tripulante_id=pilot_obj.nip,
            qualificacao_id=qual_id,
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

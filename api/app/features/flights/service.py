"""Flights service containing business logic for flight operations."""

import os
import time
from datetime import UTC, date, datetime
from threading import Thread
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import exc, func, or_, select
from sqlalchemy.orm import Session, joinedload

from config import engine  # type: ignore
from functions.gdrive import tarefa_enviar_para_drive  # type: ignore
from models import year_init  # type: ignore
from models.enums import TipoTripulante  # type: ignore
from app.features.qualifications.models import Qualificacao  # type: ignore
from models.tripulantes import Tripulante, TripulanteQualificacao  # type: ignore

from app.features.flights.models import Flight, FlightPilots  # type: ignore
from app.utils.time_utils import parse_time_to_minutes

# Load environment variables
load_dotenv(dotenv_path="./.env")
DEV = bool(os.environ.get("DEV", "0"))


def safe_int_or_none(value: Any) -> int | None:
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


class FlightService:
    """Service class for flight business logic."""

    def get_all_flights(self, session: Session) -> list[dict]:
        """Get all flights from database with qualification cache.

        Args:
            session: Database session

        Returns:
            List of flight dictionaries
        """
        # Pre-load all qualifications into a cache for efficient lookups
        all_qualifications = session.execute(select(Qualificacao)).scalars().all()
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}

        stmt = (
            select(Flight)
            .order_by(Flight.date.desc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        flights_obj = session.execute(stmt).unique().scalars()

        flights = [row.to_json(qual_cache) for row in flights_obj]
        return flights

    def create_flight(self, flight_data: dict, session: Session) -> dict[str, Any]:
        """Create a new flight.

        Args:
            flight_data: Flight data dictionary
            session: Database session

        Returns:
            dict with "message" key containing flight ID on success, or error message
        """
        flight = Flight(
            airtask=flight_data["airtask"],
            date=datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date(),
            origin=flight_data.get("origin", ""),
            destination=flight_data.get("destination", ""),
            departure_time=flight_data.get("ATD", ""),
            arrival_time=flight_data.get("ATA", ""),
            flight_type=flight_data.get("flightType", ""),
            flight_action=flight_data.get("flightAction", ""),
            tailnumber=flight_data.get("tailNumber", ""),
            total_time=flight_data.get("ATE", ""),
            atr=flight_data.get("totalLandings", 0),
            passengers=flight_data.get("passengers", 0),
            doe=flight_data.get("doe", 0),
            cargo=flight_data.get("cargo", 0),
            number_of_crew=flight_data.get("numberOfCrew", 0),
            orm=flight_data.get("orm", 0),
            fuel=flight_data.get("fuel", 0),
            activation_first=flight_data.get("activationFirst", "__:__"),
            activation_last=flight_data.get("activationLast", "__:__"),
            ready_ac=flight_data.get("readyAC", "__:__"),
            med_arrival=flight_data.get("medArrival", "__:__"),
        )

        session.add(flight)

        if "flight_pilots" not in flight_data:
            return {"message": "At least one pilot is required"}

        for pilot in flight_data["flight_pilots"]:
            result = self._add_crew_and_pilots(session, flight, pilot, edit=False)
            if result is None:
                continue

        try:
            session.flush()
        except exc.IntegrityError as e:
            session.rollback()
            return {"message": str(e.orig)}

        session.commit()
        nome_arquivo_voo = flight.get_file_name()
        nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        # Launch background task to send to Google Drive
        if not DEV:
            Thread(target=tarefa_enviar_para_drive, args=(flight_data, nome_arquivo_voo, nome_pdf)).start()

        return {"message": flight.fid}

    def update_flight(self, flight_id: int, flight_data: dict, session: Session) -> dict[str, Any]:
        """Update an existing flight.

        Args:
            flight_id: Flight ID
            flight_data: Flight data dictionary
            session: Database session

        Returns:
            dict with "message" key on success, or error message
        """
        flight: Flight = session.execute(select(Flight).where(Flight.fid == flight_id)).scalar_one()

        flight.airtask = flight_data.get("airtask", "")
        flight.date = datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
        flight.origin = flight_data.get("origin", "")
        flight.destination = flight_data.get("destination", "")
        flight.departure_time = flight_data.get("ATD", "")
        flight.arrival_time = flight_data.get("ATA", "")
        flight.flight_type = flight_data.get("flightType", "")
        flight.flight_action = flight_data.get("flightAction", "")
        flight.tailnumber = flight_data.get("tailNumber", "")
        flight.total_time = flight_data.get("ATE", "")
        flight.atr = flight_data.get("totalLandings", 0)
        flight.passengers = flight_data.get("passengers", 0)
        flight.doe = flight_data.get("doe", 0)
        flight.cargo = flight_data.get("cargo", 0)
        flight.number_of_crew = flight_data.get("numberOfCrew", 0)
        flight.orm = flight_data.get("orm", 0)
        flight.fuel = flight_data.get("fuel", 0)
        flight.activation_first = flight_data.get("activationFirst", "__:__")
        flight.activation_last = flight_data.get("activationLast", "__:__")
        flight.ready_ac = flight_data.get("readyAC", "__:__")
        flight.med_arrival = flight_data.get("medArrival", "__:__")

        # Get all existing FlightPilots before making changes
        existing_flight_pilots = list(flight.flight_pilots)

        # First, revert qualifications for all existing pilots
        for existing_pilot in existing_flight_pilots:
            self._update_qualifications_on_delete(flight_id, session, existing_pilot)

        # Then process the new pilot data which will update/create qualifications
        for pilot in flight_data["flight_pilots"]:
            result = self._add_crew_and_pilots(session, flight, pilot, edit=True)
            if result is None:
                continue

        session.commit()
        session.refresh(flight)
        nome_arquivo_voo = flight.get_file_name()
        nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        if not DEV:
            Thread(target=tarefa_enviar_para_drive, args=(flight_data, nome_arquivo_voo, nome_pdf)).start()

        return {"message": "Flight changed"}

    def delete_flight(self, flight_id: int, session: Session) -> dict[str, Any]:
        """Delete a flight and update qualifications.

        Args:
            flight_id: Flight ID
            session: Database session

        Returns:
            dict with "deleted_id" on success, or error message
        """
        flight_to_delete: Flight | None = session.execute(
            select(Flight).where(Flight.fid == flight_id)
        ).scalar_one_or_none()

        if flight_to_delete is None:
            return {"msg": "Flight not found"}

        # Iterate over each pilot in the flight
        for pilot in flight_to_delete.flight_pilots:
            self._update_qualifications_on_delete(flight_id, session, pilot)

        # Commit the updates
        session.commit()
        # Now delete the flight
        session.delete(flight_to_delete)
        session.commit()
        return {"deleted_id": f"Flight {flight_id}"}

    def reprocess_all_qualifications(self, session: Session) -> dict[str, Any]:
        """Reprocess all flights and update crew qualifications.

        This method scans all flights in chronological order and updates
        the qualification dates for all crew members based on their flight records.

        Args:
            session: Database session

        Returns:
            dict with processing results
        """
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
        print("Pre-loading qualifications cache...")
        all_qualifications = session.execute(select(Qualificacao)).scalars().all()
        qual_cache_by_name: dict[tuple[str, TipoTripulante], Qualificacao] = {}
        qual_cache_by_id: dict[int, Qualificacao] = {}
        for qual in all_qualifications:
            qual_cache_by_name[(qual.nome, qual.tipo_aplicavel)] = qual
            qual_cache_by_id[qual.id] = qual

        print(f"Loaded {len(qual_cache_by_name)} qualifications into cache")

        # Pre-load all TripulanteQualificacao records
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
                    pilot_obj: Tripulante | None = flight_pilot.tripulante

                    if pilot_obj is None:
                        errors.append(f"Pilot {flight_pilot.pilot_id} not found in flight {flight.fid}")
                        continue

                    # Update qualification fields using cached lookups
                    for k in ["QUAL1", "QUAL2", "QUAL3", "QUAL4", "QUAL5", "QUAL6"]:
                        qual_value = getattr(flight_pilot, k.lower())
                        if qual_value not in (None, "", False):
                            updates_made += self._update_tripulante_qualificacao_optimized(
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
                                updates_made += self._update_tripulante_qualificacao_optimized(
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
            for error in errors[:10]:
                print(f"  - {error}")

        return {
            "message": f"Successfully reprocessed {processed}/{total_flights} flights",
            "total_flights": total_flights,
            "processed": processed,
            "errors": len(errors),
            "error_details": errors[:10] if errors else [],
        }

    def _update_qualifications_on_delete(
        self,
        flight_id: int,
        session: Session,
        tripulante: FlightPilots,
    ) -> None:
        """Update qualifications when a flight is deleted."""
        tripulante_quals = (
            session.execute(
                select(TripulanteQualificacao).where(TripulanteQualificacao.tripulante_id == tripulante.pilot_id)
            )
            .scalars()
            .all()
        )

        for pq in tripulante_quals:
            qual_fields = ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]
            qual_conditions = [getattr(FlightPilots, field) == str(pq.qualificacao.id) for field in qual_fields]
            last_date = session.execute(
                select(func.max(Flight.date))
                .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
                .where(FlightPilots.pilot_id == tripulante.pilot_id)
                .where(Flight.fid != flight_id)
                .where(or_(*qual_conditions))
            ).scalar_one_or_none()

            pq.data_ultima_validacao = last_date if last_date else date(year_init, 1, 1)
            session.add(pq)

    def _add_crew_and_pilots(
        self,
        session: Session,
        flight: Flight,
        pilot: dict,
        edit: bool = False,
        auto_commit: bool = False,
    ) -> FlightPilots | None:
        """Add crew/pilot to flight and update qualifications."""
        pilot_obj: Tripulante | None = session.get(Tripulante, pilot["nip"])  # type: ignore

        if pilot_obj is None:
            pilot_name = pilot.get("name", "Unknown")
            print(
                f"⚠️  Warning: Pilot NIP {pilot['nip']} ({pilot_name}) not found in database "
                f"(Flight: {flight.airtask} on {flight.date}). Skipping pilot."
            )
            return None

        if edit:
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
                flight_pilot.qual1 = pilot.get("QUAL1")
                flight_pilot.qual2 = pilot.get("QUAL2")
                flight_pilot.qual3 = pilot.get("QUAL3")
                flight_pilot.qual4 = pilot.get("QUAL4")
                flight_pilot.qual5 = pilot.get("QUAL5")
                flight_pilot.qual6 = pilot.get("QUAL6")
            else:
                raise ValueError(f"FlightPilots record not found for pilot {pilot['nip']} in flight {flight.fid}")
        else:
            i: int = 0
            qual_list = session.scalars(select(Qualificacao).where(Qualificacao.tipo_aplicavel == pilot_obj.tipo)).all()

            excluded_names = {"ATR", "ATN", "precapp", "nprecapp"}
            qual_list = [q for q in qual_list if q.nome not in excluded_names]

            for l in qual_list:
                qual_value = pilot.get(l.nome)
                if qual_value is not None and qual_value is not False:
                    qual = session.scalars(
                        select(Qualificacao).where(
                            Qualificacao.nome == l.nome,
                            Qualificacao.tipo_aplicavel == pilot_obj.tipo,
                        )
                    ).first()
                    if qual:
                        pilot[f"QUAL{i + 1}"] = str(qual.id)
                        i += 1

            if flight.fid is None:
                session.flush()

            flight_pilot = FlightPilots(
                flight_id=flight.fid,
                pilot_id=pilot["nip"],
                position=pilot["position"],
                day_landings=safe_int_or_none(pilot.get("ATR")),
                night_landings=safe_int_or_none(pilot.get("ATN")),
                prec_app=safe_int_or_none(pilot.get("precapp")),
                nprec_app=safe_int_or_none(pilot.get("nprecapp")),
                qual1=pilot.get("QUAL1"),
                qual2=pilot.get("QUAL2"),
                qual3=pilot.get("QUAL3"),
                qual4=pilot.get("QUAL4"),
                qual5=pilot.get("QUAL5"),
                qual6=pilot.get("QUAL6"),
            )

        for k in ["QUAL1", "QUAL2", "QUAL3", "QUAL4", "QUAL5", "QUAL6"]:
            self._update_tripulante_qualificacao(session, pilot_obj, k.lower(), flight, flight_pilot)

        if pilot_obj.tipo.value == "PILOTO":
            if flight_pilot.day_landings is not None and flight_pilot.day_landings > 0:
                self._update_tripulante_qualificacao(session, pilot_obj, "ATR", flight, flight_pilot, True)
            if flight_pilot.night_landings is not None and flight_pilot.night_landings > 0:
                self._update_tripulante_qualificacao(session, pilot_obj, "ATN", flight, flight_pilot, True)
            if flight_pilot.prec_app is not None and flight_pilot.prec_app > 0:
                self._update_tripulante_qualificacao(session, pilot_obj, "precapp", flight, flight_pilot, True)
            if flight_pilot.nprec_app is not None and flight_pilot.nprec_app > 0:
                self._update_tripulante_qualificacao(session, pilot_obj, "nprecapp", flight, flight_pilot, True)

        pilot_obj.flight_pilots.append(flight_pilot)
        flight.flight_pilots.append(flight_pilot)
        if auto_commit:
            session.commit()
        else:
            session.flush()
        return flight_pilot

    def _update_tripulante_qualificacao_optimized(
        self,
        session: Session,
        pilot_obj: Tripulante,
        qual_identifier: Any,
        flight: Flight,
        qual_cache_by_name: dict[tuple[str, TipoTripulante], Qualificacao],
        qual_cache_by_id: dict[int, Qualificacao],
        pq_cache: dict[tuple[int, int], TripulanteQualificacao],
        convert: bool = False,
    ) -> int:
        """Optimized version using pre-loaded caches."""
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

        cache_key = (pilot_obj.nip, qual.id)
        pq = pq_cache.get(cache_key)

        if not pq:
            pq = TripulanteQualificacao(
                tripulante_id=pilot_obj.nip,
                qualificacao_id=qual.id,
                data_ultima_validacao=flight.date,
            )
            session.add(pq)
            pq_cache[cache_key] = pq
            return 1
        else:
            nova_data = flight.date
            if pq.data_ultima_validacao is None or pq.data_ultima_validacao < nova_data:
                pq.data_ultima_validacao = nova_data
                session.add(pq)
                return 1

        return 0

    def _update_tripulante_qualificacao(
        self,
        session: Session,
        pilot_obj: Tripulante,
        qual_name: str,
        flight: Flight,
        flight_pilot: FlightPilots | None = None,
        convert: bool = False,
    ) -> None:
        """Update tripulante qualification based on flight data."""
        qual_id: str | int | None = None

        if not convert:
            qual_id = getattr(flight_pilot, qual_name.lower())

            if isinstance(qual_id, str) and qual_id.strip() and not qual_id.isdigit():
                qual_name_from_value = qual_id.strip()
                qual = session.scalars(
                    select(Qualificacao).where(
                        Qualificacao.nome == qual_name_from_value,
                        Qualificacao.tipo_aplicavel == pilot_obj.tipo,
                    )
                ).first()
                if qual:
                    qual_id = qual.id
                else:
                    print(
                        f"⚠️  Warning: Qualification '{qual_name_from_value}' not found for type {pilot_obj.tipo.value} "
                        f"(Pilot: {pilot_obj.nip}, Flight: {flight.airtask} on {flight.date}). Skipping qualification update."
                    )
                    return
        else:
            for trip_qual in pilot_obj.qualificacoes:
                if trip_qual.qualificacao.id == qual_name:
                    qual_id = trip_qual.qualificacao_id
                    break

            if qual_id is None:
                qual = session.scalars(
                    select(Qualificacao).where(
                        Qualificacao.nome == qual_name,
                        Qualificacao.tipo_aplicavel == pilot_obj.tipo,
                    )
                ).first()
                if qual:
                    qual_id = qual.id
                else:
                    print(
                        f"⚠️  Warning: Qualification '{qual_name}' not found for type {pilot_obj.tipo.value} "
                        f"(Pilot: {pilot_obj.nip}, Flight: {flight.airtask} on {flight.date}). Skipping qualification update."
                    )
                    return

        if qual_id == "" or qual_id is None:
            return

        try:
            qual_id = int(qual_id)
        except (ValueError, TypeError):
            print(
                f"⚠️  Warning: Invalid qualification ID '{qual_id}' for qualification '{qual_name}' "
                f"(Pilot: {pilot_obj.nip}, Flight: {flight.airtask} on {flight.date}). Skipping qualification update."
            )
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


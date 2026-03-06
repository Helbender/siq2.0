"""Flights service containing business logic for flight operations."""

import os
import time
from datetime import UTC, date, datetime
from threading import Thread
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import exc, select, text
from sqlalchemy.orm import Session

from app.features.flights.models import Flight, FlightPilots  # type: ignore
from app.features.flights.repository import FlightRepository
from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante, TripulanteQualificacao  # type: ignore
from app.shared.enums import TipoTripulante  # type: ignore
from app.utils.gdrive import tarefa_enviar_para_drive  # type: ignore

# Load environment variables
load_dotenv(dotenv_path="./.env")
FLASK_ENV = os.environ.get("FLASK_ENV", "development").lower()


def safe_int_or_none(value: Any) -> int | None:
    """Convert value to integer or return None if not a valid integer."""
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _normalize_time(value: Any) -> str | None:
    """Normalize time to String(5) for VIR/VN/CON: None if empty, else stripped up to 5 chars."""
    if value is None or value == "":
        return None
    s = str(value).strip()[:5]
    return s if s else None


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

    def __init__(self):
        """Initialize flight service with repository."""
        self.repository = FlightRepository()

    def get_all_flights(self, session: Session) -> list[dict]:
        """Get all flights from database with qualification cache.

        Args:
            session: Database session

        Returns:
            List of flight dictionaries
        """
        # Pre-load all qualifications into a cache for efficient lookups
        all_qualifications = self.repository.find_all_qualifications(session)
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}

        # Disable statement timeout for this connection (heavy full-table join)
        try:
            session.execute(text("SET statement_timeout = '0'"))
        except Exception:
            pass

        flights_obj = self.repository.find_all_with_pilots(session)

        flights = [row.to_json(qual_cache) for row in flights_obj]
        return flights

    def get_flights_by_crew_search(
        self,
        session: Session,
        search: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict]:
        """Get crew-flight rows where a crew member matches the search term (NIP or name), optionally within a date range.

        Returns one row per matching (crew member, flight) with full FlightPilots data plus flight id, airtask, date.
        Only the crew member(s) that match the search are included, not all crew on each flight.

        Args:
            session: Database session
            search: Crew search term (numeric NIP or partial name)
            date_from: Optional start date string (YYYY-MM-DD)
            date_to: Optional end date string (YYYY-MM-DD)

        Returns:
            List of dicts: each = FlightPilots.to_json() + flightId, airtask, date

        Raises:
            ValueError: If search is empty or dates are invalid
        """
        search = (search or "").strip()
        if not search:
            raise ValueError("Search term is required")

        parsed_date_from: date | None = None
        parsed_date_to: date | None = None
        if date_from:
            try:
                parsed_date_from = datetime.strptime(date_from.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date_from format; use YYYY-MM-DD") from None
        if date_to:
            try:
                parsed_date_to = datetime.strptime(date_to.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date_to format; use YYYY-MM-DD") from None
        if parsed_date_from is not None and parsed_date_to is not None and parsed_date_from > parsed_date_to:
            raise ValueError("date_from must be before or equal to date_to")

        flights_obj = self.repository.find_flights_by_crew_search(
            session, search, date_from=parsed_date_from, date_to=parsed_date_to
        )
        all_qualifications = self.repository.find_all_qualifications(session)
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}

        is_nip_search = search.isdigit()
        nip_match = int(search) if is_nip_search else None
        search_lower = search.lower() if not is_nip_search else ""

        result: list[dict] = []
        for flight in flights_obj:
            for fp in flight.flight_pilots:
                if is_nip_search:
                    if fp.tripulante.nip != nip_match:
                        continue
                else:
                    if (fp.tripulante.name or "").lower().find(search_lower) < 0:
                        continue
                row = fp.to_json(qual_cache)
                row["flightId"] = flight.fid
                row["airtask"] = flight.airtask
                row["date"] = flight.date.strftime("%Y-%m-%d")
                result.append(row)
        return result

    def create_flight(self, flight_data: dict, session: Session) -> dict[str, Any]:
        """Create a new flight.

        Args:
            flight_data: Flight data dictionary
            session: Database session

        Returns:
            dict with "message" key containing flight ID on success, or error message
        """
        flight_date = datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
        departure_time = flight_data.get("ATD", "")
        tailnumber = flight_data.get("tailNumber", "")

        existing = self.repository.find_by_natural_key(
            session,
            airtask=flight_data["airtask"],
            flight_date=flight_date,
            departure_time=departure_time,
            tailnumber=tailnumber,
        )
        if existing is not None:
            return {
                "message": "A flight with this airtask, date, departure time and aircraft already exists"
            }

        flight = Flight(
            airtask=flight_data["airtask"],
            date=flight_date,
            origin=flight_data.get("origin", ""),
            destination=flight_data.get("destination", ""),
            departure_time=departure_time,
            arrival_time=flight_data.get("ATA", ""),
            flight_type=flight_data.get("flightType", ""),
            flight_action=flight_data.get("flightAction", ""),
            tailnumber=tailnumber,
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

        self.repository.create(session, flight)

        if "flight_pilots" not in flight_data:
            return {"message": "At least one pilot is required"}

        print("\nCrewmembers:")
        for pilot in flight_data["flight_pilots"]:
            print(pilot)
            result = self._add_crew_and_pilots(session, flight, pilot, edit=False)
            if result is None:
                continue

        try:
            self.repository.flush(session)
        except exc.IntegrityError as e:
            self.repository.rollback(session)
            return {"message": str(e.orig)}

        self.repository.commit(session)
        nome_arquivo_voo = flight.get_file_name()
        nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        # Launch background task: .1m with qualifications by ID, PDF with names
        if FLASK_ENV == "production":
            flight_with_pilots = self.repository.find_by_id_with_pilots(session, flight.fid)
            if flight_with_pilots:
                all_qualifications = self.repository.find_all_qualifications(session)
                qual_cache = {q.id: q.nome for q in all_qualifications}
                dados_1m = flight_with_pilots.to_json(None)
                dados_pdf = flight_with_pilots.to_json(qual_cache)
                Thread(target=tarefa_enviar_para_drive, args=(dados_1m, dados_pdf, nome_arquivo_voo, nome_pdf)).start()

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
        flight = self.repository.find_by_id(session, flight_id)
        if flight is None:
            return {"message": "Flight not found"}

        new_date = datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
        new_airtask = flight_data.get("airtask", "")
        new_atd = flight_data.get("ATD", "")
        new_tail = flight_data.get("tailNumber", "")

        other = self.repository.find_by_natural_key(
            session,
            airtask=new_airtask,
            flight_date=new_date,
            departure_time=new_atd,
            tailnumber=new_tail,
            exclude_fid=flight_id,
        )
        if other is not None:
            return {
                "message": "Another flight already exists with this airtask, date, departure time and aircraft"
            }

        flight.airtask = new_airtask
        flight.date = new_date
        flight.origin = flight_data.get("origin", "")
        flight.destination = flight_data.get("destination", "")
        flight.departure_time = new_atd
        flight.arrival_time = flight_data.get("ATA", "")
        flight.flight_type = flight_data.get("flightType", "")
        flight.flight_action = flight_data.get("flightAction", "")
        flight.tailnumber = new_tail
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

        # Lista de NIPs no payload = tripulantes que devem ficar no voo
        payload_nips = {p["nip"] for p in flight_data["flight_pilots"]}
        existing_flight_pilots = list(flight.flight_pilots)

        # Para cada tripulante que já estava no voo:
        # - Recalcular qualificações como se o voo não contasse (revert)
        # - Se não vier no payload, apagar o registo FlightPilots e manter as qualificações revertidas
        for existing_pilot in existing_flight_pilots:
            self._update_qualifications_on_delete(flight_id, session, existing_pilot)
            if existing_pilot.pilot_id not in payload_nips:
                flight.flight_pilots.remove(existing_pilot)
                session.delete(existing_pilot)

        # Atualizar/criar registos e qualificações para os tripulantes do payload
        for pilot in flight_data["flight_pilots"]:
            result = self._add_crew_and_pilots(session, flight, pilot, edit=True)
            if result is None:
                continue

        self.repository.commit(session)
        session.refresh(flight)
        nome_arquivo_voo = flight.get_file_name()
        nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")

        if FLASK_ENV == "production":
            flight_with_pilots = self.repository.find_by_id_with_pilots(session, flight.fid)
            if flight_with_pilots:
                all_qualifications = self.repository.find_all_qualifications(session)
                qual_cache = {q.id: q.nome for q in all_qualifications}
                dados_1m = flight_with_pilots.to_json(None)
                dados_pdf = flight_with_pilots.to_json(qual_cache)
                Thread(target=tarefa_enviar_para_drive, args=(dados_1m, dados_pdf, nome_arquivo_voo, nome_pdf)).start()

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
        self.repository.commit(session)
        # Now delete the flight
        self.repository.delete(session, flight_to_delete)
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
        all_flights = self.repository.find_all_ordered_by_date_asc(session)

        total_flights = len(all_flights)
        processed = 0
        errors = []

        # Pre-load all Qualificacao records into cache
        print("Pre-loading qualifications cache...")
        all_qualifications = self.repository.find_all_qualifications(session)
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
            all_pq_records = self.repository.find_tripulante_qualificacoes_by_pilot_ids(session, list(all_pilot_ids))
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
                    self.repository.commit(session)

            except Exception as e:
                errors.append(f"Error processing flight {flight.fid}: {str(e)}")
                self.repository.rollback(session)
                continue

        # Final commit
        self.repository.commit(session)
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

    def _qualification_ids_validated_by_flight_pilot(
        self, session: Session, flight_pilot: FlightPilots
    ) -> set[int]:
        """Return qualification IDs that this FlightPilots row actually validated (qual1–qual6 + landing quals)."""
        ids: set[int] = set()
        for attr in ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]:
            val = getattr(flight_pilot, attr, None)
            qid = coerce_qualification_id(val)
            if qid is not None:
                try:
                    ids.add(int(qid))
                except (ValueError, TypeError):
                    pass
        pilot_obj = getattr(flight_pilot, "tripulante", None)
        if pilot_obj is not None and getattr(pilot_obj, "tipo", None) is not None:
            tipo = pilot_obj.tipo
            landing_specs: list[tuple[str, int | None]] = [
                ("ATR", flight_pilot.day_landings),
                ("ATN", flight_pilot.night_landings),
                ("precapp", flight_pilot.prec_app),
                ("nprecapp", flight_pilot.nprec_app),
            ]
            for qual_name, count in landing_specs:
                if count is not None and count > 0:
                    qual = self.repository.find_qualification_by_nome_and_tipo(session, qual_name, tipo)
                    if qual is not None:
                        ids.add(qual.id)
        return ids

    def _update_qualifications_on_delete(
        self,
        flight_id: int,
        session: Session,
        tripulante: FlightPilots,
    ) -> None:
        """Update qualifications when a flight is deleted. Only touches qualifications that this flight actually validated."""
        qual_ids_on_this_flight = self._qualification_ids_validated_by_flight_pilot(session, tripulante)
        tripulante_quals = self.repository.find_tripulante_qualificacoes_by_pilot_id(session, tripulante.pilot_id)

        for pq in tripulante_quals:
            if pq.qualificacao_id not in qual_ids_on_this_flight:
                continue
            last_date = self.repository.find_max_flight_date_for_qualification(
                session, tripulante.pilot_id, pq.qualificacao_id, flight_id
            )
            pq.data_ultima_validacao = last_date
            self.repository.update_tripulante_qualificacao(session, pq)

    def _add_crew_and_pilots(
        self,
        session: Session,
        flight: Flight,
        pilot: dict,
        edit: bool = False,
        auto_commit: bool = False,
    ) -> FlightPilots | None:
        """Add crew/pilot to flight and update qualifications."""
        pilot_obj = self.repository.find_tripulante_by_nip(session, pilot["nip"])

        if pilot_obj is None:
            pilot_name = pilot.get("name", "Unknown")
            print(
                f"⚠️  Warning: Pilot NIP {pilot['nip']} ({pilot_name}) not found in database "
                f"(Flight: {flight.airtask} on {flight.date}). Skipping pilot."
            )
            return None

        if edit:
            flight_pilot = session.execute(
                select(FlightPilots)
                .where(FlightPilots.flight_id == flight.fid)
                .where(FlightPilots.pilot_id == pilot["nip"]),
            ).scalar_one_or_none()
            if flight_pilot is not None:
                flight_pilot.position = pilot.get("position") or ""
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
                flight_pilot.vir = _normalize_time(pilot.get("VIR"))
                flight_pilot.vn = _normalize_time(pilot.get("VN"))
                flight_pilot.con = _normalize_time(pilot.get("CON"))
            else:
                # Piloto novo na lista deste voo (adicionado na edição): criar registo
                flight_pilot = FlightPilots(
                    flight_id=flight.fid,
                    pilot_id=pilot["nip"],
                    position=pilot.get("position") or "",
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
                    vir=_normalize_time(pilot.get("VIR")),
                    vn=_normalize_time(pilot.get("VN")),
                    con=_normalize_time(pilot.get("CON")),
                )
        else:
            i: int = 0
            qual_list = self.repository.find_qualifications_by_tipo(session, pilot_obj.tipo)

            excluded_names = {"ATR", "ATN", "precapp", "nprecapp"}
            qual_list = [q for q in qual_list if q.nome not in excluded_names]

            for qual_item in qual_list:
                qual_value = pilot.get(qual_item.nome)
                if qual_value is not None and qual_value is not False:
                    qual = session.scalars(
                        select(Qualificacao).where(
                            Qualificacao.nome == qual_item.nome,
                            Qualificacao.tipo_aplicavel == pilot_obj.tipo,
                        )
                    ).first()
                    if qual:
                        pilot[f"QUAL{i + 1}"] = str(qual.id)
                        i += 1

            if flight.fid is None:
                self.repository.flush(session)

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
                vir=_normalize_time(pilot.get("VIR")),
                vn=_normalize_time(pilot.get("VN")),
                con=_normalize_time(pilot.get("CON")),
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
            self.repository.commit(session)
        else:
            self.repository.flush(session)
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
            if coerced_id is not None:
                qual = qual_cache_by_id.get(int(coerced_id))
            else:
                qual = None
            if qual is None:
                qual = qual_cache_by_name.get((str(qual_identifier).strip(), pilot_obj.tipo))

        if qual is None:
            return 0

        cache_key = (pilot_obj.nip, qual.id)
        pq = pq_cache.get(cache_key)

        if not pq:
            from app.features.users.models import TripulanteQualificacao  # type: ignore

            pq = TripulanteQualificacao(
                tripulante_id=pilot_obj.nip,
                qualificacao_id=qual.id,
                data_ultima_validacao=flight.date,
            )
            self.repository.create_tripulante_qualificacao(session, pq)
            pq_cache[cache_key] = pq
            return 1
        else:
            nova_data = flight.date
            if pq.data_ultima_validacao is None or pq.data_ultima_validacao < nova_data:
                pq.data_ultima_validacao = nova_data
                self.repository.update_tripulante_qualificacao(session, pq)
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
                qual = self.repository.find_qualification_by_nome_and_tipo(
                    session, qual_name_from_value, pilot_obj.tipo
                )
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
                qual = self.repository.find_qualification_by_nome_and_tipo(session, qual_name, pilot_obj.tipo)
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

        pq = self.repository.find_tripulante_qualificacao(session, pilot_obj.nip, qual_id)
        if not pq:
            from app.features.users.models import TripulanteQualificacao  # type: ignore

            pq = TripulanteQualificacao(
                tripulante_id=pilot_obj.nip,
                qualificacao_id=qual_id,
                data_ultima_validacao=flight.date,
            )
            self.repository.create_tripulante_qualificacao(session, pq)
        else:
            nova_data = flight.date

            if pq.data_ultima_validacao is None or pq.data_ultima_validacao < nova_data:
                pq.data_ultima_validacao = nova_data
                self.repository.update_tripulante_qualificacao(session, pq)

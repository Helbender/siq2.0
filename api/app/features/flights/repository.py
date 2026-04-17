"""Flights repository - database access only."""

from datetime import date
from typing import Any

from sqlalchemy import delete, func, or_, select, union_all
from sqlalchemy.orm import Session, joinedload

from app.features.flights.models import Flight, FlightAnomaly, FlightPilots  # type: ignore
from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante, TripulanteQualificacao  # type: ignore
from app.shared.models import year_init  # type: ignore


def _crew_search_condition(search: str):
    """Build crew match condition: NIP if search is numeric, else name ilike."""
    if search.strip().isdigit():
        return Tripulante.nip == int(search.strip())
    return Tripulante.name.ilike(f"%{search.strip()}%")


class FlightRepository:
    """Repository for flight database operations."""

    @staticmethod
    def find_all_with_pilots(session: Session) -> list[Flight]:
        """Get all flights with pilots loaded."""
        stmt = (
            select(Flight)
            .order_by(Flight.date.desc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
                joinedload(Flight.flight_anomalies),
            )
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_all_with_pilots_paginated(session: Session, page: int, per_page: int) -> tuple[list[Flight], int]:
        """Get paginated flights with pilots loaded."""
        total = session.execute(select(func.count(Flight.fid))).scalar_one()
        stmt = (
            select(Flight)
            .order_by(Flight.date.desc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
                joinedload(Flight.flight_anomalies),
            )
            .limit(per_page)
            .offset((page - 1) * per_page)
        )
        return list(session.execute(stmt).unique().scalars().all()), total

    @staticmethod
    def find_flights_by_crew_search(
        session: Session,
        search: str,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[Flight]:
        """Get flights where a crew member matches the search term (NIP or name), optionally within a date range.

        Args:
            session: Database session
            search: Crew search term (numeric NIP or partial name)
            date_from: Optional start date (inclusive)
            date_to: Optional end date (inclusive)

        Returns:
            List of Flight instances with pilots loaded, ordered by date descending
        """
        stmt = (
            select(Flight)
            .join(Flight.flight_pilots)
            .join(FlightPilots.tripulante)
            .where(_crew_search_condition(search))
            .distinct()
            .order_by(Flight.date.desc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        if date_from is not None:
            stmt = stmt.where(Flight.date >= date_from)
        if date_to is not None:
            stmt = stmt.where(Flight.date <= date_to)
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_all_ordered_by_date_asc(session: Session) -> list[Flight]:
        """Get all flights ordered by date ascending with pilots.

        Args:
            session: Database session

        Returns:
            List of Flight instances ordered by date ascending
        """
        stmt = (
            select(Flight)
            .order_by(Flight.date.asc())
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
            )
        )
        return list(session.execute(stmt).unique().scalars().all())

    @staticmethod
    def find_by_id(session: Session, flight_id: int) -> Flight | None:
        """Find a flight by ID.

        Args:
            session: Database session
            flight_id: Flight ID

        Returns:
            Flight instance or None if not found
        """
        stmt = select(Flight).where(Flight.fid == flight_id)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_by_natural_key(
        session: Session,
        airtask: str,
        flight_date: date,
        departure_time: str,
        tailnumber: int,
        exclude_fid: int | None = None,
    ) -> Flight | None:
        """Find a flight by natural key (airtask, date, departure_time, tailnumber).

        Used for duplicate checks: create must find none; update must find none
        when excluding the current flight id.

        Args:
            session: Database session
            airtask: Flight airtask
            flight_date: Flight date
            departure_time: Departure time (ATD)
            tailnumber: Aircraft tail number
            exclude_fid: If set, ignore the flight with this fid (for update case)

        Returns:
            Flight instance or None if not found (or only the excluded one exists)
        """
        stmt = (
            select(Flight)
            .where(
                Flight.airtask == airtask,
                Flight.date == flight_date,
                Flight.departure_time == departure_time,
                Flight.tailnumber == tailnumber,
            )
            .order_by(Flight.fid)
            .limit(1)
        )
        if exclude_fid is not None:
            stmt = stmt.where(Flight.fid != exclude_fid)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_by_id_with_pilots(session: Session, flight_id: int) -> Flight | None:
        """Find a flight by ID with pilots loaded.

        Args:
            session: Database session
            flight_id: Flight ID

        Returns:
            Flight instance or None if not found
        """
        stmt = (
            select(Flight)
            .where(Flight.fid == flight_id)
            .options(
                joinedload(Flight.flight_pilots).joinedload(FlightPilots.tripulante),
                joinedload(Flight.flight_anomalies),
            )
        )
        return session.execute(stmt).unique().scalar_one_or_none()

    @staticmethod
    def create(session: Session, flight: Flight) -> Flight:
        """Create a new flight.

        Args:
            session: Database session
            flight: Flight instance to create

        Returns:
            Created Flight instance
        """
        session.add(flight)
        return flight

    @staticmethod
    def flush(session: Session) -> None:
        """Flush pending changes to database.

        Args:
            session: Database session
        """
        session.flush()

    @staticmethod
    def commit(session: Session) -> None:
        """Commit changes to database.

        Args:
            session: Database session
        """
        session.commit()

    @staticmethod
    def rollback(session: Session) -> None:
        """Rollback changes.

        Args:
            session: Database session
        """
        session.rollback()

    @staticmethod
    def update(session: Session, flight: Flight) -> None:
        """Update a flight.

        Args:
            session: Database session
            flight: Flight instance to update
        """
        session.commit()

    @staticmethod
    def delete(session: Session, flight: Flight) -> None:
        """Delete a flight.

        Args:
            session: Database session
            flight: Flight instance to delete
        """
        session.delete(flight)
        session.commit()

    @staticmethod
    def find_flight_pilot(session: Session, flight_id: int, pilot_id: int) -> FlightPilots | None:
        """Find a FlightPilots record.

        Args:
            session: Database session
            flight_id: Flight ID
            pilot_id: Pilot NIP

        Returns:
            FlightPilots instance or None if not found
        """
        stmt = select(FlightPilots).where(FlightPilots.flight_id == flight_id).where(FlightPilots.pilot_id == pilot_id)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def find_anomaly_descriptions_by_tailnumber(session: Session, tailnumber: int) -> list[str]:
        """Get distinct anomaly descriptions ever reported for a given aircraft (tail number).

        Args:
            session: Database session
            tailnumber: Aircraft tail number

        Returns:
            List of distinct description strings, ordered by description
        """
        stmt = (
            select(FlightAnomaly.description)
            .join(Flight, Flight.fid == FlightAnomaly.flight_id)
            .where(Flight.tailnumber == tailnumber)
            .distinct()
            .order_by(FlightAnomaly.description)
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def delete_flight_anomalies_for_flight(session: Session, flight_id: int) -> None:
        """Remove all anomaly rows for a flight (used before replacing with new list).

        Args:
            session: Database session
            flight_id: Flight ID
        """
        session.execute(delete(FlightAnomaly).where(FlightAnomaly.flight_id == flight_id))

    @staticmethod
    def find_tripulante_by_nip(session: Session, nip: int) -> Tripulante | None:
        """Find a tripulante by NIP.

        Args:
            session: Database session
            nip: Tripulante NIP

        Returns:
            Tripulante instance or None if not found
        """
        return session.get(Tripulante, nip)  # type: ignore

    @staticmethod
    def find_qualifications_by_tipo(session: Session, tipo: Any) -> list[Qualificacao]:
        """Find qualifications by tipo aplicavel.

        Args:
            session: Database session
            tipo: TipoTripulante enum

        Returns:
            List of Qualificacao instances
        """
        stmt = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tipo)
        return list(session.scalars(stmt).all())

    @staticmethod
    def find_all_qualifications(session: Session) -> list[Qualificacao]:
        """Get all qualifications.

        Args:
            session: Database session

        Returns:
            List of all Qualificacao instances
        """
        return list(session.execute(select(Qualificacao)).scalars().all())

    @staticmethod
    def find_qualification_by_nome_and_tipo(session: Session, nome: str, tipo: Any) -> Qualificacao | None:
        """Find a qualification by name and tipo.

        Args:
            session: Database session
            nome: Qualification name
            tipo: TipoTripulante enum

        Returns:
            Qualificacao instance or None if not found
        """
        stmt = select(Qualificacao).where(Qualificacao.nome == nome, Qualificacao.tipo_aplicavel == tipo)
        return session.scalars(stmt).first()

    @staticmethod
    def find_qualification_by_payload_key_and_tipo(
        session: Session, payload_key: str, tipo: Any
    ) -> Qualificacao | None:
        """Find a qualification by payload_key and tipo (for landing quals: ATR, ATN, precapp, nprecapp).

        Args:
            session: Database session
            payload_key: Stable payload key (e.g. ATR, precapp)
            tipo: TipoTripulante enum

        Returns:
            Qualificacao instance or None if not found
        """
        stmt = select(Qualificacao).where(Qualificacao.payload_key == payload_key, Qualificacao.tipo_aplicavel == tipo)
        return session.scalars(stmt).first()

    @staticmethod
    def find_tripulante_qualificacoes_by_pilot_id(session: Session, pilot_id: int) -> list[TripulanteQualificacao]:
        """Find all tripulante qualifications for a pilot.

        Args:
            session: Database session
            pilot_id: Pilot NIP

        Returns:
            List of TripulanteQualificacao instances
        """
        stmt = select(TripulanteQualificacao).where(TripulanteQualificacao.tripulante_id == pilot_id)
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_tripulante_qualificacoes_by_pilot_ids(
        session: Session, pilot_ids: list[int]
    ) -> list[TripulanteQualificacao]:
        """Find all tripulante qualifications for multiple pilots.

        Args:
            session: Database session
            pilot_ids: List of pilot NIPs

        Returns:
            List of TripulanteQualificacao instances
        """
        stmt = select(TripulanteQualificacao).where(TripulanteQualificacao.tripulante_id.in_(pilot_ids))
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def find_tripulante_qualificacao(
        session: Session, tripulante_id: int, qualificacao_id: int
    ) -> TripulanteQualificacao | None:
        """Find a specific tripulante qualification.

        Args:
            session: Database session
            tripulante_id: Tripulante NIP
            qualificacao_id: Qualification ID

        Returns:
            TripulanteQualificacao instance or None if not found
        """
        stmt = select(TripulanteQualificacao).where(
            TripulanteQualificacao.tripulante_id == tripulante_id,
            TripulanteQualificacao.qualificacao_id == qualificacao_id,
        )
        return session.scalars(stmt).first()

    @staticmethod
    def create_tripulante_qualificacao(
        session: Session, tripulante_qualificacao: TripulanteQualificacao
    ) -> TripulanteQualificacao:
        """Create a new tripulante qualification.

        Args:
            session: Database session
            tripulante_qualificacao: TripulanteQualificacao instance

        Returns:
            Created TripulanteQualificacao instance
        """
        session.add(tripulante_qualificacao)
        session.flush()
        return tripulante_qualificacao

    @staticmethod
    def update_tripulante_qualificacao(session: Session, tripulante_qualificacao: TripulanteQualificacao) -> None:
        """Update a tripulante qualification.

        Args:
            session: Database session
            tripulante_qualificacao: TripulanteQualificacao instance to update
        """
        session.add(tripulante_qualificacao)
        session.flush()

    @staticmethod
    def find_max_flight_date_for_qualification(
        session: Session, pilot_id: int, qualificacao_id: int, exclude_flight_id: int
    ) -> date | None:
        """Find the maximum flight date for a specific qualification.

        Args:
            session: Database session
            pilot_id: Pilot NIP
            qualificacao_id: Qualification ID
            exclude_flight_id: Flight ID to exclude from search

        Returns:
            Maximum date or None if not found
        """
        # First, load the qualification to understand how it is tracked
        qual = session.get(Qualificacao, qualificacao_id)  # type: ignore[arg-type]

        # For landing-based qualifications (ATR, ATN, precapp, nprecapp),
        # the presence of the qualification on a flight is encoded via
        # the corresponding landing counters on FlightPilots rather than
        # qual1-qual6. We need to look at those counters instead.
        landing_qual_map: dict[str, Any] = {
            "ATR": FlightPilots.day_landings,
            "ATN": FlightPilots.night_landings,
            "precapp": FlightPilots.prec_app,
            "nprecapp": FlightPilots.nprec_app,
        }

        if qual is not None and qual.payload_key is not None and qual.payload_key in landing_qual_map:
            landing_field = landing_qual_map[qual.payload_key]
            stmt = (
                select(func.max(Flight.date))
                .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
                .where(FlightPilots.pilot_id == pilot_id)
                .where(Flight.fid != exclude_flight_id)
                .where(landing_field.isnot(None))
                .where(landing_field > 0)
            )
        else:
            # For all other qualifications, they are tracked by ID in qual1-qual6.
            qual_fields = ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]
            qual_conditions = [getattr(FlightPilots, field) == str(qualificacao_id) for field in qual_fields]
            stmt = (
                select(func.max(Flight.date))
                .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
                .where(FlightPilots.pilot_id == pilot_id)
                .where(Flight.fid != exclude_flight_id)
                .where(or_(*qual_conditions))
            )

        result = session.execute(stmt).scalar_one_or_none()
        return result if result else date(year_init, 1, 1)

    @staticmethod
    def find_max_flight_dates_batch(
        session: Session,
        pilot_id: int,
        qual_ids: set[int],
        exclude_flight_id: int,
    ) -> dict[int, date]:
        """Return {qualificacao_id: max_date} for all qual_ids in one or two round-trips.

        Replaces N individual calls to find_max_flight_date_for_qualification.
        Landing-type quals (ATR/ATN/precapp/nprecapp) are resolved per landing field;
        standard quals (qual1-qual6) are resolved with a single UNION ALL query.
        """
        if not qual_ids:
            return {}

        quals = list(session.execute(select(Qualificacao).where(Qualificacao.id.in_(qual_ids))).scalars())

        landing_field_map: dict[str, Any] = {
            "ATR": FlightPilots.day_landings,
            "ATN": FlightPilots.night_landings,
            "precapp": FlightPilots.prec_app,
            "nprecapp": FlightPilots.nprec_app,
        }

        landing_quals = [q for q in quals if q.payload_key in landing_field_map]
        standard_quals = [q for q in quals if q.payload_key not in landing_field_map]

        result: dict[int, date] = {}
        default_date = date(year_init, 1, 1)

        # Landing quals: one query per distinct landing field present in the set (max 4)
        for payload_key, field in landing_field_map.items():
            matched = [q for q in landing_quals if q.payload_key == payload_key]
            if not matched:
                continue
            stmt = (
                select(func.max(Flight.date))
                .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
                .where(FlightPilots.pilot_id == pilot_id, Flight.fid != exclude_flight_id)
                .where(field.isnot(None), field > 0)
            )
            max_date = session.execute(stmt).scalar_one_or_none()
            for q in matched:
                result[q.id] = max_date or default_date

        # Standard quals: UNION ALL across qual1-qual6, one round-trip total
        if standard_quals:
            standard_ids_str = {str(q.id) for q in standard_quals}
            col_names = ["qual1", "qual2", "qual3", "qual4", "qual5", "qual6"]
            parts = [
                select(
                    getattr(FlightPilots, col).label("qid"),
                    func.max(Flight.date).label("max_date"),
                )
                .join(FlightPilots, Flight.fid == FlightPilots.flight_id)
                .where(FlightPilots.pilot_id == pilot_id, Flight.fid != exclude_flight_id)
                .where(getattr(FlightPilots, col).in_(standard_ids_str))
                .group_by(getattr(FlightPilots, col))
                for col in col_names
            ]
            rows = session.execute(union_all(*parts)).all()
            max_by_qid: dict[str, date | None] = {}
            for qid_str, max_date in rows:
                if qid_str is None:
                    continue
                existing = max_by_qid.get(qid_str)
                if existing is None or (max_date and max_date > existing):
                    max_by_qid[qid_str] = max_date
            for q in standard_quals:
                result[q.id] = max_by_qid.get(str(q.id)) or default_date

        return result

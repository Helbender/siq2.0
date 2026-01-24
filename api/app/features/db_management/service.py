"""Database management service containing business logic."""

import os
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from threading import Thread
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import engine
from app.features.db_management.repository import DatabaseManagementRepository
from app.features.flights.models import Flight  # type: ignore
from app.features.flights.service import FlightService
from app.utils.gdrive import ID_PASTA_VOO, upload_with_service_account  # type: ignore

# Load environment variables
load_dotenv(dotenv_path="./.env")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")
IS_PRODUCTION = FLASK_ENV.lower() == "production"

# Configurable concurrency limits for year deletion
# These can be overridden via environment variables
MAX_MONTH_WORKERS = int(os.environ.get("DELETE_YEAR_MAX_MONTH_WORKERS", "4"))  # Max parallel months (1-12)
MAX_QUALIFICATION_WORKERS = int(
    os.environ.get("DELETE_YEAR_MAX_QUAL_WORKERS", "8")
)  # Max qualification workers per month


class DatabaseManagementService:
    """Service class for database management business logic."""

    def __init__(self):
        """Initialize database management service with repository."""
        self.repository = DatabaseManagementRepository()
        self.flight_service = FlightService()

    def get_flights_by_year(self, session: Session) -> list[dict[str, Any]]:
        """Get count of flights grouped by year.

        Args:
            session: Database session

        Returns:
            List of dictionaries with year and flight_count
        """
        return self.repository.get_flights_by_year(session)

    def _delete_month(self, session: Session, year: int, month: int) -> dict[str, Any]:
        """Delete all flights for a specific year and month.

        Args:
            session: Database session
            year: Year to delete flights for
            month: Month to delete flights for (1-12)

        Returns:
            dict with deletion results for this month
        """
        month_start = time.time()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [DELETE MONTH] Starting deletion of {year}-{month:02d}...")

        # Load flights for this month
        flights = self.repository.get_flights_for_year_month(session, year, month)

        if not flights:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] [DELETE MONTH] No flights found for {year}-{month:02d}")
            return {
                "month": month,
                "deleted_count": 0,
                "success": True,
                "message": f"No flights found for {year}-{month:02d}",
            }

        flight_ids = [flight.fid for flight in flights]
        deleted_count = len(flights)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [DELETE MONTH] Found {deleted_count} flights to delete for {year}-{month:02d}")

        # SKIPPED: Qualification updates for year deletion (old files)
        # When deleting a year, we skip qualification updates since these are old files.
        # Single flight deletion still updates qualifications (see FlightService.delete_flight)
        # 
        # # Collect all pilot-qualification pairs that need updating for this month
        # phase_start = time.time()
        # pilot_qual_updates = []
        # for flight in flights:
        #     for pilot in flight.flight_pilots:
        #         tripulante_quals = self.flight_service.repository.find_tripulante_qualificacoes_by_pilot_id(
        #             session, pilot.pilot_id
        #         )
        #         for pq in tripulante_quals:
        #             pilot_qual_updates.append((pilot.pilot_id, pq.qualificacao_id, flight.fid))
        #
        # phase_elapsed = time.time() - phase_start
        # timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # if pilot_qual_updates:
        #     print(
        #         f"[{timestamp}] [DELETE MONTH] Collected {len(pilot_qual_updates)} qualification update operations for {year}-{month:02d} (took {phase_elapsed:.2f}s)"
        #     )
        #
        # # Update qualifications in parallel
        # if pilot_qual_updates:
        #     phase_start = time.time()
        #
        #     def _update_qualification_worker(args):
        #         """Worker function to update a single qualification in its own session."""
        #         pilot_id, qual_id, flight_id = args
        #         session_factory = sessionmaker(bind=engine)
        #         worker_session = session_factory()
        #         try:
        #             flight_repo = FlightService().repository
        #             pq = flight_repo.find_tripulante_qualificacao(worker_session, pilot_id, qual_id)
        #             if pq is None:
        #                 return False
        #             last_date = flight_repo.find_max_flight_date_for_qualification(
        #                 worker_session, pilot_id, qual_id, flight_id
        #             )
        #             pq.data_ultima_validacao = last_date
        #             flight_repo.update_tripulante_qualificacao(worker_session, pq)
        #             worker_session.commit()
        #             return True
        #         except Exception:
        #             worker_session.rollback()
        #             return False
        #         finally:
        #             worker_session.close()
        #
        #     max_workers = MAX_QUALIFICATION_WORKERS
        #     successful_updates = 0
        #     failed_updates = 0
        #
        #     with ThreadPoolExecutor(max_workers=max_workers) as executor:
        #         futures = {
        #             executor.submit(_update_qualification_worker, update): update for update in pilot_qual_updates
        #         }
        #
        #         for future in as_completed(futures):
        #             try:
        #                 if future.result():
        #                     successful_updates += 1
        #                 else:
        #                     failed_updates += 1
        #             except Exception as e:
        #                 failed_updates += 1
        #                 # Log only if it's a significant error (not just a missing record)
        #                 if "not found" not in str(e).lower():
        #                     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        #                     print(f"[{timestamp}] Warning: Exception in qualification update worker: {e}")
        #
        #     phase_elapsed = time.time() - phase_start
        #     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        #     print(
        #         f"[{timestamp}] [DELETE MONTH] Updated qualifications for {year}-{month:02d}: {successful_updates} successful, {failed_updates} failed (took {phase_elapsed:.2f}s)"
        #     )

        # Delete flights in batches
        phase_start = time.time()
        stmt = select(Flight).where(Flight.fid.in_(flight_ids))
        flights_to_delete = list(session.execute(stmt).scalars().all())

        flight_batch_size = 50
        total_deleted = 0
        batch_number = 0

        for i in range(0, len(flights_to_delete), flight_batch_size):
            batch = flights_to_delete[i : i + flight_batch_size]
            batch_number += 1
            batch_deleted = 0

            for flight in batch:
                try:
                    session.delete(flight)
                    batch_deleted += 1
                except Exception as e:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{timestamp}] Warning: Could not delete flight {flight.fid}: {e}")

            try:
                session.commit()
                total_deleted += batch_deleted
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(
                    f"[{timestamp}] [DELETE MONTH] {year}-{month:02d} batch {batch_number}: deleted {batch_deleted} flights (total: {total_deleted}/{len(flights_to_delete)})"
                )
            except Exception as e:
                session.rollback()
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"[{timestamp}] [DELETE MONTH] Error committing batch {batch_number} for {year}-{month:02d}: {e}")
                raise

        month_elapsed = time.time() - month_start
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(
            f"[{timestamp}] [DELETE MONTH] Completed {year}-{month:02d}: deleted {total_deleted} flights (took {month_elapsed:.2f}s)"
        )

        return {
            "month": month,
            "deleted_count": total_deleted,
            "success": True,
            "message": f"Successfully deleted {total_deleted} flights for {year}-{month:02d}",
        }

    def delete_year(self, session: Session, year: int) -> dict[str, Any]:
        """Delete all flights for a specific year, processing months in parallel (1-12).

        This will process each month independently in parallel, so if it fails mid-process,
        at least some months will have been deleted. Each month uses its own database session.
        
        NOTE: Qualification updates are SKIPPED for year deletion (old files).
        Single flight deletion still updates qualifications (see FlightService.delete_flight).
        
        Concurrency is controlled by:
        - MAX_MONTH_WORKERS: Max parallel months (default: 4, max: 12)

        Args:
            session: Database session (not used directly, each month gets its own)
            year: Year to delete flights for

        Returns:
            dict with deletion results per month
        """
        start_time = time.time()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        max_month_workers = min(MAX_MONTH_WORKERS, 12)  # Cap at 12 (one per month)
        print(
            f"[{timestamp}] [DELETE YEAR] Starting deletion of year {year} (processing {max_month_workers} months in parallel, qualification updates SKIPPED for old files)..."
        )

        def _delete_month_worker(month: int) -> dict[str, Any]:
            """Worker function to delete a single month in its own session."""
            session_factory = sessionmaker(bind=engine)
            worker_session = session_factory()
            try:
                return self._delete_month(worker_session, year, month)
            except Exception as e:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"[{timestamp}] [DELETE YEAR] Error deleting month {month} for year {year}: {e}")
                traceback.print_exc()
                return {
                    "month": month,
                    "deleted_count": 0,
                    "success": False,
                    "message": f"Error: {str(e)}",
                }
            finally:
                worker_session.close()

        # Process all 12 months in parallel (limited by MAX_MONTH_WORKERS)
        month_results = []
        total_deleted = 0
        successful_months = 0
        failed_months = 0

        with ThreadPoolExecutor(max_workers=max_month_workers) as executor:
            # Submit all 12 months for parallel processing
            futures = {executor.submit(_delete_month_worker, month): month for month in range(1, 13)}

            # Process results as they complete
            for future in as_completed(futures):
                month = futures[future]
                try:
                    result = future.result()
                    month_results.append(result)
                    if result["success"]:
                        successful_months += 1
                        total_deleted += result["deleted_count"]
                    else:
                        failed_months += 1
                except Exception as e:
                    failed_months += 1
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{timestamp}] [DELETE YEAR] Unexpected error processing month {month}: {e}")
                    month_results.append(
                        {
                            "month": month,
                            "deleted_count": 0,
                            "success": False,
                            "message": f"Unexpected error: {str(e)}",
                        }
                    )

        # Sort month results by month number for consistent output
        month_results.sort(key=lambda x: x["month"])

        total_elapsed = time.time() - start_time
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(
            f"[{timestamp}] [DELETE YEAR] Completed year {year}: {total_deleted} flights deleted across {successful_months} successful months, {failed_months} failed months (total time: {total_elapsed:.2f}s)"
        )

        return {
            "message": f"Deleted {total_deleted} flights for year {year} ({successful_months} months successful, {failed_months} months failed)",
            "year": year,
            "deleted_count": total_deleted,
            "successful_months": successful_months,
            "failed_months": failed_months,
            "month_results": month_results,
        }

    def rebackup_flights(self, session: Session) -> dict[str, Any]:
        """Rebackup all flights to Google Drive.

        This will process all flights and upload them to Google Drive
        in the background.

        Args:
            session: Database session

        Returns:
            dict with processing results
        """
        flights = self.repository.get_all_flights(session)

        if not flights:
            return {
                "message": "No flights found to backup",
                "total_flights": 0,
                "queued": 0,
            }

        # Pre-load all qualifications into a cache for efficient lookups
        all_qualifications = self.repository.get_all_qualifications(session)
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}

        if not IS_PRODUCTION:
            return {
                "message": f"Found {len(flights)} flights but backup is disabled. Set FLASK_ENV=production to enable backups.",
                "total_flights": len(flights),
                "queued": 0,
                "flask_env": FLASK_ENV,
            }

        # Serialize flights to JSON before session closes (objects become detached in threads)
        flight_data_list = []
        for flight in flights:
            try:
                flight_json = flight.to_json(qual_cache)
                nome_arquivo_voo = flight.get_file_name()
                flight_data_list.append((flight_json, nome_arquivo_voo))
            except Exception as e:
                print(f"Error serializing flight {flight.get_file_name()}: {e}")
                traceback.print_exc()

        max_workers = 16  # Use 16 concurrent threads

        def process_flights_with_pool() -> None:
            """Process flights using a thread pool with limited concurrency."""
            processed_count = 0
            error_count = 0

            print(f"Starting backup of {len(flight_data_list)} flights using {max_workers} worker threads...")

            def backup_single_flight(flight_with_index: tuple[int, tuple[dict, str]]) -> tuple[bool, str]:
                """Backup a single flight. Returns (success, flight_name)."""
                idx, (flight_data, nome_arquivo_voo) = flight_with_index
                try:
                    upload_with_service_account(
                        dados=flight_data,
                        nome_arquivo_drive=nome_arquivo_voo,
                        id_pasta=ID_PASTA_VOO,
                    )
                    return (True, nome_arquivo_voo)
                except Exception as e:
                    print(f"Error backing up flight {nome_arquivo_voo}: {e}")
                    traceback.print_exc()
                    return (False, nome_arquivo_voo)

            # Process flights with thread pool
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all flights to the thread pool
                future_to_flight = {
                    executor.submit(backup_single_flight, (idx, flight_data)): (idx, flight_data)
                    for idx, flight_data in enumerate(flight_data_list, 1)
                }

                # Process completed tasks as they finish
                for future in as_completed(future_to_flight):
                    idx, flight_data = future_to_flight[future]
                    try:
                        success, flight_name = future.result()
                        if success:
                            processed_count += 1
                        else:
                            error_count += 1

                        # Print progress every 10 flights
                        total_processed = processed_count + error_count
                        if total_processed % 10 == 0:
                            print(
                                f"Progress: {total_processed}/{len(flight_data_list)} flights processed "
                                f"({processed_count} successful, {error_count} errors)"
                            )
                    except Exception as e:
                        error_count += 1
                        _, nome_arquivo_voo = flight_data
                        print(f"Unexpected error processing flight {nome_arquivo_voo}: {e}")
                        traceback.print_exc()

            print(
                f"Backup completed: {processed_count} successful, {error_count} errors out of {len(flight_data_list)} total flights"
            )

        # Run backup in background thread
        Thread(target=process_flights_with_pool).start()

        return {
            "message": f"Started backup of {len(flights)} flights to Google Drive. Processing with 4 concurrent threads in background.",
            "total_flights": len(flights),
            "queued": len(flights),
        }

    def rebackup_flights_by_year(self, session: Session, year: int) -> dict[str, Any]:
        """Rebackup all flights for a specific year to Google Drive.

        This will process all flights for the given year and upload them to Google Drive
        in the background.

        Args:
            session: Database session
            year: Year to backup flights for

        Returns:
            dict with processing results
        """
        flights = self.repository.get_flights_for_year(session, year)

        if not flights:
            return {
                "message": f"No flights found for year {year}",
                "year": year,
                "total_flights": 0,
                "queued": 0,
            }

        # Pre-load all qualifications into a cache for efficient lookups
        all_qualifications = self.repository.get_all_qualifications(session)
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}

        if not IS_PRODUCTION:
            return {
                "message": f"Found {len(flights)} flights for year {year} but backup is disabled. Set FLASK_ENV=production to enable backups.",
                "year": year,
                "total_flights": len(flights),
                "queued": 0,
                "flask_env": FLASK_ENV,
            }

        # Serialize flights to JSON before session closes (objects become detached in threads)
        flight_data_list = []
        for flight in flights:
            try:
                flight_json = flight.to_json(qual_cache)
                nome_arquivo_voo = flight.get_file_name()
                flight_data_list.append((flight_json, nome_arquivo_voo))
            except Exception as e:
                print(f"Error serializing flight {flight.get_file_name()}: {e}")
                traceback.print_exc()

        max_workers = 16  # Use 16 concurrent threads

        def process_flights_with_pool() -> None:
            """Process flights using a thread pool with limited concurrency."""
            processed_count = 0
            error_count = 0

            print(
                f"Starting backup of {len(flight_data_list)} flights for year {year} using {max_workers} worker threads..."
            )

            def backup_single_flight(flight_with_index: tuple[int, tuple[dict, str]]) -> tuple[bool, str]:
                """Backup a single flight. Returns (success, flight_name)."""
                idx, (flight_data, nome_arquivo_voo) = flight_with_index
                try:
                    upload_with_service_account(
                        dados=flight_data,
                        nome_arquivo_drive=nome_arquivo_voo,
                        id_pasta=ID_PASTA_VOO,
                    )
                    return (True, nome_arquivo_voo)
                except Exception as e:
                    print(f"Error backing up flight {nome_arquivo_voo}: {e}")
                    traceback.print_exc()
                    return (False, nome_arquivo_voo)

            # Process flights with thread pool
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all flights to the thread pool
                future_to_flight = {
                    executor.submit(backup_single_flight, (idx, flight_data)): (idx, flight_data)
                    for idx, flight_data in enumerate(flight_data_list, 1)
                }

                # Process completed tasks as they finish
                for future in as_completed(future_to_flight):
                    idx, flight_data = future_to_flight[future]
                    try:
                        success, flight_name = future.result()
                        if success:
                            processed_count += 1
                        else:
                            error_count += 1

                        # Print progress every 10 flights
                        total_processed = processed_count + error_count
                        if total_processed % 10 == 0:
                            print(
                                f"Progress: {total_processed}/{len(flight_data_list)} flights processed "
                                f"({processed_count} successful, {error_count} errors)"
                            )
                    except Exception as e:
                        error_count += 1
                        _, nome_arquivo_voo = flight_data
                        print(f"Unexpected error processing flight {nome_arquivo_voo}: {e}")
                        traceback.print_exc()

            print(
                f"Backup completed for year {year}: {processed_count} successful, {error_count} errors out of {len(flight_data_list)} total flights"
            )

        # Run backup in background thread
        Thread(target=process_flights_with_pool).start()

        return {
            "message": f"Started backup of {len(flight_data_list)} flights for year {year} to Google Drive. Processing with {max_workers} concurrent threads in background.",
            "year": year,
            "total_flights": len(flight_data_list),
            "queued": len(flight_data_list),
        }

    def export_qualifications(self, session: Session) -> list[dict[str, Any]]:
        """Export all qualifications to JSON format.

        Args:
            session: Database session

        Returns:
            List of qualification dictionaries
        """
        qualifications = self.repository.get_all_qualifications(session)

        return [
            {
                "id": q.id,
                "nome": q.nome,
                "grupo": q.grupo.value,
                "validade": q.validade,
                "tipo_aplicavel": q.tipo_aplicavel.value,
            }
            for q in qualifications
        ]

    def export_users(self, session: Session) -> list[dict[str, Any]]:
        """Export all users to JSON format.

        Args:
            session: Database session

        Returns:
            List of user dictionaries
        """
        users = self.repository.get_all_users(session)

        return [user.to_backup_json() for user in users]

    def import_qualifications(self, qualifications_data: list[dict[str, Any]], session: Session) -> dict[str, Any]:
        """Import qualifications from JSON backup.

        Args:
            qualifications_data: List of qualification dictionaries from backup
            session: Database session

        Returns:
            dict with import results
        """
        from app.features.qualifications.models import Qualificacao
        from app.features.qualifications.repository import QualificationRepository
        from app.shared.enums import GrupoQualificacoes, TipoTripulante

        qual_repository = QualificationRepository()
        created_count = 0
        updated_count = 0
        error_count = 0
        errors = []

        for qual_data in qualifications_data:
            try:
                # Validate required fields
                if (
                    "nome" not in qual_data
                    or "grupo" not in qual_data
                    or "validade" not in qual_data
                    or "tipo_aplicavel" not in qual_data
                ):
                    error_count += 1
                    errors.append(f"Missing required fields for qualification: {qual_data.get('nome', 'unknown')}")
                    continue

                # Convert enum values
                try:
                    grupo_enum = GrupoQualificacoes(qual_data["grupo"])
                    tipo_enum = TipoTripulante(qual_data["tipo_aplicavel"])
                except ValueError as e:
                    error_count += 1
                    errors.append(f"Invalid enum value for {qual_data.get('nome', 'unknown')}: {str(e)}")
                    continue

                # Check if qualification exists (prioritize ID if provided)
                qualification = None
                backup_id = qual_data.get("id")

                if backup_id is not None:
                    # First, try to find by ID (respect ID from backup)
                    qualification = qual_repository.find_by_id(session, backup_id)

                    if qualification:
                        # Update existing qualification found by ID
                        qualification.nome = qual_data["nome"]
                        qualification.grupo = grupo_enum
                        qualification.validade = qual_data["validade"]
                        qualification.tipo_aplicavel = tipo_enum
                        qual_repository.update(session, qualification)
                        updated_count += 1
                    else:
                        # ID provided but doesn't exist - create new with that ID
                        new_qual = Qualificacao(
                            id=backup_id,
                            nome=qual_data["nome"],
                            grupo=grupo_enum,
                            validade=qual_data["validade"],
                            tipo_aplicavel=tipo_enum,
                        )
                        qual_repository.create(session, new_qual)
                        created_count += 1
                else:
                    # No ID provided - fall back to name-based matching
                    all_quals = qual_repository.find_all(session)
                    qualification = next((q for q in all_quals if q.nome == qual_data["nome"]), None)

                    if qualification:
                        # Update existing qualification found by name
                        qualification.nome = qual_data["nome"]
                        qualification.grupo = grupo_enum
                        qualification.validade = qual_data["validade"]
                        qualification.tipo_aplicavel = tipo_enum
                        qual_repository.update(session, qualification)
                        updated_count += 1
                    else:
                        # Create new qualification without ID (auto-generated)
                        new_qual = Qualificacao(
                            nome=qual_data["nome"],
                            grupo=grupo_enum,
                            validade=qual_data["validade"],
                            tipo_aplicavel=tipo_enum,
                        )
                        qual_repository.create(session, new_qual)
                        created_count += 1

            except Exception as e:
                error_count += 1
                errors.append(f"Error processing qualification {qual_data.get('nome', 'unknown')}: {str(e)}")
                traceback.print_exc()

        return {
            "message": f"Import completed: {created_count} created, {updated_count} updated, {error_count} errors",
            "created": created_count,
            "updated": updated_count,
            "errors": error_count,
            "error_details": errors[:10],  # Limit error details to first 10
        }

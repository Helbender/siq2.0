"""Database management service containing business logic."""

import os
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Thread
from typing import Any

from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.features.db_management.repository import DatabaseManagementRepository
from app.features.flights.service import FlightService
from app.utils.gdrive import ID_PASTA_VOO, upload_with_service_account  # type: ignore

# Load environment variables
load_dotenv(dotenv_path="./.env")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")
IS_PRODUCTION = FLASK_ENV.lower() == "production"


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

    def delete_year(self, session: Session, year: int) -> dict[str, Any]:
        """Delete all flights for a specific year.

        This will:
        1. Load all flights for the year with their pilots
        2. Update qualifications for each pilot before deletion
        3. Delete all flights (FlightPilots cascade automatically)

        Args:
            session: Database session
            year: Year to delete flights for

        Returns:
            dict with deletion results
        """
        flights = self.repository.get_flights_for_year(session, year)

        if not flights:
            return {
                "message": f"No flights found for year {year}",
                "year": year,
                "deleted_count": 0,
            }

        # Update qualifications before deleting flights
        for flight in flights:
            for pilot in flight.flight_pilots:
                self.flight_service._update_qualifications_on_delete(flight.fid, session, pilot)

        # Commit qualification updates
        session.commit()

        # Delete all flights (FlightPilots cascade automatically)
        deleted_count = len(flights)
        for flight in flights:
            session.delete(flight)

        session.commit()

        return {
            "message": f"Successfully deleted {deleted_count} flights for year {year}",
            "year": year,
            "deleted_count": deleted_count,
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
                if "nome" not in qual_data or "grupo" not in qual_data or "validade" not in qual_data or "tipo_aplicavel" not in qual_data:
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

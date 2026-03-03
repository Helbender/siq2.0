#!/usr/bin/env python3
"""Script to import flights from a folder containing base64-encoded flight data files.

This script scans a folder (inside scripts/) for flight data files, decodes them,
and imports them into the database.

This script only supports the NEW format .1m files with:
- QUAL1-QUAL6 fields containing qualification names/IDs
- Unified flight_pilots array (no separate crew)

For old format files (with boolean qualification fields like cto, sid, qa1, etc.),
use transform_old_flights.py first to convert them to the new format.
"""

import argparse
import base64
import json
import os
import random
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime

# Add the api/ directory to Python path BEFORE any local imports
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.features.flights.models import Flight
from app.features.flights.service import FlightService
from app.utils.gdrive import tarefa_enviar_para_drive  # type: ignore
from config import engine

# Old format boolean qualification fields (should not be present in new format)
OLD_PILOT_QUAL_FIELDS = {
    "cto",
    "sid",
    "mono",
    "nfp",
    "qa1",
    "qa2",
    "bsp1",
    "bsp2",
    "ta",
    "vrp1",
    "vrp2",
    "bskit",
    "paras",
    "nvg",
    "nvg2",
}

OLD_CREW_QUAL_FIELDS = {
    "bsoc",
    "bskit",
    "paras",
}

# Lock for thread-safe printing from workers
_print_lock = threading.Lock()

# PostgreSQL deadlock error code
PG_DEADLOCK_CODE = "40P01"

# Max retries per file when deadlock is detected
DEADLOCK_RETRIES = 5

# Max retries per file when DB connection drops
CONNECTION_RETRIES = 5

# Fixed number of worker threads
NUM_WORKERS = 8


def _is_deadlock(exc: BaseException) -> bool:
    """True if the exception is a PostgreSQL deadlock (or similar DB deadlock)."""
    if not isinstance(exc, OperationalError) or exc.orig is None:
        return False
    return getattr(exc.orig, "pgcode", None) == PG_DEADLOCK_CODE


def _is_transient_connection_error(exc: BaseException) -> bool:
    """True for transient DB connection drops that should be retried."""
    if not isinstance(exc, OperationalError):
        return False

    # SQLAlchemy may mark the connection as invalidated.
    if bool(getattr(exc, "connection_invalidated", False)):
        return True

    msg = str(getattr(exc, "orig", exc)).lower()
    transient_markers = (
        "ssl connection has been closed unexpectedly",
        "server closed the connection unexpectedly",
        "connection reset by peer",
        "broken pipe",
        "terminating connection due to administrator command",
        "could not receive data from server",
        "could not send data to server",
    )
    return any(m in msg for m in transient_markers)


def _log(worker_label: str, msg: str) -> None:
    """Thread-safe print with [worker] prefix."""
    with _print_lock:
        print(f"[{worker_label}] " + msg)


def _sort_key_from_filename(filename: str) -> tuple[str, str]:
    """(date_str, time_str) from filename for sorting. e.g. '1M 50A0034 07Apr2025 13:09 16709.1m'."""
    parts = filename.split()
    if len(parts) >= 4:
        return (parts[2], parts[3])
    return ("", "")


def collect_all_files(root_folder: str) -> list[tuple[str, str]]:
    """Walk folder, collect (file_path, filename) for each file.
    Sorted by (date, time) from filename for deterministic order.
    """
    items: list[tuple[str, str, str, str]] = []
    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            date_str, time_str = _sort_key_from_filename(filename)
            items.append((file_path, filename, date_str, time_str))
    items.sort(key=lambda x: (x[2], x[3]))
    return [(fp, fn) for fp, fn, _, _ in items]


def chunk_list(lst: list, n: int) -> list[list]:
    """Split list into exactly n chunks. Earlier chunks may have one extra element."""
    if n <= 0:
        return [lst] if lst else []
    size = len(lst)
    if size == 0:
        return []
    base, remainder = divmod(size, n)
    chunks = []
    start = 0
    for i in range(n):
        length = base + (1 if i < remainder else 0)
        chunks.append(lst[start : start + length])
        start += length
    return chunks


def check_duplicate_flight(session: Session, airtask: str, date, departure_time: str, tailnumber: int) -> Flight | None:
    """Check if a flight with the same airtask, date, ATD, and aircraft already exists."""
    return session.execute(
        select(Flight).where(
            Flight.airtask == airtask,
            Flight.date == date,
            Flight.departure_time == departure_time,
            Flight.tailnumber == tailnumber,
        )
    ).scalar_one_or_none()


def is_old_format(pilot_data: dict) -> bool:
    """Check if pilot data is in old format (has boolean qualification fields).

    Args:
        pilot_data: Dictionary with pilot/crew data

    Returns:
        True if old format detected, False otherwise
    """
    # Check for old pilot qualification fields
    has_old_pilot_format = any(key in pilot_data for key in OLD_PILOT_QUAL_FIELDS)
    # Check for old crew qualification fields
    has_old_crew_format = any(key in pilot_data for key in OLD_CREW_QUAL_FIELDS)

    return has_old_pilot_format or has_old_crew_format


def validate_new_format(flight_data: dict, filename: str) -> tuple[bool, str | None]:
    """Validate that flight data is in new format.

    Args:
        flight_data: Dictionary with flight data
        filename: Name of the file being processed (for error messages)

    Returns:
        Tuple of (is_valid: bool, error_message: str | None)
    """
    flight_pilots = flight_data.get("flight_pilots", [])

    if not flight_pilots:
        return True, None  # Empty pilots list is valid (will be caught later)

    for idx, pilot in enumerate(flight_pilots):
        if is_old_format(pilot):
            return (
                False,
                f"Old format detected in pilot/crew {idx + 1} (has boolean qualification fields). "
                f"Please use transform_old_flights.py to convert this file first.",
            )

    return True, None


def _build_flight_from_data(flight_data: dict) -> Flight:
    """Build a Flight model from decoded flight data. Tries %Y-%m-%d then %d-%b-%Y for date."""
    try:
        date = datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
    except ValueError:
        date = datetime.strptime(flight_data["date"], "%d-%b-%Y").replace(tzinfo=UTC).date()
    return Flight(
        airtask=flight_data["airtask"],
        date=date,
        origin=flight_data.get("origin", ""),
        destination=flight_data.get("destination", ""),
        departure_time=flight_data.get("ATD", ""),
        arrival_time=flight_data.get("ATA", ""),
        flight_type=flight_data.get("flightType", ""),
        flight_action=flight_data.get("flightAction", ""),
        tailnumber=int(flight_data.get("tailNumber", 0)),
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


def process_one_file(
    session: Session,
    flight_service: FlightService,
    file_path: str,
    filename: str,
    skip_duplicates: bool,
    worker_label: str,
    upload_to_gdrive: bool,
) -> tuple[int, str | None, tuple[dict, str, str] | None]:
    """Process a single flight file. Returns (1, None) on success, (0, None) on skip, (0, error_msg) on error."""
    with open(file_path) as f:
        content = f.read().strip()
    try:
        decoded_bytes = base64.b64decode(content)
        decoded_str = decoded_bytes.decode("utf-8")
        try:
            content_raw = json.loads(decoded_str)
        except json.JSONDecodeError:
            content_raw = {"raw": decoded_str}
    except Exception as e:
        _log(worker_label, f"Error decoding base64: {e}")
        return 0, f"{filename}: Error decoding base64 - {e}", None

    flight_data = content_raw
    parts = filename.split()
    if len(parts) < 5:
        _log(worker_label, f"⚠️  Skipping malformed filename: {filename}")
        return 0, f"{filename}: Malformed filename", None

    is_valid, validation_error = validate_new_format(flight_data, filename)
    if not is_valid:
        _log(worker_label, f"❌ {validation_error}")
        return 0, f"{filename}: {validation_error}", None

    try:
        flight = _build_flight_from_data(flight_data)
    except (ValueError, KeyError) as e:
        _log(worker_label, f"❌ Error parsing flight data: {e}")
        return 0, f"{filename}: {e}", None

    existing_flight = check_duplicate_flight(
        session, flight.airtask, flight.date, flight.departure_time, flight.tailnumber
    )

    if existing_flight:
        if skip_duplicates:
            _log(worker_label, f"⚠️  Duplicate found - skipping flight: {flight.airtask} on {flight.date}")
            upload_job = None
            if upload_to_gdrive:
                nome_arquivo_voo = filename
                nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")
                upload_job = (flight_data, nome_arquivo_voo, nome_pdf)
            return 0, None, upload_job
        _log(worker_label, f"Duplicate found - updating existing flight: {flight.airtask} on {flight.date}")
        existing_flight.airtask = flight.airtask
        existing_flight.date = flight.date
        existing_flight.origin = flight.origin
        existing_flight.destination = flight.destination
        existing_flight.departure_time = flight.departure_time
        existing_flight.arrival_time = flight.arrival_time
        existing_flight.flight_type = flight.flight_type
        existing_flight.flight_action = flight.flight_action
        existing_flight.tailnumber = flight.tailnumber
        existing_flight.total_time = flight.total_time
        existing_flight.atr = flight.atr
        existing_flight.passengers = flight.passengers
        existing_flight.doe = flight.doe
        existing_flight.cargo = flight.cargo
        existing_flight.number_of_crew = flight.number_of_crew
        existing_flight.orm = flight.orm
        existing_flight.fuel = flight.fuel
        existing_flight.activation_first = flight.activation_first
        existing_flight.activation_last = flight.activation_last
        existing_flight.ready_ac = flight.ready_ac
        existing_flight.med_arrival = flight.med_arrival
        existing_flight.flight_pilots.clear()

        if "flight_pilots" not in flight_data:
            _log(worker_label, f"⚠️  At least one pilot is required for {flight.airtask} on {flight.date}")
            return 0, f"{filename}: At least one pilot is required", None

        for pilot in flight_data["flight_pilots"]:
            if "nip" not in pilot:
                _log(worker_label, f"⚠️  Skipping pilot/crew without NIP in flight {flight.airtask} on {flight.date}")
                return 0, f"{filename}: Pilot/crew without NIP", None
            result = flight_service._add_crew_and_pilots(session, existing_flight, pilot, edit=False, auto_commit=False)
            if result is None:
                continue

        _log(worker_label, f"Updated flight: {existing_flight.airtask} on {existing_flight.date}")
        upload_job = None
        if upload_to_gdrive:
            nome_arquivo_voo = filename
            nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")
            upload_job = (flight_data, nome_arquivo_voo, nome_pdf)

        return 1, None, upload_job

    _log(worker_label, f"New flight - creating: {flight.airtask} on {flight.date}")

    # Validate pilots before adding flight to session
    if "flight_pilots" not in flight_data or not flight_data["flight_pilots"]:
        _log(worker_label, f"⚠️  At least one pilot is required for {flight.airtask} on {flight.date}")
        return 0, f"{filename}: At least one pilot is required", None

    # Check all pilots have NIP before starting transaction
    for pilot_data in flight_data["flight_pilots"]:
        if "nip" not in pilot_data:
            _log(worker_label, f"⚠️  Skipping pilot/crew without NIP in flight {flight.airtask} on {flight.date}")
            return 0, f"{filename}: Pilot/crew without NIP", None

    # Now add flight to session and process pilots
    session.add(flight)
    session.flush()

    for pilot_data in flight_data["flight_pilots"]:
        result = flight_service._add_crew_and_pilots(session, flight, pilot_data, edit=False, auto_commit=False)
        if result is None:
            continue

    _log(worker_label, f"Created new flight: {flight.airtask} on {flight.date}")
    upload_job = None
    if upload_to_gdrive:
        nome_arquivo_voo = filename
        nome_pdf = nome_arquivo_voo.replace(".1m", ".pdf")
        upload_job = (flight_data, nome_arquivo_voo, nome_pdf)

    return 1, None, upload_job


def process_chunk(
    worker_id: int,
    file_list: list[tuple[str, str]],
    skip_duplicates: bool,
    batch_size: int,
    session_factory: sessionmaker,
    upload_to_gdrive: bool,
    upload_executor: ThreadPoolExecutor | None,
) -> tuple[int, list[str]]:
    """Process a chunk of files in a single worker. Uses its own DB session.
    Returns (flights_processed, errors).
    """
    worker_label = f"W{worker_id + 1}"
    flight_service = FlightService()
    flights_processed = 0
    errors: list[str] = []
    try:
        _log(worker_label, f"Processing {len(file_list)} file(s)")
        files_processed_count = 0
        for file_path, filename in file_list:
            files_processed_count += 1
            _log(worker_label, f"Processing file {files_processed_count}/{len(file_list)}: {filename}")
            file_success = False
            max_retries = max(DEADLOCK_RETRIES, CONNECTION_RETRIES)
            for attempt in range(max_retries):
                db = session_factory()
                # Increase statement timeout for this session (milliseconds)
                try:
                    db.execute(text("SET LOCAL statement_timeout = 300000"))  # 5 minutes
                except Exception:
                    # If setting timeout fails (e.g. non-Postgres DB), continue with default
                    pass
                try:
                    # Ensure session is clean before processing each file
                    db.rollback()  # Rollback any previous uncommitted changes
                    n, err, upload_job = process_one_file(
                        db,
                        flight_service,
                        file_path,
                        filename,
                        skip_duplicates,
                        worker_label,
                        upload_to_gdrive,
                    )
                    if err:
                        errors.append(err)
                    if n > 0:
                        flights_processed += n
                        # Commit immediately after each successful file to avoid losing progress
                        db.commit()
                        file_success = True
                        if flights_processed % batch_size == 0:
                            _log(worker_label, f"✅ Committed batch: {flights_processed} flights so far")
                    else:
                        # File was skipped (duplicate) or had validation error - no commit needed
                        file_success = True

                    # Schedule upload (even if DB was skipped) when we have a job
                    if upload_job and upload_executor is not None:
                        try:
                            dados, nome_arquivo_voo, nome_pdf = upload_job
                            upload_executor.submit(tarefa_enviar_para_drive, dados, dados, nome_arquivo_voo, nome_pdf)
                        except Exception as e:
                            _log(worker_label, f"⚠️  Failed to schedule Google Drive upload for {filename}: {e}")
                    break
                except Exception as e:
                    try:
                        db.rollback()  # Always rollback on exception
                    except Exception:
                        pass

                    if _is_deadlock(e) and attempt < max_retries - 1:
                        delay = 0.1 * (2**attempt) + random.uniform(0, 0.2)
                        _log(
                            worker_label,
                            f"⚠️  Deadlock on {filename}, retry {attempt + 1}/{max_retries} in {delay:.1f}s...",
                        )
                        time.sleep(delay)
                    elif _is_transient_connection_error(e) and attempt < max_retries - 1:
                        delay = 0.5 * (2**attempt) + random.uniform(0, 0.3)
                        _log(
                            worker_label,
                            f"⚠️  DB connection dropped on {filename}, retry {attempt + 1}/{max_retries} in {delay:.1f}s...",
                        )
                        time.sleep(delay)
                    else:
                        _log(worker_label, f"❌ Error processing {filename}: {e}")
                        errors.append(f"{filename}: {e}")
                        file_success = True  # Mark as processed (even though failed) to continue
                        break
                finally:
                    try:
                        db.close()
                    except Exception:
                        pass

            if not file_success:
                _log(worker_label, f"⚠️  File {filename} was not processed after {max_retries} attempts")
                errors.append(f"{filename}: Failed after {max_retries} attempts")
        _log(worker_label, f"✅ Done: {flights_processed} flights processed from {files_processed_count} file(s)")
    except Exception as e:
        _log(worker_label, f"❌ Fatal error: {e}")
        errors.append(f"[{worker_label}] {e}")
        raise
    return flights_processed, errors


def main():
    """Main function to parse arguments and import flights."""
    parser = argparse.ArgumentParser(
        description="Import flights from a folder containing base64-encoded flight data files (NEW format only)",
        epilog="""
This script only supports the NEW format .1m files with:
  - QUAL1-QUAL6 fields containing qualification names/IDs
  - Unified flight_pilots array (no separate crew)

For old format files (with boolean qualification fields), use transform_old_flights.py
first to convert them to the new format.
        """,
    )
    parser.add_argument(
        "foldername", type=str, help="Name of the folder inside scripts/ directory to scan for flight data files"
    )
    parser.add_argument(
        "-gdrive",
        "--upload",
        action="store_true",
        help="Also upload each imported/updated flight to Google Drive (.1m + PDF)",
    )
    parser.add_argument(
        "--skip-duplicates",
        "--skip",
        action="store_true",
        help="Skip duplicate flights instead of updating them",
    )

    args = parser.parse_args()

    # Get the scripts directory path
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the full path to the folder
    folder_path = os.path.join(scripts_dir, args.foldername)

    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"❌ Error: Folder '{folder_path}' does not exist!")
        sys.exit(1)

    if not os.path.isdir(folder_path):
        print(f"❌ Error: '{folder_path}' is not a directory!")
        sys.exit(1)

    print(f"🚀 Starting flight import from folder: {folder_path}")
    if args.skip_duplicates:
        print("⚠️  Mode: Skipping duplicates (--skip-duplicates flag set)")
    else:
        print("ℹ️  Mode: Updating duplicates (default behavior)")
    print(f"🔀 Workers: {NUM_WORKERS} (multithreaded)")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    all_files = collect_all_files(folder_path)
    if not all_files:
        print("❌ No flight files found.")
        sys.exit(1)

    chunks = chunk_list(all_files, NUM_WORKERS)
    total_files = len(all_files)
    print(f"📁 Found {total_files} file(s), split across {len(chunks)} worker(s)")
    print("-" * 60)

    session_factory = sessionmaker(bind=engine)
    batch_size = 50
    skip_duplicates = args.skip_duplicates
    upload_to_gdrive = args.upload
    upload_executor = ThreadPoolExecutor(max_workers=4) if upload_to_gdrive else None
    all_errors: list[str] = []
    total_processed = 0

    try:
        with ThreadPoolExecutor(max_workers=NUM_WORKERS) as ex:
            futures = {
                ex.submit(
                    process_chunk,
                    i,
                    chunk,
                    skip_duplicates,
                    batch_size,
                    session_factory,
                    upload_to_gdrive,
                    upload_executor,
                ): i
                for i, chunk in enumerate(chunks)
            }
            for fut in as_completed(futures):
                worker_id = futures[fut]
                worker_label = f"W{worker_id + 1}"
                try:
                    processed, errors = fut.result()
                    total_processed += processed
                    all_errors.extend(errors)
                except Exception as e:
                    print(f"❌ Worker [{worker_label}] failed: {e}")
                    all_errors.append(f"[{worker_label}] Fatal: {e}")
                    raise

        print("\n" + "=" * 60)
        print(f"✅ Import completed: {total_processed} flight(s) processed")
        print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if all_errors:
            print(f"\n⚠️  {len(all_errors)} error(s) encountered:")
            for err in all_errors[:10]:
                print(f"  - {err}")
            if len(all_errors) > 10:
                print(f"  ... and {len(all_errors) - 10} more")
        print("=" * 60)
    except Exception:
        print("\n❌ Import failed.")
        raise
    finally:
        if upload_executor is not None:
            upload_executor.shutdown(wait=True)


if __name__ == "__main__":
    main()

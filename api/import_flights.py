#!/usr/bin/env python3
"""Script to import flights from a folder containing base64-encoded flight data files.

This script scans a folder (inside scripts/) for flight data files, decodes them,
and imports them into the database.
"""

import argparse
import base64
import json
import os
import sys
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

# Add the parent directory (api/) to Python path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import engine
from models.flights import Flight
from routes.flight_blueprint import add_crew_and_pilots


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


def import_flights_from_folder(root_folder: str, db: Session, batch_size: int = 50, skip_duplicates: bool = False):
    """Import flights from all files in the given folder.

    Args:
        root_folder: Path to folder containing flight data files
        db: Database session to use for imports
        batch_size: Number of flights to process before committing (default: 50)
        skip_duplicates: If True, skip duplicate flights instead of updating them (default: False)
    """
    flights_processed = 0
    errors = []

    for dirpath, _, filenames in os.walk(root_folder):
        print(f"Processing directory: {dirpath}")
        for filename in filenames:
            print(f"\nProcessing file: {filename}")
            file_path = os.path.join(dirpath, filename)
            with open(file_path) as content_dict:
                content = content_dict.read().strip()
                # Example: parse file name and content
                try:
                    decoded_bytes = base64.b64decode(content)
                    decoded_str = decoded_bytes.decode("utf-8")
                    try:
                        content_raw = json.loads(decoded_str)
                    except json.JSONDecodeError:
                        # If not valid JSON, fallback to a dict with raw string
                        content_raw = {"raw": decoded_str}
                except Exception as e:
                    print(f"Error decoding base64: {e}")
                    errors.append(f"{filename}: Error decoding base64 - {e}")
                    continue

                flight_data = content_raw
                parts = filename.split()
                if len(parts) < 5:
                    continue  # skip malformed files

                try:
                    # Try to create flight object
                    try:
                        flight = Flight(
                            airtask=flight_data["airtask"],
                            date=datetime.strptime(flight_data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date(),
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
                    except ValueError:
                        flight = Flight(
                            airtask=flight_data["airtask"],
                            date=datetime.strptime(flight_data["date"], "%d-%b-%Y").replace(tzinfo=UTC).date(),
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

                    # Check for duplicate flight using the same session
                    existing_flight = check_duplicate_flight(
                        db, flight.airtask, flight.date, flight.departure_time, flight.tailnumber
                    )

                    if existing_flight:
                        if skip_duplicates:
                            print(f"⚠️  Duplicate found - skipping flight: {flight.airtask} on {flight.date}")
                            continue  # Skip this flight and move to the next one

                        print(f"Duplicate found - updating existing flight: {flight.airtask} on {flight.date}")

                        # Update existing flight with new data
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

                        # Clear existing pilots and add new ones
                        existing_flight.flight_pilots.clear()

                        try:
                            flight_data["flight_pilots"]
                        except KeyError:
                            print(f"⚠️  At least one pilot is required for {flight.airtask} on {flight.date}")
                            errors.append(f"{filename}: At least one pilot is required")
                            continue

                        for pilot in flight_data["flight_pilots"]:
                            result = add_crew_and_pilots(
                                db,
                                existing_flight,
                                pilot,
                                auto_commit=False,  # Don't commit - we'll commit in batches
                            )
                            if result is None:
                                # Pilot not found, but continue with other pilots
                                continue

                        # Don't commit here - commit in batches
                        print(f"Updated flight: {existing_flight.airtask} on {existing_flight.date}")
                    else:
                        print(f"New flight - creating: {flight.airtask} on {flight.date}")
                        db.add(flight)

                        try:
                            flight_data["flight_pilots"]
                        except KeyError:
                            print(f"⚠️  At least one pilot is required for {flight.airtask} on {flight.date}")
                            errors.append(f"{filename}: At least one pilot is required")
                            db.rollback()  # Rollback the flight addition
                            continue

                        for pilot_data in flight_data["flight_pilots"]:
                            result = add_crew_and_pilots(
                                db,
                                flight,
                                pilot_data,
                                auto_commit=False,  # Don't commit - we'll commit in batches
                            )
                            if result is None:
                                # Pilot not found, but continue with other pilots
                                continue

                        print(f"Created new flight: {flight.airtask} on {flight.date}")

                    flights_processed += 1

                    # Commit in batches to minimize DB calls while maintaining safety
                    if flights_processed % batch_size == 0:
                        try:
                            db.commit()
                            print(f"✅ Committed batch: {flights_processed} flights processed so far")
                        except Exception as e:
                            db.rollback()
                            print(f"❌ Error committing batch: {e}")
                            errors.append(f"Batch commit error at flight {flights_processed}: {e}")
                            raise

                except Exception as e:
                    print(f"❌ Error processing {filename}: {e}")
                    errors.append(f"{filename}: {e}")
                    db.rollback()  # Rollback the current flight if there was an error
                    continue

    # Final commit for remaining flights
    try:
        db.commit()
        print(f"✅ Final commit: {flights_processed} total flights processed")
    except Exception as e:
        db.rollback()
        print(f"❌ Error in final commit: {e}")
        errors.append(f"Final commit error: {e}")
        raise

    # Print summary
    if errors:
        print(f"\n⚠️  {len(errors)} errors encountered:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")


def main():
    """Main function to parse arguments and import flights."""
    parser = argparse.ArgumentParser(
        description="Import flights from a folder containing base64-encoded flight data files"
    )
    parser.add_argument(
        "foldername", type=str, help="Name of the folder inside scripts/ directory to scan for flight data files"
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
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    session_local = sessionmaker(bind=engine)
    db = session_local()

    try:
        import_flights_from_folder(folder_path, db, skip_duplicates=args.skip_duplicates)
        print("\n" + "=" * 60)
        print("✅ Import completed successfully!")
        print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Fatal error during import: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

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


def import_flights_from_folder(root_folder: str, db: Session):
    """Import flights from all files in the given folder."""
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
                    content_raw = {}
                # print(f"Decoded content as dict: {content_raw}")
                flight_data = content_raw
                # You must adapt this to your actual file format and DB schema
                # Example filename: "1M 50A0023 02Apr2025 03_20 16710.1m"
                parts = filename.split()
                # print(flight_data)
                if len(parts) < 5:
                    continue  # skip malformed files
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
                with Session(engine, autoflush=False) as session:
                    # Check for duplicate flight
                    existing_flight = check_duplicate_flight(
                        session, flight.airtask, flight.date, flight.departure_time, flight.tailnumber
                    )

                    if existing_flight:
                        print(f"Duplicate found - updating existing flight: {flight.airtask} on {flight.date}")
                        # continue

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
                            print("At least one pilot is required")
                            continue

                        for pilot in flight_data["flight_pilots"]:
                            # print(f"Pilot: {pilot}")
                            result = add_crew_and_pilots(session, existing_flight, pilot)
                            if result is None:
                                # Pilot not found, but continue with other pilots
                                continue

                        session.commit()
                        print(f"Updated flight: {existing_flight.airtask} on {existing_flight.date}")
                    else:
                        print(f"New flight - creating: {flight.airtask} on {flight.date}")
                        session.add(flight)

                        try:
                            flight_data["flight_pilots"]
                        except KeyError:
                            print("At least one pilot is required")
                            continue

                        for pilot_data in flight_data["flight_pilots"]:
                            result = add_crew_and_pilots(session, flight, pilot_data)
                            if result is None:
                                # Pilot not found, but continue with other pilots
                                continue

                        session.commit()
                        print(f"Created new flight: {flight.airtask} on {flight.date}")


def main():
    """Main function to parse arguments and import flights."""
    parser = argparse.ArgumentParser(
        description="Import flights from a folder containing base64-encoded flight data files"
    )
    parser.add_argument(
        "foldername", type=str, help="Name of the folder inside scripts/ directory to scan for flight data files"
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
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        import_flights_from_folder(folder_path, db)
        print("\n" + "=" * 60)
        print("✅ Import completed successfully!")
        print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Fatal error during import: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

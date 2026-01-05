#!/usr/bin/env python3
"""Script to export flights from the database to .1m files.

This script queries all flights from the database, converts them to JSON format,
encodes them in base64, and saves them as .1m files in a specified folder.
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

# Add the api/ directory to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from config import engine
from models.flights import Flight
from models.qualificacoes import Qualificacao
from models.tripulantes import Tripulante  # noqa: F401 - Required for SQLAlchemy relationship resolution


def export_flights_to_files(output_folder: str, session: Session, as_json: bool = False) -> tuple[int, int]:
    """Export all flights from the database to .1m files.

    Args:
        output_folder: Path to the folder where .1m files will be saved
        session: Database session
        as_json: If True, save as JSON string instead of base64-encoded

    Returns:
        tuple[int, int]: (successful_exports, failed_exports)
    """
    # Create base output folder if it doesn't exist
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)

    # Pre-load all qualifications into a cache for efficient lookups
    all_qualifications = session.execute(select(Qualificacao)).scalars().all()
    qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}
    print(f"Loaded {len(qual_cache)} qualifications into cache")

    # Query all flights ordered by date
    stmt = select(Flight).order_by(Flight.date, Flight.departure_time)
    flights = session.execute(stmt).scalars().all()

    print(f"\n📊 Found {len(flights)} flights in database")
    print(f"📁 Exporting to: {output_path.absolute()}\n")

    successful = 0
    failed = 0

    for idx, flight in enumerate(flights, 1):
        try:
            # Convert flight to JSON format (matches import format)
            flight_json = flight.to_json(qual_cache)

            # Generate filename using the flight's get_file_name method
            filename = flight.get_file_name()

            # Create folder structure: YEAR/MONTH/DAY
            year = str(flight.date.year)
            month = flight.date.strftime("%b")  # 3-letter month abbreviation (Jan, Feb, Mar, etc.)
            day = f"{flight.date.day:02d}"  # Zero-padded day (01-31)

            # Create the full directory path
            date_folder = output_path / year / month / day
            date_folder.mkdir(parents=True, exist_ok=True)

            # Save to file in the date-organized folder
            file_path = date_folder / filename
            if as_json:
                # Save as JSON string (pretty-printed)
                json_str = json.dumps(flight_json, ensure_ascii=False, indent=2)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(json_str)
            else:
                # Convert JSON to string and encode to base64
                json_str = json.dumps(flight_json, ensure_ascii=False, indent=None)
                json_bytes = json_str.encode("utf-8")
                base64_encoded = base64.b64encode(json_bytes).decode("utf-8")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(base64_encoded)

            successful += 1
            print(f"✅ [{idx}/{len(flights)}] Exported: {year}/{month}/{day}/{filename}")

        except Exception as e:
            failed += 1
            print(f"❌ [{idx}/{len(flights)}] Failed to export flight {flight.airtask} on {flight.date}: {e}")

    return successful, failed


def main():
    """Main function to run the export script."""
    parser = argparse.ArgumentParser(
        description="Export flights from database to .1m files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export all flights to ./exports folder (base64-encoded)
  python export_flights_to_files.py ./exports

  # Export to a specific absolute path
  python export_flights_to_files.py /home/user/flight_exports

  # Export as JSON strings (not encoded)
  python export_flights_to_files.py ./exports --json
        """,
    )
    parser.add_argument(
        "output_folder",
        type=str,
        help="Path to the folder where .1m files will be saved",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Save files as JSON strings instead of base64-encoded",
    )

    args = parser.parse_args()

    # Validate output folder path
    output_folder = os.path.abspath(args.output_folder)
    if not os.path.isdir(os.path.dirname(output_folder)) and os.path.dirname(output_folder):
        print(f"❌ Error: Parent directory does not exist: {os.path.dirname(output_folder)}")
        sys.exit(1)

    print("🚀 Starting flight export...")
    print(f"📂 Output folder: {output_folder}\n")

    try:
        with Session(engine) as session:
            successful, failed = export_flights_to_files(output_folder, session, as_json=args.json)

        print("\n" + "=" * 60)
        print("✅ Export completed!")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"   Total: {successful + failed}")
        print("=" * 60)

        if failed > 0:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Export interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error during export: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

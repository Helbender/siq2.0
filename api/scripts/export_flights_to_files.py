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

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Add the api/ directory to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from app.features.flights.models import Flight
from app.features.qualifications.models import Qualificacao
from app.features.users.models import Tripulante  # noqa: F401 - Required for SQLAlchemy relationship resolution
from app.shared.rbac_models import Role  # noqa: F401 - Required for SQLAlchemy relationship resolution
from config import engine


def _load_old_models():
    """Load old models from scripts/models. Call only when --old is used."""
    scripts_dir = os.path.join(api_dir, "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    # Import order matters for SQLAlchemy relationship resolution
    from models.users import Base  # noqa: F401
    from models.pilots import Pilot, Qualification  # noqa: F401
    from models.crew import Crew, QualificationCrew  # noqa: F401
    from models.flights import Flight as OldFlight  # noqa: F401
    return OldFlight


def export_flights_to_files(
    output_folder: str, session: Session, as_json: bool = False, use_old: bool = False
) -> tuple[int, int]:
    """Export all flights from the database to .1m files.

    Args:
        output_folder: Path to the folder where .1m files will be saved
        session: Database session
        as_json: If True, save as JSON string instead of base64-encoded
        use_old: If True, use old models (pilots/crew) for old database schema

    Returns:
        tuple[int, int]: (successful_exports, failed_exports)
    """
    # Create base output folder if it doesn't exist
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)

    if use_old:
        FlightModel = _load_old_models()
        qual_cache = None
    else:
        FlightModel = Flight
        # Pre-load all qualifications into a cache for efficient lookups
        all_qualifications = session.execute(select(Qualificacao)).scalars().all()
        qual_cache: dict[int, str] = {q.id: q.nome for q in all_qualifications}
        print(f"Loaded {len(qual_cache)} qualifications into cache")

    # Query all flights ordered by date
    stmt = select(FlightModel).order_by(FlightModel.date, FlightModel.departure_time)
    flights = session.execute(stmt).scalars().all()

    print(f"\n📊 Found {len(flights)} flights in database")
    print(f"📁 Exporting to: {output_path.absolute()}\n")

    successful = 0
    failed = 0

    for idx, flight in enumerate(flights, 1):
        try:
            # Convert flight to JSON format (matches import format)
            flight_json = flight.to_json(qual_cache) if qual_cache is not None else flight.to_json()

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

  # Export from old database (DB_URL_OLD)
  python export_flights_to_files.py ./exports --old
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
    parser.add_argument(
        "--old",
        action="store_true",
        help="Use DB_URL_OLD environment variable for the database connection",
    )

    args = parser.parse_args()

    # Select engine: DB_URL_OLD when --old, else default engine
    if args.old:
        db_url = os.environ.get("DB_URL_OLD")
        if not db_url:
            print("❌ Error: DB_URL_OLD is not set in environment (required when using --old)")
            sys.exit(1)
        db_engine = create_engine(
            db_url,
            pool_size=200,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True,
        )
    else:
        db_engine = engine

    # Validate output folder path
    output_folder = os.path.abspath(args.output_folder)
    if not os.path.isdir(os.path.dirname(output_folder)) and os.path.dirname(output_folder):
        print(f"❌ Error: Parent directory does not exist: {os.path.dirname(output_folder)}")
        sys.exit(1)

    print("🚀 Starting flight export...")
    print(f"📂 Output folder: {output_folder}")
    if args.old:
        print("🗄️  Using old database (DB_URL_OLD)\n")
    else:
        print()

    try:
        with Session(db_engine) as session:
            successful, failed = export_flights_to_files(
                output_folder, session, as_json=args.json, use_old=args.old
            )

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

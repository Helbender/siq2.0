#!/usr/bin/env python3
"""Script to transform old format .1m files to new format.

This script reads .1m files from the Modelos folder (inside scripts/),
transforms them from the old model format to the new model format,
and saves them as new .1m files.

Old format differences:
- Separate Pilot and Crew models
- Boolean qualification fields (cto, sid, mono, nfp, qa1, qa2, etc.)
- FlightCrew table separate from FlightPilots

New format:
- Unified Tripulante model
- qual1-qual6 fields with qualification names/IDs
- All crew members in flight_pilots array
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

# Add the api/ directory to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

from config import engine
from models.enums import TipoTripulante
from models.qualificacoes import Qualificacao
from sqlalchemy.orm import Session

# Mapping from old boolean qualification fields to qualification names
PILOT_QUAL_MAPPING = {
    "cto": "CTO",
    "sid": "SID",
    "mono": "MONO",
    "nfp": "NFP",
    "qa1": "QA1",
    "qa2": "QA2",
    "bsp1": "BSP1",
    "bsp2": "BSP2",
    "ta": "TA",
    "vrp1": "VRP1",
    "vrp2": "VRP2",
    "bskit": "BSKIT",
    "paras": "PARAS",
    "nvg": "NVG",
    "nvg2": "NVG2",
}

CREW_QUAL_MAPPING = {
    "bsoc": "BSOC",
    "bskit": "BSKIT",
    "paras": "PARAS",
}

# Cache for qualification validation (loaded once per script run)
_qual_cache: dict[tuple[str, TipoTripulante], bool] = {}


def load_qualification_cache() -> dict[tuple[str, TipoTripulante], bool]:
    """Load all qualifications from database into a cache for validation.

    Returns:
        Dictionary mapping (qual_name, tipo) -> exists (bool)
    """
    if _qual_cache:
        return _qual_cache  # Already loaded

    with Session(engine) as session:
        from sqlalchemy import select

        qualifications = session.scalars(select(Qualificacao)).all()
        for qual in qualifications:
            _qual_cache[(qual.nome, qual.tipo_aplicavel)] = True

    return _qual_cache


def validate_qualification_exists(qual_name: str, tipo: TipoTripulante) -> bool:
    """Check if a qualification exists in the database for the given type.

    Args:
        qual_name: Qualification name to check
        tipo: Tripulante type (PILOTO, OPERADOR_CABINE, etc.)

    Returns:
        True if qualification exists, False otherwise
    """
    cache = load_qualification_cache()
    return cache.get((qual_name, tipo), False)


def convert_old_pilot_to_new(pilot_data: dict, validate: bool = True) -> tuple[dict, list[str]]:
    """Convert old format pilot data to new format.

    Args:
        pilot_data: Dictionary with old format pilot data (may have boolean qualification fields)
        validate: If True, validate that qualifications exist in database (default: True)

    Returns:
        Tuple of (new_pilot_dict, warnings_list)
    """
    new_pilot = {
        "name": pilot_data.get("name", ""),
        "nip": pilot_data.get("nip", 0),
        "rank": pilot_data.get("rank", ""),
        "position": pilot_data.get("position", ""),
        "ATR": pilot_data.get("ATR", 0),
        "ATN": pilot_data.get("ATN", 0),
        "precapp": pilot_data.get("precapp", 0),
        "nprecapp": pilot_data.get("nprecapp", 0),
    }

    warnings = []

    # Determine pilot type (default to PILOTO if not specified)
    # In old format, we might not have tipo, so we'll validate against PILOTO
    # The import script will handle the actual tipo lookup
    pilot_tipo = TipoTripulante.PILOTO  # Default assumption

    # Collect qualifications from boolean fields
    qualifications = []
    for old_field, qual_name in PILOT_QUAL_MAPPING.items():
        if pilot_data.get(old_field, False):
            if validate:
                # Check if qualification exists (try PILOTO first, most common)
                if not validate_qualification_exists(qual_name, pilot_tipo):
                    warnings.append(
                        f"Qualification '{qual_name}' not found in database for type {pilot_tipo.value}. "
                        f"It will be skipped during import."
                    )
            qualifications.append(qual_name)

    # Map to qual1-qual6 (up to 6 qualifications)
    for i in range(1, 7):
        qual_key = f"QUAL{i}"
        if i <= len(qualifications):
            new_pilot[qual_key] = qualifications[i - 1]
        else:
            new_pilot[qual_key] = None

    return new_pilot, warnings


def convert_old_crew_to_new(crew_data: dict, validate: bool = True) -> tuple[dict, list[str]]:
    """Convert old format crew data to new format (as pilot format).

    Args:
        crew_data: Dictionary with old format crew data
        validate: If True, validate that qualifications exist in database (default: True)

    Returns:
        Tuple of (new_crew_dict, warnings_list)
    """
    new_crew = {
        "name": crew_data.get("name", ""),
        "nip": crew_data.get("nip", 0),
        "rank": crew_data.get("rank", ""),
        "position": crew_data.get("position", ""),
        "ATR": None,
        "ATN": None,
        "precapp": None,
        "nprecapp": None,
    }

    warnings = []

    # Crew members are typically OPERADOR_CABINE or CONTROLADOR_TATICO
    # We'll validate against OPERADOR_CABINE as default (most common crew type)
    crew_tipo = TipoTripulante.OPERADOR_CABINE  # Default assumption

    # Collect qualifications from boolean fields
    qualifications = []
    for old_field, qual_name in CREW_QUAL_MAPPING.items():
        if crew_data.get(old_field, False):
            if validate:
                # Check if qualification exists
                if not validate_qualification_exists(qual_name, crew_tipo):
                    warnings.append(
                        f"Qualification '{qual_name}' not found in database for type {crew_tipo.value}. "
                        f"It will be skipped during import."
                    )
            qualifications.append(qual_name)

    # Map to qual1-qual6 (up to 6 qualifications)
    for i in range(1, 7):
        qual_key = f"QUAL{i}"
        if i <= len(qualifications):
            new_crew[qual_key] = qualifications[i - 1]
        else:
            new_crew[qual_key] = None

    return new_crew, warnings


def transform_flight_data(old_flight_data: dict, validate: bool = True) -> tuple[dict, list[str]]:
    """Transform old format flight data to new format.

    Args:
        old_flight_data: Dictionary with old format flight data
        validate: If True, validate that qualifications exist in database (default: True)

    Returns:
        Tuple of (new_flight_dict, warnings_list)
    """
    # Flight main data remains mostly the same
    new_flight = {
        "id": old_flight_data.get("id"),
        "airtask": old_flight_data.get("airtask", ""),
        "date": old_flight_data.get("date", ""),
        "origin": old_flight_data.get("origin", ""),
        "destination": old_flight_data.get("destination", ""),
        "ATD": old_flight_data.get("ATD", ""),
        "ATA": old_flight_data.get("ATA", ""),
        "ATE": old_flight_data.get("ATE", ""),
        "flightType": old_flight_data.get("flightType", ""),
        "flightAction": old_flight_data.get("flightAction", ""),
        "tailNumber": old_flight_data.get("tailNumber", 0),
        "totalLandings": old_flight_data.get("totalLandings", 0),
        "passengers": old_flight_data.get("passengers", 0),
        "doe": old_flight_data.get("doe", 0),
        "cargo": old_flight_data.get("cargo", 0),
        "numberOfCrew": old_flight_data.get("numberOfCrew", 0),
        "orm": old_flight_data.get("orm", 0),
        "fuel": old_flight_data.get("fuel", 0),
        "activationFirst": old_flight_data.get("activationFirst", "__:__"),
        "activationLast": old_flight_data.get("activationLast", "__:__"),
        "readyAC": old_flight_data.get("readyAC", "__:__"),
        "medArrival": old_flight_data.get("medArrival", "__:__"),
        "flight_pilots": [],
    }

    all_warnings = []

    # Transform pilots (and crew if they're in the same array)
    flight_pilots = old_flight_data.get("flight_pilots", [])
    for member in flight_pilots:
        # Check if this is old format (has boolean qualification fields)
        has_old_pilot_format = any(key in member for key in PILOT_QUAL_MAPPING.keys())
        has_old_crew_format = any(key in member for key in CREW_QUAL_MAPPING.keys())

        if has_old_pilot_format:
            # Old format pilot - convert it
            new_pilot, warnings = convert_old_pilot_to_new(member, validate=validate)
            new_flight["flight_pilots"].append(new_pilot)
            all_warnings.extend(warnings)
        elif has_old_crew_format:
            # Old format crew - convert to new format (as pilot)
            new_crew, warnings = convert_old_crew_to_new(member, validate=validate)
            new_flight["flight_pilots"].append(new_crew)
            all_warnings.extend(warnings)
        else:
            # Already in new format or unknown format - keep as is
            new_flight["flight_pilots"].append(member)

    # Also check for separate flight_crew array (if it exists in some old formats)
    flight_crew = old_flight_data.get("flight_crew", [])
    for crew_member in flight_crew:
        has_old_crew_format = any(key in crew_member for key in CREW_QUAL_MAPPING.keys())
        if has_old_crew_format:
            new_crew, warnings = convert_old_crew_to_new(crew_member, validate=validate)
            new_flight["flight_pilots"].append(new_crew)
            all_warnings.extend(warnings)
        else:
            # Unknown format - keep as is
            new_flight["flight_pilots"].append(crew_member)

    return new_flight, all_warnings


def process_file(input_path: Path, output_path: Path) -> tuple[bool, str]:
    """Process a single .1m file.

    Args:
        input_path: Path to input .1m file
        output_path: Path to output .1m file

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        # Read and decode the file
        with open(input_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

        # Decode base64
        try:
            decoded_bytes = base64.b64decode(content)
            decoded_str = decoded_bytes.decode("utf-8")
            old_flight_data = json.loads(decoded_str)
        except (base64.binascii.Error, json.JSONDecodeError) as e:
            return False, f"Error decoding file: {e}"

        # Transform to new format
        new_flight_data, warnings = transform_flight_data(old_flight_data, validate=True)

        # Print warnings if any
        if warnings:
            print(f"  ⚠️  Warnings for {filename}:")
            for warning in warnings:
                print(f"     - {warning}")

        # Encode back to base64
        json_str = json.dumps(new_flight_data, ensure_ascii=False, indent=None)
        json_bytes = json_str.encode("utf-8")
        base64_encoded = base64.b64encode(json_bytes).decode("utf-8")

        # Write output file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(base64_encoded)

        return True, "Success"

    except Exception as e:
        return False, f"Error processing file: {e}"


def transform_flights_from_folder(
    input_folder: str, output_folder: str, recursive: bool = True
) -> tuple[int, int, list[str]]:
    """Transform all .1m files from input folder to output folder.

    Args:
        input_folder: Path to folder containing old format .1m files
        output_folder: Path to folder where new format .1m files will be saved
        recursive: If True, process subdirectories recursively

    Returns:
        Tuple of (successful_count, failed_count, error_messages)
    """
    input_path = Path(input_folder)
    output_path = Path(output_folder)

    if not input_path.exists():
        raise ValueError(f"Input folder does not exist: {input_folder}")

    successful = 0
    failed = 0
    errors = []

    # Find all .1m files
    pattern = "**/*.1m" if recursive else "*.1m"
    input_files = list(input_path.glob(pattern))

    print(f"📊 Found {len(input_files)} .1m files to process")
    print(f"📁 Input folder: {input_path.absolute()}")
    print(f"📁 Output folder: {output_path.absolute()}\n")

    for idx, input_file in enumerate(input_files, 1):
        # Calculate relative path to maintain folder structure
        relative_path = input_file.relative_to(input_path)
        output_file = output_path / relative_path

        print(f"[{idx}/{len(input_files)}] Processing: {relative_path}", end=" ... ", flush=True)

        success, message = process_file(input_file, output_file)

        if success:
            successful += 1
            print("✅")
        else:
            failed += 1
            error_msg = f"{relative_path}: {message}"
            errors.append(error_msg)
            print(f"❌ {message}")

    return successful, failed, errors


def main():
    """Main function to run the transformation script."""
    parser = argparse.ArgumentParser(
        description="Transform old format .1m files to new format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Transform files from scripts/Modelos to scripts/Modelos_New
  python transform_old_flights.py scripts/Modelos scripts/Modelos_New

  # Transform files non-recursively (only top level)
  python transform_old_flights.py scripts/Modelos scripts/Modelos_New --no-recursive
        """,
    )
    parser.add_argument(
        "input_folder",
        type=str,
        help="Path to folder containing old format .1m files (relative to scripts/ or absolute)",
    )
    parser.add_argument(
        "output_folder",
        type=str,
        help="Path to folder where new format .1m files will be saved (relative to scripts/ or absolute)",
    )
    parser.add_argument(
        "--no-recursive",
        action="store_true",
        help="Process only files in the input folder, not subdirectories",
    )

    args = parser.parse_args()

    # Get scripts directory
    scripts_dir = Path(__file__).parent

    # Resolve paths (if relative, assume relative to scripts/)
    if os.path.isabs(args.input_folder):
        input_folder = args.input_folder
    else:
        input_folder = str(scripts_dir / args.input_folder)

    if os.path.isabs(args.output_folder):
        output_folder = args.output_folder
    else:
        output_folder = str(scripts_dir / args.output_folder)

    print("🚀 Starting flight format transformation...")
    print(f"📅 Started at: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    try:
        successful, failed, errors = transform_flights_from_folder(
            input_folder, output_folder, recursive=not args.no_recursive
        )

        print("\n" + "=" * 60)
        print("✅ Transformation completed!")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"   Total: {successful + failed}")
        if errors:
            print(f"\n⚠️  Errors encountered ({len(errors)}):")
            for error in errors[:10]:  # Show first 10 errors
                print(f"    - {error}")
            if len(errors) > 10:
                print(f"    ... and {len(errors) - 10} more errors")
        print("=" * 60)

        if failed > 0:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Transformation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error during transformation: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()


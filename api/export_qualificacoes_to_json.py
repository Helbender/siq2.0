#!/usr/bin/env python3
"""Script to export/import qualificacoes data between database and JSON file.

This script can:
- Export all qualificacoes from database to JSON file
- Import qualificacoes from JSON file to database (create or update)
"""

import json
import os
import sys
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

# Add the parent directory (api/) to Python path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import engine  # type: ignore
from models.enums import GrupoQualificacoes, TipoTripulante  # type: ignore
from models.flights import FlightPilots  # noqa: F401  # type: ignore
from models.qualificacoes import Qualificacao  # type: ignore
from models.tripulantes import TripulanteQualificacao  # noqa: F401  # type: ignore


def export_qualificacoes_to_json(output_file: str = "qualificacoes_export.json"):
    """Export all qualificacoes from database to JSON file.

    Args:
        output_file: Name of the output JSON file (default: qualificacoes_export.json)
    """
    print("🔍 Connecting to database...")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    try:
        with Session(engine) as session:
            # Query all qualificacoes, ordered by grupo and nome
            stmt = select(Qualificacao).order_by(Qualificacao.grupo, Qualificacao.nome)
            qualificacoes = session.execute(stmt).scalars().all()

            print(f"📊 Found {len(qualificacoes)} qualificacoes in database")

            # Serialize to JSON format
            result = [
                {
                    "id": q.id,
                    "nome": q.nome,
                    "validade": q.validade,
                    "tipo_aplicavel": q.tipo_aplicavel.value,
                    "grupo": q.grupo.value,
                }
                for q in qualificacoes
            ]

            # Get the script directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            output_path = os.path.join(script_dir, output_file)

            # Write to JSON file
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            print(f"✅ Successfully exported {len(qualificacoes)} qualificacoes")
            print(f"📁 Output file: {output_path}")
            print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error exporting qualificacoes: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


def import_qualificacoes_from_json(input_file: str):
    """Import qualificacoes from JSON file to database.

    Args:
        input_file: Path to the input JSON file
    """
    print("🔍 Connecting to database...")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    # Check if file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: File not found: {input_file}")
        sys.exit(1)

    try:
        # Read JSON file
        print(f"📖 Reading JSON file: {input_file}")
        with open(input_file, encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            print("❌ Error: JSON file must contain an array of qualificacoes")
            sys.exit(1)

        print(f"📊 Found {len(data)} qualificacoes in JSON file")
        print("-" * 60)

        with Session(engine) as session:
            created_count = 0
            updated_count = 0
            error_count = 0
            errors = []
            data.sort(key=lambda x: x["id"])
            for idx, item in enumerate(data, start=1):
                try:
                    # Validate required fields
                    if not all(key in item for key in ["nome", "validade", "tipo_aplicavel", "grupo"]):
                        error_msg = f"Item {idx}: Missing required fields (nome, validade, tipo_aplicavel, grupo)"
                        errors.append(error_msg)
                        error_count += 1
                        print(f"❌ {error_msg}")
                        continue

                    # Validate and convert enum values
                    try:
                        tipo_enum = TipoTripulante(item["tipo_aplicavel"])
                    except ValueError:
                        error_msg = f"Item {idx}: Invalid tipo_aplicavel: {item['tipo_aplicavel']}"
                        errors.append(error_msg)
                        error_count += 1
                        print(f"❌ {error_msg}")
                        continue

                    try:
                        grupo_enum = GrupoQualificacoes(item["grupo"])
                    except ValueError:
                        error_msg = f"Item {idx}: Invalid grupo: {item['grupo']}"
                        errors.append(error_msg)
                        error_count += 1
                        print(f"❌ {error_msg}")
                        continue

                    # Validate validade is a positive integer
                    if not isinstance(item["validade"], int) or item["validade"] <= 0:
                        error_msg = f"Item {idx}: validade must be a positive integer"
                        errors.append(error_msg)
                        error_count += 1
                        print(f"❌ {error_msg}")
                        continue

                    # Check if qualificacao exists (by ID if provided, or by nome)
                    qualificacao = None
                    if "id" in item and item["id"]:
                        qualificacao = session.get(Qualificacao, item["id"])
                    # if not qualificacao:
                    #     # Try to find by nome
                    #     stmt = select(Qualificacao).where(Qualificacao.nome == item["nome"])
                    #     qualificacao = session.execute(stmt).scalar_one_or_none()

                    if qualificacao:
                        print(f"There is already a qualification with id: {item['id']}: {qualificacao}")
                        continue
                    #     # Update existing
                    #     qualificacao.nome = item["nome"]
                    #     qualificacao.validade = item["validade"]
                    #     qualificacao.tipo_aplicavel = tipo_enum
                    #     qualificacao.grupo = grupo_enum
                    #     updated_count += 1
                    #     print(f"✓ Updated: {item['nome']} (ID: {qualificacao.id})")
                    # else:

                    # Create new

                    qualificacao = Qualificacao(
                        nome=item["nome"],
                        validade=item["validade"],
                        tipo_aplicavel=tipo_enum,
                        grupo=grupo_enum,
                    )
                    session.add(qualificacao)
                    # session.refresh(qualificacao)
                    print(
                        f"Qualification created with id: {qualificacao.id} and name: {qualificacao.nome} for tipo: {tipo_enum.value} and grupo: {grupo_enum.value}"
                    )
                    created_count += 1
                    print(f"✓ Created: {item['nome']}")

                except Exception as e:
                    error_msg = f"Item {idx} ({item.get('nome', 'unknown')}): {str(e)}"
                    errors.append(error_msg)
                    error_count += 1
                    print(f"❌ {error_msg}")

            # Commit all changes
            session.commit()

            print("\n" + "=" * 60)
            print("📊 Import Summary:")
            print(f"  ✅ Created: {created_count}")
            print(f"  🔄 Updated: {updated_count}")
            print(f"  ❌ Errors: {error_count}")
            print(f"  📁 Total processed: {len(data)}")
            if errors:
                print("\n⚠️  Errors encountered:")
                for error in errors:
                    print(f"    - {error}")
            print("=" * 60)
            print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except json.JSONDecodeError as e:
        print(f"\n❌ Error parsing JSON file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error importing qualificacoes: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


def main():
    """Main function to parse arguments and execute export/import."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Export/Import qualificacoes table to/from JSON file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export database to JSON file
  python export_qualificacoes_to_json.py export --output qualificacoes.json

  # Import JSON file to database
  python export_qualificacoes_to_json.py import --input qualificacoes.json
        """,
    )

    subparsers = parser.add_subparsers(dest="action", help="Action to perform", required=True)

    # Export subcommand
    export_parser = subparsers.add_parser("export", help="Export qualificacoes from database to JSON file")
    export_parser.add_argument(
        "--output",
        type=str,
        default="qualificacoes_export.json",
        help="Output JSON filename (default: qualificacoes_export.json)",
    )

    # Import subcommand
    import_parser = subparsers.add_parser("import", help="Import qualificacoes from JSON file to database")
    import_parser.add_argument(
        "--input",
        type=str,
        required=True,
        help="Input JSON filename",
    )

    args = parser.parse_args()

    if args.action == "export":
        export_qualificacoes_to_json(args.output)
    elif args.action == "import":
        import_qualificacoes_from_json(args.input)


if __name__ == "__main__":
    main()

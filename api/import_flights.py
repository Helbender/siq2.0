import base64
import json
import os
from datetime import UTC, datetime

from sqlalchemy.orm import Session, sessionmaker

from config import engine  # adjust as needed
from models.flights import Flight  # Adjust import as needed
from routes.flight_blueprint import add_crew_and_pilots


def import_flights_from_folder(root_folder: str, db: Session):
    for dirpath, _, filenames in os.walk(root_folder):
        print(f"Processing directory: {dirpath}")
        for filename in filenames:
            print(f"Processing file: {filename}")
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
                print(f"Decoded content as dict: {content_raw}")
                content_dict = content_raw
                # You must adapt this to your actual file format and DB schema
                # Example filename: "1M 50A0023 02Apr2025 03_20 16710.1m"
                parts = filename.split()
                if len(parts) < 5:
                    continue  # skip malformed files
                try:
                    flight = Flight(
                        airtask=content_dict["airtask"],
                        date=datetime.strptime(content_dict["date"], "%Y-%m-%d").replace(tzinfo=UTC).date(),
                        origin=content_dict.get("origin", ""),
                        destination=content_dict.get("destination", ""),
                        departure_time=content_dict.get("ATD", ""),
                        arrival_time=content_dict.get("ATA", ""),
                        flight_type=content_dict.get("flightType", ""),
                        flight_action=content_dict.get("flightAction", ""),
                        tailnumber=content_dict.get("tailNumber", ""),
                        total_time=content_dict.get("ATE", ""),
                        atr=content_dict.get("totalLandings", 0),
                        passengers=content_dict.get("passengers", 0),
                        doe=content_dict.get("doe", 0),
                        cargo=content_dict.get("cargo", 0),
                        number_of_crew=content_dict.get("numberOfCrew", 0),
                        orm=content_dict.get("orm", 0),
                        fuel=content_dict.get("fuel", 0),
                        activation_first=content_dict.get("activationFirst", "__:__"),
                        activation_last=content_dict.get("activationLast", "__:__"),
                        ready_ac=content_dict.get("readyAC", "__:__"),
                        med_arrival=content_dict.get("medArrival", "__:__"),
                    )
                except ValueError:
                    flight = Flight(
                        airtask=content_dict["airtask"],
                        date=datetime.strptime(content_dict["date"], "%d-%b-%Y").replace(tzinfo=UTC).date(),
                        origin=content_dict.get("origin", ""),
                        destination=content_dict.get("destination", ""),
                        departure_time=content_dict.get("ATD", ""),
                        arrival_time=content_dict.get("ATA", ""),
                        flight_type=content_dict.get("flightType", ""),
                        flight_action=content_dict.get("flightAction", ""),
                        tailnumber=content_dict.get("tailNumber", ""),
                        total_time=content_dict.get("ATE", ""),
                        atr=content_dict.get("totalLandings", 0),
                        passengers=content_dict.get("passengers", 0),
                        doe=content_dict.get("doe", 0),
                        cargo=content_dict.get("cargo", 0),
                        number_of_crew=content_dict.get("numberOfCrew", 0),
                        orm=content_dict.get("orm", 0),
                        fuel=content_dict.get("fuel", 0),
                        activation_first=content_dict.get("activationFirst", "__:__"),
                        activation_last=content_dict.get("activationLast", "__:__"),
                        ready_ac=content_dict.get("readyAC", "__:__"),
                        med_arrival=content_dict.get("medArrival", "__:__"),
                    )
                with Session(engine, autoflush=False) as session:
                    session.add(flight)
                    pilot: dict

                    try:
                        content_dict["flight_pilots"]
                    except KeyError:
                        print("At least one pilot is required")
                        continue
                        # return jsonify({"message": "At least one pilot is required"}), 400

                    for pilot in content_dict["flight_pilots"]:
                        add_crew_and_pilots(session, flight, pilot)
                    # try:
                    #     session.flush()
                    # except exc.IntegrityError as e:
                    #     session.rollback()
                    #     print("\n", e.orig.__repr__())
                    #     # return jsonify({"message": e.orig.__repr__()}), 400
                    # else:
                    #     session.commit()
                    #     nome_arquivo_voo = flight.get_file_name()


SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
import_flights_from_folder("/home/tiago/Projects/siq_react_vite.worktrees/DinamicQualification/api/2025", db)

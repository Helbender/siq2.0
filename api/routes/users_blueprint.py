from __future__ import annotations  # noqa: D100, INP001

from config import CREW_USER, PILOT_USER, engine
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import (
    verify_jwt_in_request,
)
from functions.sendemail import hash_code
from models.crew import Crew, QualificationCrew
from models.pilots import Pilot, Qualification
from models.users import User
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

users = Blueprint("users", __name__)


# User ROUTES
# @jwt_required()  # new line
@users.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_user() -> tuple[Response, int]:
    verify_jwt_in_request()

    if request.method == "GET":
        result = []
        # Retrieve all users from db
        with Session(engine) as session:
            for db in [User, Pilot, Crew]:
                stmt = select(db).order_by(db.nip)
                if session.execute(stmt).scalars().all() is not None:
                    result.extend(session.execute(stmt).scalars().all())
            return jsonify([row.to_json() for row in result]), 200

    # Adds new user to db
    if request.method == "POST":
        user = request.get_json()
        with Session(engine) as session:
            if user["position"] in PILOT_USER:
                new_user = Pilot(
                    nip=int(user["nip"]),
                    name=user["name"],
                    rank=user["rank"],
                    position=user["position"],
                    email=user["email"],
                    squadron=user["squadron"],
                    password=hash_code(str(12345)),
                    qualification=Qualification(),
                )
            elif user["position"] in CREW_USER:
                new_user = Crew(
                    nip=int(user["nip"]),
                    name=user["name"],
                    rank=user["rank"],
                    position=user["position"],
                    email=user["email"],
                    squadron=user["squadron"],
                    password=hash_code(str(12345)),
                    qualification=QualificationCrew(),
                )
            else:
                new_user = User(
                    nip=int(user["nip"]),
                    name=user["name"],
                    rank=user["rank"],
                    position=user["position"],
                    email=user["email"],
                    squadron=user["squadron"],
                    password=hash_code(str(12345)),
                )
            session.add(new_user)
            session.commit()
            response = new_user.to_json()
        return jsonify(response), 201
    return jsonify({"message": "Bad Manual Request"}), 403


@users.route("/<nip>/<position>", methods=["DELETE", "PATCH"], strict_slashes=False)
# @jwt_required()  # new line
def modify_user(nip: int, position: str) -> tuple[Response, int]:
    """Placehold."""
    verify_jwt_in_request()

    if position in PILOT_USER:
        db = Pilot
    elif position in CREW_USER:
        db = Crew
    else:
        db = User

    if request.method == "DELETE":
        with Session(engine) as session:
            # result = session.execute(
            #     delete(Qualification).where(Qualification.pilot_id == nip),
            # )
            result = session.execute(delete(db).where(db.nip == nip))

            if result.rowcount == 1:
                session.commit()
                return jsonify({"deleted_id": f"{nip}"}), 200
            else:  # noqa: RET505
                return jsonify({"message": "Failed to delete"}), 304

    if request.method == "PATCH":
        user: dict = request.get_json()
        with Session(engine) as session:
            modified_pilot = session.execute(select(db).where(db.nip == nip)).scalar_one()
            for k, v in user.items():
                if k == "qualification":
                    continue
                print(k, v)
                setattr(modified_pilot, k, v)

            session.commit()
            return jsonify(modified_pilot.to_json()), 200

    return jsonify({"message": "Bad Manual Request"}), 403

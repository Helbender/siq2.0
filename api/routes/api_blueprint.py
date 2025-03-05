from __future__ import annotations  # noqa: D100, INP001

import json
from datetime import datetime, timedelta, timezone

from config import engine
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import create_access_token, unset_jwt_cookies, verify_jwt_in_request
from functions.sendemail import hash_code, main
from models.crew import Crew
from models.pilots import Pilot
from models.users import User
from routes.flight_blueprint import flights
from routes.users_blueprint import users
from sqlalchemy import select, union_all
from sqlalchemy.orm import Session

# Main Blueprint ro register with application
api = Blueprint("api", __name__)

# register user with api blueprint
api.register_blueprint(users, url_prefix="/users")

# register flight blueprints with api blueprint
api.register_blueprint(flights, url_prefix="/flights")


@api.route("/token", methods=["POST"])
def create_token() -> tuple[Response | dict[str, str], int]:
    """Recebe os dados de logins e trata da autorização."""
    login_data: dict = request.get_json()
    nip: int = login_data["nip"]
    password: str = login_data["password"]
    print(login_data)
    with Session(engine) as session:
        if nip == "admin" and password == "admin":
            stmt = union_all(
                select(Pilot),
                select(Crew),
                select(User),
            )
            stmt2 = select(Pilot, Crew, User).from_statement(stmt)
            tripulante: Pilot | Crew | User = session.execute(stmt2).first()  # type: ignore  # noqa: PGH003
            if tripulante is None:
                access_token = create_access_token(
                    identity=nip,
                )
                response = {"access_token": access_token}
                return response, 201
            return {"message": "Can not login as admin. Db already populated"}, 401

        stmt = union_all(
            select(Pilot).where(Pilot.nip == nip),
            select(Crew).where(Crew.nip == nip),
            select(User).where(User.nip == nip),
        )

        stmt2 = select(Pilot, Crew, User).from_statement(stmt)
        tripulante: Pilot | Crew | User = session.execute(stmt2).scalar_one_or_none()  # type: ignore  # noqa: PGH003

        if tripulante is not None:
            if hash_code(password) != tripulante.password:
                print("Wrong Password")
                return {"message": "Wrong password"}, 401

            access_token = create_access_token(
                identity=nip,
                additional_claims={"admin": tripulante.admin, "name": tripulante.name},
            )
            response = {"access_token": access_token}
            return response, 201

        return {"message": f"No user with the NIP {nip}"}, 404

    return {"message": "Something went wrong in the server"}, 500


@api.route("/logout", methods=["POST"])
def logout() -> tuple[Response, int]:
    """Clear the login token on server side."""
    response = jsonify({"msg": "logout sucessful"})
    unset_jwt_cookies(response)
    return response, 200


@api.route("/recovery", methods=["POST"])
def recover_process() -> tuple[Response, int]:
    """Check token validity."""
    recover_info: dict = request.get_json()

    email = recover_info["email"]
    token = recover_info["token"]
    with Session(engine) as session:
        stmt = union_all(
            select(Pilot).where(Pilot.email == email),
            select(Crew).where(Crew.email == email),
            select(User).where(User.email == email),
        )

        stmt2 = select(Pilot, Crew, User).from_statement(stmt)
        tripulante: Pilot | Crew | User = session.execute(stmt2).scalar_one()
        print(tripulante)
        try:
            recover_data = json.loads(tripulante.recover)
        except json.JSONDecodeError:
            return jsonify({"message": "Token already was used"}), 403

        if token == recover_data["token"]:
            now = datetime.now(timezone.utc)
            token_timestamp = datetime.fromisoformat(recover_data["timestamp"])
            exp_timestamp = now + timedelta(hours=12)
            if exp_timestamp > token_timestamp:
                tripulante.recover = ""
                session.commit()
                return jsonify({"message": "Token Valid", "nip": tripulante.nip}), 200

    return jsonify({"message": "Token Expired"}), 408


@api.route("/recover/<email>", methods=["POST"])
def recover_pass(email: str) -> tuple[Response, int]:
    """Receive the email information and send a link to the user email to restore the password."""
    with Session(engine) as session:
        stmt = union_all(
            select(Pilot).where(Pilot.email == email),
            select(Crew).where(Crew.email == email),
            select(User).where(User.email == email),
        )

        stmt2 = select(Pilot, Crew, User).from_statement(stmt)
        tripulante = session.execute(stmt2).scalar_one_or_none()
        if tripulante is None:
            return jsonify({"message": "User not found"}), 404
        json_data = main(email)
        tripulante.recover = json_data
        print(f"\nTripulante Recover to commit: {tripulante.recover}")
        session.commit()
        return jsonify({"message": "Recovery email sent"}), 200


@api.route("/storenewpass/<nip>", methods=["PATCH"])
def store_new_passord(nip: int) -> tuple[Response, int]:
    """Update the database with the new password."""
    if request.method == "PATCH":
        user: dict = request.get_json()
        if user["password"] == "":
            return jsonify({"msg": "Password can not be empty"}), 403
        with Session(engine) as session:
            stmt = union_all(
                select(Pilot).where(Pilot.nip == nip),
                select(Crew).where(Crew.nip == nip),
                select(User).where(User.nip == nip),
            )

            stmt2 = select(Pilot, Crew, User).from_statement(stmt)
            modified_user: Pilot | Crew | User = session.execute(stmt2).scalar_one()
            modified_user.password = hash_code(user["password"])
            modified_user.recover = ""
            session.commit()
            return jsonify(modified_user.to_json()), 200
    return jsonify({"message": "Internal Error"}), 500


@api.route("/pilots/<position>", methods=["GET"])
def retrieve_pilots(position: str) -> tuple[Response, int]:
    """Placehold."""
    verify_jwt_in_request()
    if position in ["PC", "PI"]:
        stmt = union_all(
            select(Pilot).where(Pilot.position == "PC"),
            select(Pilot).where(Pilot.position == "PI"),
        ).order_by(Pilot.nip.asc())
    else:
        stmt = union_all(
            select(Pilot).where(Pilot.position == "CP"),
            select(Pilot).where(Pilot.position == "P"),
            select(Pilot).where(Pilot.position == "PA"),
        ).order_by(Pilot.nip.asc())
    if request.method == "GET":
        # Retrieve all pilots from db
        with Session(engine) as session:
            stmt2 = select(Pilot).from_statement(stmt)
            result = session.execute(stmt2).scalars().all()
            return jsonify([row.to_json(qualification_data=True) for row in result]), 200

    return jsonify({"message": "Bad Manual Request"}), 403


@api.route("/crew", methods=["GET"])
def retrieve_crew() -> tuple[Response, int]:
    """Placehold."""
    verify_jwt_in_request()
    if request.method == "GET":
        # Retrieve all crew from db
        with Session(engine) as session:
            stmt = select(Crew).order_by(Crew.nip)
            result = session.execute(stmt).scalars().all()
            return jsonify([row.to_json(qualification_data=True) for row in result]), 200

    return jsonify({"message": "Bad Manual Request"}), 403

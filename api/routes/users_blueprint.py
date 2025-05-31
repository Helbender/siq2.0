from __future__ import annotations

import json

from config import CREW_USER, PILOT_USER, engine  # type: ignore
from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from functions.gdrive import ID_PASTA_VOO, enviar_json_para_pasta
from functions.sendemail import hash_code  # type: ignore
from models.crew import Crew, QualificationCrew  # type: ignore
from models.pilots import Pilot, Qualification  # type: ignore
from models.users import User  # type: ignore
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session

users = Blueprint("users", __name__)


# User ROUTES
@users.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_user() -> tuple[Response, int]:
    if request.method == "GET":
        print("Getting users")
        result: list = []
        # Retrieve all users from db
        with Session(engine) as session:
            for db in [User, Pilot, Crew]:
                stmt = select(db).order_by(db.nip)
                if session.execute(stmt).scalars().all() is not None:
                    result.extend(session.execute(stmt).scalars().all())
            ordered_list: list = sorted([row.to_json() for row in result], key=lambda x: x["nip"])
            return jsonify(ordered_list), 200

    # Adds new user to db
    if request.method == "POST":
        # verify_jwt_in_request()
        user = request.get_json()
        print(user)
        with Session(engine) as session:
            if user["position"] in PILOT_USER:
                new_user = Pilot(
                    nip=int(user["nip"]),
                    name=user["name"],
                    rank=user["rank"],
                    position=user["position"],
                    email=user["email"],
                    admin=user["admin"],
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
                    admin=user["admin"],
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
                    admin=user["admin"],
                    squadron=user["squadron"],
                    password=hash_code(str(12345)),
                )
            session.add(new_user)
            session.commit()
            response = new_user.to_json()
        return jsonify(response), 201
    return jsonify({"message": "Bad Manual Request"}), 403


@users.route("/<nip>/<position>", methods=["DELETE", "PATCH"], strict_slashes=False)
def modify_user(nip: int, position: str) -> tuple[Response, int]:
    """Placehold."""
    verify_jwt_in_request()

    if request.method == "DELETE":
        with Session(engine) as session:
            for db in [Pilot, Crew, User]:
                result = session.execute(delete(db).where(db.nip == nip))

                if result.rowcount == 1:
                    session.commit()

                    return jsonify({"deleted_id": f"{nip}"}), 200
            return jsonify({"message": "Failed to delete"}), 304

    if request.method == "PATCH":
        user: dict = request.get_json()
        db = Pilot, Crew, User
        with Session(engine) as session:
            for model in db:
                try:
                    modified_pilot = session.execute(select(model).where(model.nip == nip)).scalar_one()
                except NoResultFound:
                    continue
            for k, v in user.items():
                if k == "qualification":
                    continue
                # print(k, v)
                setattr(modified_pilot, k, v)
            try:
                session.commit()

            except Exception:
                return jsonify({"message": "You can not change the NIP. Create a new user instead."}), 403
            return jsonify(modified_pilot.to_json()), 200

    return jsonify({"message": "Bad Manual Request"}), 403


# Função que recebe os dados de um ficherio json e adiciona os dados à base de dados
@users.route("/add_users", methods=["POST"], strict_slashes=False)
def add_users() -> tuple[Response, int]:
    """Add users from json file."""
    verify_jwt_in_request()
    if "file" not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Nome de ficheiro vazio"}), 400
    try:
        content = file.read().decode("utf-8")
        data = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Erro ao ler ficheiro JSON: {e!s}"}), 400

    with Session(engine) as session:

        def check_integrity(session):
            try:
                session.commit()
            except IntegrityError as e:
                session.rollback()
                print(e)

        for item in data["pilots"]:
            obj = Pilot(qualification=Qualification())
            for k, v in item.items():
                if k == "qualification":
                    continue
                setattr(obj, k, v)
            obj.password = hash_code("12345")
            session.add(obj)
            check_integrity(session)
            continue
        for item in data["crew"]:
            obj = Crew(qualification=QualificationCrew())
            for k, v in item.items():
                if k == "qualification":
                    continue
                setattr(obj, k, v)
            obj.password = hash_code("12345")
            session.add(obj)
            check_integrity(session)
            continue
        for item in data["users"]:
            obj = User()
            for k, v in item.items():
                if k == "qualification":
                    continue
                setattr(obj, k, v)
            obj.password = hash_code("12345")
            session.add(obj)
            check_integrity(session)
            continue
        session.commit()
    return jsonify({"message": "Users added successfully"}), 201


@users.route("/backup", methods=["GET"], strict_slashes=False)
def backup_users() -> tuple[Response, int]:
    with Session(engine) as session:
        lista = session.execute(select(Pilot)).scalars()
        lista2 = session.execute(select(Crew)).scalars()
        lista3 = session.execute(select(User)).scalars()

        user_base: dict = {"pilots": [], "crew": [], "users": []}
        for a in lista:
            user_base["pilots"].append(a.to_json())

        for b in lista2:
            user_base["crew"].append(b.to_json())
        for c in lista3:
            user_base["users"].append(c.to_json())
    enviar_json_para_pasta(dados=user_base, nome_arquivo="user_base.json", id_pasta=ID_PASTA_VOO)

    return jsonify({"message": "Backup feito com sucesso!"}), 200

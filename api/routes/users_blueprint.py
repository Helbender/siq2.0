from __future__ import annotations

import json

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy import delete, exc, select
from sqlalchemy.exc import (
    IntegrityError,  # type: ignore
    NoResultFound,
)
from sqlalchemy.orm import Session

from config import engine  # type: ignore
from functions.gdrive import ID_PASTA_VOO, enviar_json_para_pasta  # type: ignore
from functions.sendemail import hash_code  # type: ignore
from models.tripulantes import Tripulante  # type: ignore

users = Blueprint("users", __name__)


# User ROUTES
@users.route("/", methods=["GET", "POST"], strict_slashes=False)
def retrieve_user() -> tuple[Response, int]:
    if request.method == "GET":
        with Session(engine) as session:
            tripulantes_obj = session.execute(select(Tripulante)).scalars().all()

            tripulantes: list[dict] = [
                {
                    "nip": t.nip,
                    "name": t.name,
                    "tipo": t.tipo.value,
                    "rank": t.rank,
                    "position": t.position,
                    "email": t.email,
                    "admin": t.admin,
                }
                for t in tripulantes_obj
            ]
        # print(tripulantes)
        return jsonify(tripulantes), 201

    # Adds new user to db
    if request.method == "POST":
        # verify_jwt_in_request()
        data = request.get_json()
        print(data)
        t = Tripulante(
            name=data["name"],
            nip=data["nip"],
            rank=data["rank"],
            position=data["position"],
            email=data["email"],
            admin=bool(data["admin"]),
            password=hash_code(str(12345)),
            tipo=data["tipo"],
        )

        with Session(engine) as session:
            try:
                session.flush()
            except exc.IntegrityError as e:
                session.rollback()
                print("\n", e.orig.__repr__())
            session.add(t)
            session.commit()
            return jsonify({"id": t.nip}), 201
    return jsonify({"message": "Bad Manual Request"}), 403


@users.route("/<nip>", methods=["DELETE", "PATCH"], strict_slashes=False)
def modify_user(nip: int) -> tuple[Response, int]:
    """Placehold."""
    verify_jwt_in_request()

    # db = Tripulante

    if request.method == "DELETE":
        with Session(engine) as session:
            result = session.execute(delete(Tripulante).where(Tripulante.nip == nip))

            if result.rowcount == 1:
                session.commit()

                return jsonify({"deleted_id": f"{nip}"}), 200
        return jsonify({"message": "Failed to delete"}), 304

    if request.method == "PATCH":
        user: dict = request.get_json()
        print(f"User: {user}\n")
        with Session(engine) as session:
            try:
                modified_pilot = session.execute(select(Tripulante).where(Tripulante.nip == nip)).scalar_one()
                for k, v in user.items():
                    print(f"Key: {k}, Value: {v}")
                    if k == "qualification":
                        continue
                    # print(k, v)
                    setattr(modified_pilot, k, v)
            except NoResultFound:
                return jsonify({"message": f"User with NIP {nip} not found"}), 404

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
                print("\nRolling back", e, "\n\n")

        for item in data:
            obj = Tripulante()
            for k, v in item.items():
                if k == "qualificacoes":
                    continue
                if k == "tipo":
                    v = v.upper().replace(" ", "_").replace("Ç", "C").replace("Ã", "A").replace("Õ", "O")
                setattr(obj, k, v)
            obj.password = hash_code("12345")
            # obj.tipo = "PILOTO"
            session.add(obj)
            check_integrity(session)
            continue

    # Para compatibilidade com o formato anterior do ficheiro de backup
    # for item in data["crew"]:
    #     obj = Tripulante()
    #     for k, v in item.items():
    #         print(f"Key: {k}, Value: {v}")
    #         # if k == "qualification":
    #         #     continue
    #         setattr(obj, k, v)
    #     obj.password = hash_code("12345")
    #     # obj.tipo = TipoTripulante.PILOTO
    #     session.add(obj)
    #     check_integrity(session)
    #     continue

    session.commit()
    return jsonify({"message": "Users added successfully"}), 201


@users.route("/backup", methods=["GET"], strict_slashes=False)
def backup_users() -> tuple[Response, int]:
    with Session(engine) as session:
        lista = session.execute(select(Tripulante)).scalars()

        user_base: list = []
        for a in lista:
            user_base.append(a.to_json())

    enviar_json_para_pasta(dados=user_base, nome_arquivo="user_base.json", id_pasta=ID_PASTA_VOO)
    return jsonify({"message": "Backup feito com sucesso!"}), 200


# @users.route("/qualificationlist/<nip>", methods=["GET", "POST"], strict_slashes=False)
# def get_qualifications(nip: int) -> tuple[Response, int]:
#     with Session(engine) as session:
#         for db in [Pilot, Crew]:
#             tripulante: Pilot | Crew = session.execute(select(db).where(db.nip == nip)).scalar_one_or_none()
#             if tripulante is not None:
#                 break
#         match request.method:
#             case "GET":
#                 print(type(tripulante))
#                 print(tripulante)
#                 try:
#                     quallist: list = tripulante.qualification.get_qualification_list()
#                 except Exception as e:
#                     print(e)
#                     return jsonify({"message": str(e)}), 400
#                 # if isinstance(tripulante, Pilot):
#                 #     quallist = quallist[4:]
#                 print(quallist)
#                 return jsonify(quallist), 200

#             case "POST":
#                 data: dict = request.get_json()
#                 nome_qualificação = data["qualification"]
#                 date = datetime.strptime(data["date"], "%Y-%m-%d").replace(tzinfo=UTC).date()
#                 qualification = tripulante.qualification
#                 attr = "last_" + nome_qualificação.lower() + "_date"
#                 print(attr)
#                 print(getattr(qualification, attr))
#                 if getattr(qualification, attr).year == year_init:
#                     setattr(qualification, attr, date)
#                     session.commit()
#                     return jsonify(
#                         {
#                             "message": f"O {tripulante.name} tem agora a qualificação {nome_qualificação} iniciada com a data {date}"
#                         }
#                     ), 200
#                 else:
#                     return jsonify(
#                         {
#                             "message": f"A qualificação {nome_qualificação} já existe com a data {getattr(qualification, attr)}"
#                         }
#                     ), 400

#     return jsonify({"message": "Tripulante não encontrado"}), 404

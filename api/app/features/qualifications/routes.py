"""Qualifications routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy.orm import Session

from config import engine  # type: ignore

from app.features.qualifications.schemas import (
    CheckApplicabilityRequestSchema,
    QualificationCreateSchema,
    QualificationUpdateSchema,
    validate_request,
)
from app.features.qualifications.service import QualificationService

qualifications_bp = Blueprint("qualifications", __name__)
qualification_service = QualificationService()

# Schema instances
qualification_create_schema = QualificationCreateSchema()
qualification_update_schema = QualificationUpdateSchema()
check_applicability_schema = CheckApplicabilityRequestSchema()


@qualifications_bp.route("/qualificacoes", methods=["GET"])
def listar_qualificacoes() -> tuple[Response, int]:
    """List all qualifications."""
    verify_jwt_in_request()
    with Session(engine) as session:
        qualifications = qualification_service.get_all_qualifications(session)
        return jsonify(qualifications), 200


@qualifications_bp.route("/qualificacoes", methods=["POST"])
def criar_qualificacao() -> tuple[Response, int]:
    """Create a new qualification."""
    qualification_data: dict | None = request.get_json()
    if qualification_data is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(qualification_create_schema, qualification_data)
    if errors:
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"error": error_message}), 400

    with Session(engine) as session:
        result = qualification_service.create_qualification(validated_data, session)

        if "id" in result:
            return jsonify(result), 201

        return jsonify(result), 400


@qualifications_bp.route("/qualificacoes/<int:qualification_id>", methods=["PATCH", "DELETE"])
def modify_qualification(qualification_id: int) -> tuple[Response, int]:
    """Update or delete a qualification."""
    if request.method == "DELETE":
        with Session(engine) as session:
            result = qualification_service.delete_qualification(qualification_id, session)

            if "mensagem" in result:
                return jsonify(result), 200

            return jsonify(result), 404

    if request.method == "PATCH":
        qualification_data: dict | None = request.get_json()
        if qualification_data is None:
            return jsonify({"error": "Request body must be JSON"}), 400

        validated_data, errors = validate_request(qualification_update_schema, qualification_data)
        if errors:
            error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
            return jsonify({"error": error_message}), 400

        with Session(engine) as session:
            result = qualification_service.update_qualification(qualification_id, validated_data, session)

            if "id" in result:
                return jsonify(result), 200

            return jsonify(result), 400

    return jsonify({"erro": "Método não permitido"}), 405


@qualifications_bp.route("/tripulantes/qualificacoes/<tipo>", methods=["GET"])
def listar_qualificacoes_tipo(tipo: str) -> tuple[Response, int]:
    """List all tripulantes of a specific type with their qualifications."""
    with Session(engine) as session:
        tripulantes = qualification_service.get_qualifications_for_tripulante_type(tipo, session)
        return jsonify(tripulantes), 200


@qualifications_bp.route("/qualificacoeslist/<int:nip>", methods=["GET"])
def listar_qualificacoes_tripulante(nip: int) -> tuple[Response, int]:
    """Get available qualifications for a specific tripulante."""
    with Session(engine) as session:
        result = qualification_service.get_qualifications_for_tripulante_nip(nip, session)

        if "qualifications" in result:
            return jsonify(result["qualifications"]), 200

        return jsonify(result), 404


@qualifications_bp.route("/listas", methods=["GET"])
def listar_tipos_e_grupos() -> tuple[Response, int]:
    """Get lists of tipos and grupos."""
    result = qualification_service.get_lists()
    return jsonify(result), 200


@qualifications_bp.route("/qualification-groups", methods=["GET"])
def get_qualification_groups() -> tuple[Response, int]:
    """Get all available qualification groups."""
    groups = qualification_service.get_qualification_groups()
    return jsonify(groups), 200


@qualifications_bp.route("/crew-types", methods=["GET"])
def get_crew_types() -> tuple[Response, int]:
    """Get all available crew types."""
    crew_types = qualification_service.get_crew_types()
    return jsonify(crew_types), 200


@qualifications_bp.route("/qualification-groups/<crew_type>", methods=["GET"])
def get_qualification_groups_for_crew(crew_type: str) -> tuple[Response, int]:
    """Get qualification groups applicable to a specific crew type."""
    result = qualification_service.get_qualification_groups_for_crew_type(crew_type)

    if "groups" in result:
        return jsonify(result["groups"]), 200

    return jsonify(result), 400


@qualifications_bp.route("/crew-types-for-group/<group>", methods=["GET"])
def get_crew_types_for_group(group: str) -> tuple[Response, int]:
    """Get crew types that can use a specific qualification group."""
    result = qualification_service.get_crew_types_for_group(group)

    if "crew_types" in result:
        return jsonify(result["crew_types"]), 200

    return jsonify(result), 400


@qualifications_bp.route("/qualification-groups/check", methods=["POST"])
def check_qualification_group_applicability() -> tuple[Response, int]:
    """Check if a qualification group is applicable to a crew type."""
    data: dict | None = request.get_json()
    if data is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    validated_data, errors = validate_request(check_applicability_schema, data)
    if errors:
        error_message = "; ".join([f"{field}: {', '.join(msgs)}" for field, msgs in errors.items()])
        return jsonify({"error": error_message}), 400

    result = qualification_service.check_qualification_group_applicability(
        validated_data["group"], validated_data["crew_type"]
    )

    if "applicable" in result:
        return jsonify(result), 200

    return jsonify(result), 400


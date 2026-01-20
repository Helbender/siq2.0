"""Qualifications routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.qualifications.policies import require_authenticated
from app.features.qualifications.schemas import (
    CheckApplicabilityRequestSchema,
    QualificationCreateSchema,
    QualificationUpdateSchema,
    validate_request,
)
from app.features.qualifications.service import QualificationService
from app.shared.enums import Role
from app.shared.permissions import require_role

qualifications_bp = Blueprint("qualifications", __name__)
qualification_service = QualificationService()

# Schema instances
qualification_create_schema = QualificationCreateSchema()
qualification_update_schema = QualificationUpdateSchema()
check_applicability_schema = CheckApplicabilityRequestSchema()


@qualifications_bp.route("/qualificacoes", methods=["GET"])
def listar_qualificacoes() -> tuple[Response, int]:
    """List all qualifications.

    ---
    tags:
      - Qualifications
    summary: List all qualifications
    description: Retrieve all qualifications from the database
    security:
      - Bearer: []
    responses:
      200:
        description: List of all qualifications
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              nome:
                type: string
              validade:
                type: integer
              tipo_aplicavel:
                type: string
              grupo:
                type: string
    """
    # Check authentication
    auth_error = require_authenticated()
    if auth_error:
        return auth_error

    with Session(engine) as session:
        qualifications = qualification_service.get_all_qualifications(session)
        return jsonify(qualifications), 200


@qualifications_bp.route("/qualificacoes", methods=["POST"])
@require_role(Role.UNIF.level)
def criar_qualificacao() -> tuple[Response, int]:
    """Create a new qualification.

    ---
    tags:
      - Qualifications
    summary: Create a new qualification
    description: Add a new qualification to the database
    parameters:
      - in: body
        name: body
        description: Qualification data
        required: true
        schema:
          type: object
          required:
            - nome
            - validade
            - tipo_aplicavel
            - grupo
          properties:
            nome:
              type: string
              minLength: 1
              example: "Night Qualification"
            validade:
              type: integer
              minimum: 1
              description: Validity period in days
              example: 365
            tipo_aplicavel:
              type: string
              description: Applicable crew type (TipoTripulante enum)
              example: "Piloto"
            grupo:
              type: string
              description: Qualification group (GrupoQualificacoes enum)
              example: "Aviacao"
    responses:
      201:
        description: Qualification created successfully
        schema:
          type: object
          properties:
            id:
              type: integer
              description: Created qualification ID
      400:
        description: Validation error
        schema:
          type: object
          properties:
            error:
              type: string
    """
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
@require_role(Role.UNIF.level)
def modify_qualification(qualification_id: int) -> tuple[Response, int]:
    """Update or delete a qualification.

    ---
    tags:
      - Qualifications
    summary: Update or delete a qualification
    description: |
      PATCH: Update qualification information
      DELETE: Delete a qualification by ID
    parameters:
      - in: path
        name: qualification_id
        type: integer
        required: true
        description: Qualification ID
      - in: body
        name: body
        description: Updated qualification data (for PATCH)
        required: false
        schema:
          type: object
          properties:
            nome:
              type: string
            validade:
              type: integer
            tipo_aplicavel:
              type: string
            grupo:
              type: string
    responses:
      200:
        description: Qualification updated or deleted successfully
        schema:
          type: object
          properties:
            id:
              type: integer
              description: Updated qualification ID (PATCH)
            mensagem:
              type: string
              description: Deletion message (DELETE)
      400:
        description: Validation error
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Qualification not found
        schema:
          type: object
          properties:
            error:
              type: string
      405:
        description: Method not allowed
        schema:
          type: object
          properties:
            erro:
              type: string
    """
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
    """List all tripulantes of a specific type with their qualifications.

    ---
    tags:
      - Qualifications
    summary: List crew members by type with qualifications
    description: Retrieve all crew members of a specific type along with their qualifications
    parameters:
      - in: path
        name: tipo
        type: string
        required: true
        description: Crew type (TipoTripulante enum value)
        example: "Piloto"
    responses:
      200:
        description: List of crew members with qualifications
        schema:
          type: array
          items:
            type: object
            properties:
              nip:
                type: integer
              name:
                type: string
              tipo:
                type: string
              qualifications:
                type: array
                items:
                  type: object
    """
    with Session(engine) as session:
        tripulantes = qualification_service.get_qualifications_for_tripulante_type(tipo, session)
        return jsonify(tripulantes), 200


@qualifications_bp.route("/qualificacoeslist/<int:nip>", methods=["GET"])
def listar_qualificacoes_tripulante(nip: int) -> tuple[Response, int]:
    """Get available qualifications for a specific tripulante.

    ---
    tags:
      - Qualifications
    summary: Get qualifications for a crew member
    description: Retrieve all available qualifications for a specific crew member by NIP
    parameters:
      - in: path
        name: nip
        type: integer
        required: true
        description: Crew member NIP
        example: 123456
    responses:
      200:
        description: List of qualifications for the crew member
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              nome:
                type: string
              validade:
                type: integer
              tipo_aplicavel:
                type: string
              grupo:
                type: string
      404:
        description: Crew member not found
        schema:
          type: object
          properties:
            error:
              type: string
    """
    with Session(engine) as session:
        result = qualification_service.get_qualifications_for_tripulante_nip(nip, session)

        if "qualifications" in result:
            return jsonify(result["qualifications"]), 200

        return jsonify(result), 404


@qualifications_bp.route("/listas", methods=["GET"])
def listar_tipos_e_grupos() -> tuple[Response, int]:
    """Get lists of tipos and grupos.

    ---
    tags:
      - Qualifications
    summary: Get lists of types and groups
    description: Retrieve lists of available crew types (tipos) and qualification groups (grupos)
    responses:
      200:
        description: Lists of tipos and grupos
        schema:
          type: object
          properties:
            tipos:
              type: array
              items:
                type: string
            grupos:
              type: array
              items:
                type: string
    """
    result = qualification_service.get_lists()
    return jsonify(result), 200


@qualifications_bp.route("/qualification-groups", methods=["GET"])
def get_qualification_groups() -> tuple[Response, int]:
    """Get all available qualification groups.

    ---
    tags:
      - Qualifications
    summary: Get all qualification groups
    description: Retrieve all available qualification groups
    responses:
      200:
        description: List of qualification groups
        schema:
          type: array
          items:
            type: string
    """
    groups = qualification_service.get_qualification_groups()
    return jsonify(groups), 200


@qualifications_bp.route("/crew-types", methods=["GET"])
def get_crew_types() -> tuple[Response, int]:
    """Get all available crew types.

    ---
    tags:
      - Qualifications
    summary: Get all crew types
    description: Retrieve all available crew types
    responses:
      200:
        description: List of crew types
        schema:
          type: array
          items:
            type: string
    """
    crew_types = qualification_service.get_crew_types()
    return jsonify(crew_types), 200


@qualifications_bp.route("/qualification-groups/<crew_type>", methods=["GET"])
def get_qualification_groups_for_crew(crew_type: str) -> tuple[Response, int]:
    """Get qualification groups applicable to a specific crew type.

    ---
    tags:
      - Qualifications
    summary: Get qualification groups for crew type
    description: Retrieve all qualification groups that are applicable to a specific crew type
    parameters:
      - in: path
        name: crew_type
        type: string
        required: true
        description: Crew type (TipoTripulante enum value)
        example: "Piloto"
    responses:
      200:
        description: List of applicable qualification groups
        schema:
          type: object
          properties:
            groups:
              type: array
              items:
                type: string
      400:
        description: Invalid request
        schema:
          type: object
          properties:
            error:
              type: string
    """
    result = qualification_service.get_qualification_groups_for_crew_type(crew_type)

    if "groups" in result:
        return jsonify(result["groups"]), 200

    return jsonify(result), 400


@qualifications_bp.route("/crew-types-for-group/<group>", methods=["GET"])
def get_crew_types_for_group(group: str) -> tuple[Response, int]:
    """Get crew types that can use a specific qualification group.

    ---
    tags:
      - Qualifications
    summary: Get crew types for qualification group
    description: Retrieve all crew types that can use a specific qualification group
    parameters:
      - in: path
        name: group
        type: string
        required: true
        description: Qualification group (GrupoQualificacoes enum value)
        example: "Aviacao"
    responses:
      200:
        description: List of applicable crew types
        schema:
          type: object
          properties:
            crew_types:
              type: array
              items:
                type: string
      400:
        description: Invalid request
        schema:
          type: object
          properties:
            error:
              type: string
    """
    result = qualification_service.get_crew_types_for_group(group)

    if "crew_types" in result:
        return jsonify(result["crew_types"]), 200

    return jsonify(result), 400


@qualifications_bp.route("/qualification-groups/check", methods=["POST"])
def check_qualification_group_applicability() -> tuple[Response, int]:
    """Check if a qualification group is applicable to a crew type.

    ---
    tags:
      - Qualifications
    summary: Check qualification group applicability
    description: Verify if a specific qualification group is applicable to a crew type
    parameters:
      - in: body
        name: body
        description: Qualification group and crew type to check
        required: true
        schema:
          type: object
          required:
            - group
            - crew_type
          properties:
            group:
              type: string
              description: Qualification group (GrupoQualificacoes enum value)
              example: "Aviacao"
            crew_type:
              type: string
              description: Crew type (TipoTripulante enum value)
              example: "Piloto"
    responses:
      200:
        description: Applicability check result
        schema:
          type: object
          properties:
            applicable:
              type: boolean
              description: Whether the group is applicable to the crew type
            group:
              type: string
            crew_type:
              type: string
      400:
        description: Validation error or invalid request
        schema:
          type: object
          properties:
            error:
              type: string
    """
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


"""Marshmallow schemas for qualifications request/response validation."""

from marshmallow import Schema, ValidationError, fields, validate

from models.enums import GrupoQualificacoes, TipoTripulante  # type: ignore


class QualificationResponseSchema(Schema):
    """Schema for qualification response."""

    id = fields.Int(required=True, metadata={"description": "Qualification ID"})
    nome = fields.Str(required=True, metadata={"description": "Qualification name"})
    validade = fields.Int(required=True, metadata={"description": "Validity period in days"})
    tipo_aplicavel = fields.Str(required=True, metadata={"description": "Applicable crew type"})
    grupo = fields.Str(required=True, metadata={"description": "Qualification group"})


class QualificationCreateSchema(Schema):
    """Schema for creating a new qualification."""

    nome = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "Qualification name"})
    validade = fields.Int(required=True, validate=validate.Range(min=1), metadata={"description": "Validity period in days"})
    tipo_aplicavel = fields.Str(
        required=True,
        validate=validate.OneOf([t.value for t in TipoTripulante]),
        metadata={"description": "Applicable crew type"},
    )
    grupo = fields.Str(
        required=True,
        validate=validate.OneOf([g.value for g in GrupoQualificacoes]),
        metadata={"description": "Qualification group"},
    )


class QualificationUpdateSchema(Schema):
    """Schema for updating a qualification."""

    nome = fields.Str(validate=validate.Length(min=1), metadata={"description": "Qualification name"})
    validade = fields.Int(validate=validate.Range(min=1), metadata={"description": "Validity period in days"})
    tipo_aplicavel = fields.Str(
        validate=validate.OneOf([t.value for t in TipoTripulante]),
        metadata={"description": "Applicable crew type"},
    )
    grupo = fields.Str(
        validate=validate.OneOf([g.value for g in GrupoQualificacoes]),
        metadata={"description": "Qualification group"},
    )


class QualificationIdResponseSchema(Schema):
    """Schema for qualification ID response."""

    id = fields.Int(metadata={"description": "Created/updated qualification ID"})


class QualificationDeleteResponseSchema(Schema):
    """Schema for delete response."""

    mensagem = fields.Str(metadata={"description": "Success message"})


class QualificationListResponseSchema(Schema):
    """Schema for qualification list response."""

    id = fields.Int(metadata={"description": "Qualification ID"})
    nome = fields.Str(metadata={"description": "Qualification name"})


class ListsResponseSchema(Schema):
    """Schema for tipos and grupos lists response."""

    tipos = fields.List(fields.Str(), metadata={"description": "List of crew types"})
    grupos = fields.List(fields.Str(), metadata={"description": "List of qualification groups"})


class GroupResponseSchema(Schema):
    """Schema for qualification group response."""

    value = fields.Str(metadata={"description": "Group value"})
    name = fields.Str(metadata={"description": "Group name"})


class CrewTypeResponseSchema(Schema):
    """Schema for crew type response."""

    value = fields.Str(metadata={"description": "Crew type value"})
    name = fields.Str(metadata={"description": "Crew type name"})


class CheckApplicabilityRequestSchema(Schema):
    """Schema for checking qualification group applicability."""

    group = fields.Str(
        required=True,
        validate=validate.OneOf([g.value for g in GrupoQualificacoes]),
        metadata={"description": "Qualification group"},
    )
    crew_type = fields.Str(
        required=True,
        validate=validate.OneOf([t.value for t in TipoTripulante]),
        metadata={"description": "Crew type"},
    )


class ApplicabilityResponseSchema(Schema):
    """Schema for applicability check response."""

    applicable = fields.Bool(metadata={"description": "Whether group is applicable to crew type"})


def validate_request(schema: Schema, data: dict) -> tuple[dict | None, dict | None]:
    """Validate request data against a schema.

    Args:
        schema: Marshmallow schema instance
        data: Request data dictionary

    Returns:
        tuple of (validated_data, errors_dict)
        If validation passes: (validated_data, None)
        If validation fails: (None, errors_dict)
    """
    try:
        validated = schema.load(data)
        return validated, None
    except ValidationError as err:
        return None, err.messages


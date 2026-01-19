"""Marshmallow schemas for users request/response validation."""

from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.shared.enums import StatusTripulante, TipoTripulante  # type: ignore


class UserResponseSchema(Schema):
    """Schema for user response."""

    nip = fields.Int(required=True, metadata={"description": "User NIP"})
    name = fields.Str(required=True, metadata={"description": "User name"})
    tipo = fields.Str(metadata={"description": "User type (crew type)"})
    rank = fields.Str(allow_none=True, metadata={"description": "User rank"})
    position = fields.Str(allow_none=True, metadata={"description": "User position"})
    email = fields.Email(allow_none=True, metadata={"description": "User email"})
    admin = fields.Bool(metadata={"description": "Whether user is admin"})
    status = fields.Str(metadata={"description": "User status"})


class UserCreateSchema(Schema):
    """Schema for creating a new user."""

    nip = fields.Int(required=True, metadata={"description": "User NIP"})
    name = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "User name"})
    tipo = fields.Raw(required=True, metadata={"description": "User type (TipoTripulante enum or string)"})
    rank = fields.Str(allow_none=True, metadata={"description": "User rank"})
    position = fields.Str(allow_none=True, metadata={"description": "User position"})
    email = fields.Email(allow_none=True, metadata={"description": "User email"})
    admin = fields.Bool(load_default=False, metadata={"description": "Whether user is admin"})
    status = fields.Str(
        load_default="Presente",
        validate=validate.OneOf([s.value for s in StatusTripulante]),
        metadata={"description": "User status"},
    )

    @validates_schema
    def validate_tipo(self, data, **kwargs):
        """Validate tipo field."""
        tipo = data.get("tipo")
        if tipo is None:
            return

        # Allow both enum and string values
        if isinstance(tipo, str):
            try:
                # Try to match by value
                TipoTripulante(tipo)
            except ValueError:
                # Try normalized version
                normalized = tipo.upper().replace(" ", "_").replace("Ç", "C").replace("Ã", "A").replace("Õ", "O")
                try:
                    TipoTripulante(normalized)
                except ValueError:
                    raise ValidationError(f"Invalid tipo value: {tipo}")


class UserUpdateSchema(Schema):
    """Schema for updating a user."""

    name = fields.Str(validate=validate.Length(min=1), metadata={"description": "User name"})
    tipo = fields.Raw(metadata={"description": "User type (TipoTripulante enum or string)"})
    rank = fields.Str(allow_none=True, metadata={"description": "User rank"})
    position = fields.Str(allow_none=True, metadata={"description": "User position"})
    email = fields.Email(allow_none=True, metadata={"description": "User email"})
    admin = fields.Bool(metadata={"description": "Whether user is admin"})
    status = fields.Str(
        validate=validate.OneOf([s.value for s in StatusTripulante]),
        metadata={"description": "User status"},
    )

    @validates_schema
    def validate_tipo(self, data, **kwargs):
        """Validate tipo field if present."""
        tipo = data.get("tipo")
        if tipo is None:
            return

        if isinstance(tipo, str):
            try:
                TipoTripulante(tipo)
            except ValueError:
                normalized = tipo.upper().replace(" ", "_").replace("Ç", "C").replace("Ã", "A").replace("Õ", "O")
                try:
                    TipoTripulante(normalized)
                except ValueError:
                    raise ValidationError(f"Invalid tipo value: {tipo}")


class BulkUserCreateSchema(Schema):
    """Schema for bulk user creation from JSON file."""

    users = fields.List(
        fields.Dict(),
        required=True,
        metadata={"description": "List of user dictionaries to create"},
    )


class UserIdResponseSchema(Schema):
    """Schema for user ID response."""

    id = fields.Int(metadata={"description": "Created user NIP"})


class DeleteResponseSchema(Schema):
    """Schema for delete response."""

    deleted_id = fields.Str(metadata={"description": "Deleted user NIP"})
    message = fields.Str(metadata={"description": "Error message"})


class BackupResponseSchema(Schema):
    """Schema for backup response."""

    message = fields.Str(required=True, metadata={"description": "Status message"})


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


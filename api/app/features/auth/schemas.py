"""Marshmallow schemas for authentication request/response validation."""

from marshmallow import Schema, ValidationError, fields, validate


class LoginRequestSchema(Schema):
    """Schema for login request validation."""

    nip = fields.Raw(required=True, metadata={"description": "User NIP (can be int or 'admin' string)"})
    password = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "User password"})


class TokenResponseSchema(Schema):
    """Schema for token response."""

    access_token = fields.Str(metadata={"description": "JWT access token"})
    message = fields.Str(metadata={"description": "Error message"})


class RecoveryRequestSchema(Schema):
    """Schema for password recovery token validation request."""

    email = fields.Email(required=True, metadata={"description": "User email address"})
    token = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "Recovery token"})


class RecoveryResponseSchema(Schema):
    """Schema for recovery response."""

    message = fields.Str(required=True, metadata={"description": "Status message"})
    nip = fields.Int(metadata={"description": "User NIP (present if token is valid)"})


class PasswordUpdateRequestSchema(Schema):
    """Schema for password update request."""

    password = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "New password"})


class PasswordUpdateResponseSchema(Schema):
    """Schema for password update response."""

    message = fields.Str(metadata={"description": "Error message"})
    # If successful, returns user JSON object (dict-like structure)


class ForgotPasswordRequestSchema(Schema):
    """Schema for forgot password request validation."""

    email = fields.Email(required=True, metadata={"description": "User email address"})


class ResetPasswordRequestSchema(Schema):
    """Schema for reset password request validation."""

    token = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "Reset token"})
    password = fields.Str(required=True, validate=validate.Length(min=1), metadata={"description": "New password"})


def validate_request(schema: Schema, data: dict) -> tuple[dict | None, dict[str, list[str]] | None]:
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
        # Convert ValidationError.messages to dict[str, list[str]] format
        errors: dict[str, list[str]] = {}
        if isinstance(err.messages, dict):
            for key, value in err.messages.items():
                if isinstance(value, list):
                    errors[key] = [str(v) for v in value]
                else:
                    errors[key] = [str(value)]
        return None, errors

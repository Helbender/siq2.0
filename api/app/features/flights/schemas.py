"""Marshmallow schemas for flights request/response validation."""

from marshmallow import EXCLUDE, Schema, ValidationError, fields, pre_load, validate


def _coerce_optional_int(value: object) -> int | None:
    """Coerce empty string, numeric string, or number to int or None."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value) if value == int(value) else None
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        try:
            return int(float(s))
        except (ValueError, TypeError):
            return None
    return None


class FlightPilotSchema(Schema):
    """Schema for flight pilot data. Unknown fields from frontend are ignored."""

    class Meta:
        unknown = EXCLUDE

    nip = fields.Int(required=True, metadata={"description": "Pilot NIP"})
    name = fields.Str(metadata={"description": "Pilot name"})
    position = fields.Str(metadata={"description": "Pilot position"})
    ATR = fields.Int(allow_none=True, metadata={"description": "Day landings"})
    ATN = fields.Int(allow_none=True, metadata={"description": "Night landings"})
    precapp = fields.Int(allow_none=True, metadata={"description": "Precision approach landings"})
    nprecapp = fields.Int(allow_none=True, metadata={"description": "Non-precision approach landings"})
    QUAL1 = fields.Raw(allow_none=True, metadata={"description": "Qualification 1"})
    QUAL2 = fields.Raw(allow_none=True, metadata={"description": "Qualification 2"})
    QUAL3 = fields.Raw(allow_none=True, metadata={"description": "Qualification 3"})
    QUAL4 = fields.Raw(allow_none=True, metadata={"description": "Qualification 4"})
    QUAL5 = fields.Raw(allow_none=True, metadata={"description": "Qualification 5"})
    QUAL6 = fields.Raw(allow_none=True, metadata={"description": "Qualification 6"})
    CON = fields.Raw(allow_none=True, metadata={"description": "CON"})
    VIR = fields.Raw(allow_none=True, metadata={"description": "VIR"})
    VN = fields.Raw(allow_none=True, metadata={"description": "VN"})
    rank = fields.Raw(allow_none=True, metadata={"description": "Pilot rank"})

    @pre_load
    def coerce_optional_ints(self, data: dict, **kwargs: object) -> dict:
        out = dict(data)
        for key in ("ATR", "ATN", "precapp", "nprecapp"):
            if key in out:
                out[key] = _coerce_optional_int(out[key])
        return out


class FlightCreateSchema(Schema):
    """Schema for creating a new flight. Unknown fields from frontend are ignored."""

    class Meta:
        unknown = EXCLUDE

    airtask = fields.Str(required=True, validate=validate.Length(min=1, max=7), metadata={"description": "Flight airtask"})
    date = fields.Str(required=True, validate=validate.Regexp(r"^\d{4}-\d{2}-\d{2}$"), metadata={"description": "Flight date (YYYY-MM-DD)"})
    origin = fields.Str(allow_none=True, validate=validate.Length(max=4), metadata={"description": "Origin airport code"})
    destination = fields.Str(allow_none=True, validate=validate.Length(max=4), metadata={"description": "Destination airport code"})
    ATD = fields.Str(allow_none=True, metadata={"description": "Actual time of departure (HH:MM)"})
    ATA = fields.Str(allow_none=True, metadata={"description": "Actual time of arrival (HH:MM)"})
    ATE = fields.Str(allow_none=True, metadata={"description": "Actual time en route (HH:MM)"})
    flightType = fields.Str(allow_none=True, metadata={"description": "Flight type"})
    flightAction = fields.Str(allow_none=True, metadata={"description": "Flight action"})
    tailNumber = fields.Raw(allow_none=True, metadata={"description": "Aircraft tail number"})
    totalLandings = fields.Int(load_default=0, metadata={"description": "Total landings"})
    passengers = fields.Int(load_default=0, metadata={"description": "Number of passengers"})
    doe = fields.Int(load_default=0, metadata={"description": "DOE"})
    cargo = fields.Int(load_default=0, metadata={"description": "Cargo"})
    numberOfCrew = fields.Int(load_default=0, metadata={"description": "Number of crew"})
    orm = fields.Int(load_default=0, metadata={"description": "ORM"})
    fuel = fields.Int(load_default=0, metadata={"description": "Fuel"})
    activationFirst = fields.Str(load_default="__:__", metadata={"description": "First activation time"})
    activationLast = fields.Str(load_default="__:__", metadata={"description": "Last activation time"})
    readyAC = fields.Str(load_default="__:__", metadata={"description": "Aircraft ready time"})
    medArrival = fields.Str(load_default="__:__", metadata={"description": "Medical arrival time"})
    flight_pilots = fields.List(
        fields.Nested(FlightPilotSchema),
        required=True,
        validate=validate.Length(min=1),
        metadata={"description": "List of pilots/crew on the flight"},
    )


class FlightUpdateSchema(Schema):
    """Schema for updating a flight. Unknown fields from frontend are ignored."""

    class Meta:
        unknown = EXCLUDE

    # Aceite no body (frontend envia); qual voo editar vem da URL (flight_id), não daqui
    id = fields.Raw(allow_none=True, load_default=None, metadata={"description": "Flight ID (opcional; o voo a editar é o da URL)"})
    airtask = fields.Str(validate=validate.Length(min=1, max=7), metadata={"description": "Flight airtask"})
    date = fields.Str(validate=validate.Regexp(r"^\d{4}-\d{2}-\d{2}$"), metadata={"description": "Flight date (YYYY-MM-DD)"})
    origin = fields.Str(allow_none=True, validate=validate.Length(max=4), metadata={"description": "Origin airport code"})
    destination = fields.Str(allow_none=True, validate=validate.Length(max=4), metadata={"description": "Destination airport code"})
    ATD = fields.Str(allow_none=True, metadata={"description": "Actual time of departure (HH:MM)"})
    ATA = fields.Str(allow_none=True, metadata={"description": "Actual time of arrival (HH:MM)"})
    ATE = fields.Str(allow_none=True, metadata={"description": "Actual time en route (HH:MM)"})
    flightType = fields.Str(allow_none=True, metadata={"description": "Flight type"})
    flightAction = fields.Str(allow_none=True, metadata={"description": "Flight action"})
    tailNumber = fields.Raw(allow_none=True, metadata={"description": "Aircraft tail number"})
    totalLandings = fields.Int(metadata={"description": "Total landings"})
    passengers = fields.Int(metadata={"description": "Number of passengers"})
    doe = fields.Int(metadata={"description": "DOE"})
    cargo = fields.Int(metadata={"description": "Cargo"})
    numberOfCrew = fields.Int(metadata={"description": "Number of crew"})
    orm = fields.Int(metadata={"description": "ORM"})
    fuel = fields.Int(metadata={"description": "Fuel"})
    activationFirst = fields.Str(metadata={"description": "First activation time"})
    activationLast = fields.Str(metadata={"description": "Last activation time"})
    readyAC = fields.Str(metadata={"description": "Aircraft ready time"})
    medArrival = fields.Str(metadata={"description": "Medical arrival time"})
    flight_pilots = fields.List(
        fields.Nested(FlightPilotSchema),
        validate=validate.Length(min=1),
        metadata={"description": "List of pilots/crew on the flight"},
    )


class FlightResponseSchema(Schema):
    """Schema for flight response."""

    id = fields.Int(metadata={"description": "Flight ID"})
    airtask = fields.Str(metadata={"description": "Flight airtask"})
    date = fields.Str(metadata={"description": "Flight date"})
    origin = fields.Str(metadata={"description": "Origin airport"})
    destination = fields.Str(metadata={"description": "Destination airport"})
    ATD = fields.Str(metadata={"description": "Departure time"})
    ATA = fields.Str(metadata={"description": "Arrival time"})
    ATE = fields.Str(metadata={"description": "Time en route"})
    flightType = fields.Str(metadata={"description": "Flight type"})
    flightAction = fields.Str(metadata={"description": "Flight action"})
    tailNumber = fields.Raw(metadata={"description": "Tail number"})
    totalLandings = fields.Int(metadata={"description": "Total landings"})
    passengers = fields.Int(metadata={"description": "Passengers"})
    doe = fields.Int(metadata={"description": "DOE"})
    cargo = fields.Int(metadata={"description": "Cargo"})
    numberOfCrew = fields.Int(metadata={"description": "Number of crew"})
    orm = fields.Int(metadata={"description": "ORM"})
    fuel = fields.Int(metadata={"description": "Fuel"})
    activationFirst = fields.Str(metadata={"description": "First activation"})
    activationLast = fields.Str(metadata={"description": "Last activation"})
    readyAC = fields.Str(metadata={"description": "Aircraft ready"})
    medArrival = fields.Str(metadata={"description": "Medical arrival"})
    flight_pilots = fields.List(fields.Dict(), metadata={"description": "Flight pilots"})


class ReprocessResponseSchema(Schema):
    """Schema for reprocess qualifications response."""

    message = fields.Str(required=True, metadata={"description": "Status message"})
    total_flights = fields.Int(metadata={"description": "Total flights processed"})
    processed = fields.Int(metadata={"description": "Number of flights processed"})
    errors = fields.Int(metadata={"description": "Number of errors"})
    error_details = fields.List(fields.Str(), metadata={"description": "Error details"})


def _format_field_errors(value: dict | list) -> str:
    """Turn Marshmallow field errors (possibly nested by index) into a single string."""
    if isinstance(value, dict):
        parts = []
        for key, val in value.items():
            if isinstance(val, dict):
                part = _format_field_errors(val)
                parts.append(f"item {key}: {part}" if part else f"item {key}")
            elif isinstance(val, list):
                part = "; ".join(str(m) for m in val)
                parts.append(f"item {key}: {part}" if part else f"item {key}")
            else:
                parts.append(f"item {key}: {val}")
        return "; ".join(parts)
    if isinstance(value, list):
        return "; ".join(str(m) for m in value)
    return str(value)


def format_validation_errors(messages: dict | list) -> str:
    """Convert Marshmallow validation error dict (or list) to a single human-readable string."""
    if isinstance(messages, list):
        return "; ".join(str(m) for m in messages)
    parts = []
    for field, msgs in messages.items():
        if isinstance(msgs, dict):
            parts.append(f"{field}: {_format_field_errors(msgs)}")
        elif isinstance(msgs, list):
            parts.append(f"{field}: {', '.join(str(m) for m in msgs)}")
        else:
            parts.append(f"{field}: {msgs}")
    return "; ".join(parts)


def validate_request(schema: Schema, data: dict) -> tuple[dict | None, dict | list | None]:
    """Validate request data against a schema.

    Args:
        schema: Marshmallow schema instance
        data: Request data dictionary

    Returns:
        tuple of (validated_data, errors)
        If validation passes: (validated_data, None)
        If validation fails: (None, errors dict or list from Marshmallow)
    """
    try:
        validated = schema.load(data)
        return validated, None
    except ValidationError as err:
        return None, err.messages


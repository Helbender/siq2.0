"""Marshmallow schemas for database management request/response validation."""

from marshmallow import Schema, fields


class YearStatsResponseSchema(Schema):
    """Schema for year statistics response."""

    year = fields.Int(required=True, metadata={"description": "Year"})
    flight_count = fields.Int(required=True, metadata={"description": "Number of flights in this year"})


class DeleteYearResponseSchema(Schema):
    """Schema for delete year response."""

    message = fields.Str(required=True, metadata={"description": "Status message"})
    year = fields.Int(required=True, metadata={"description": "Year that was deleted"})
    deleted_count = fields.Int(required=True, metadata={"description": "Number of flights deleted"})

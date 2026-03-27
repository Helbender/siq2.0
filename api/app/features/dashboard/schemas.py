"""Marshmallow schemas for dashboard request/response validation."""

from marshmallow import Schema, fields


class StatisticsResponseSchema(Schema):
    """Schema for flight statistics response."""

    total_flights = fields.Int(metadata={"description": "Total number of flights"})
    total_hours = fields.Float(metadata={"description": "Total flight hours"})
    hours_by_type = fields.List(fields.Dict(), metadata={"description": "Hours grouped by flight type"})
    hours_by_action = fields.List(fields.Dict(), metadata={"description": "Hours grouped by flight action"})
    total_passengers = fields.Int(metadata={"description": "Total passengers"})
    total_doe = fields.Int(metadata={"description": "Total DOE"})
    total_cargo = fields.Int(metadata={"description": "Total cargo"})
    top_pilots_by_type = fields.Dict(metadata={"description": "Top pilot for each crew type"})


class AvailableYearsResponseSchema(Schema):
    """Schema for available years response."""

    years = fields.List(fields.Int(), metadata={"description": "List of years with flights"})


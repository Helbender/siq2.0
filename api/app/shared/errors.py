"""Shared error handlers and custom exceptions."""

from flask import jsonify
from werkzeug.exceptions import HTTPException


class ValidationError(Exception):
    """Custom validation error exception."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def register_error_handlers(app):
    """Register error handlers for the Flask application.

    Args:
        app: Flask application instance
    """
    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        """Handle validation errors."""
        response = jsonify({"message": error.message})
        response.status_code = error.status_code
        return response

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        """Handle HTTP exceptions."""
        response = jsonify({"message": error.description})
        response.status_code = error.code
        return response

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle internal server errors."""
        response = jsonify({"message": "Internal server error"})
        response.status_code = 500
        return response


"""Health check endpoint."""

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint.

    ---
    tags:
      - Health
    summary: Health check
    description: Check if the API is running
    responses:
      200:
        description: API is healthy
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
    """
    return jsonify({"status": "ok"}), 200


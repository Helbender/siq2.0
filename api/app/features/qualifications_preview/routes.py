"""Qualifications preview routes - thin request/response handlers."""

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.orm import Session

from app.core.config import engine
from app.features.qualifications_preview.constants import PREVIEW_DAYS
from app.features.qualifications_preview.service import QualificationsPreviewService
from app.shared.enums import Role
from app.shared.permissions import require_role

qualifications_preview_bp = Blueprint("qualifications_preview", __name__)
qualifications_preview_service = QualificationsPreviewService()


@qualifications_preview_bp.route("/", methods=["GET"], strict_slashes=False)
@require_role(Role.USER.level)
def get_expiring_by_qualification() -> tuple[Response, int]:
    """Get MQP/MQOBP qualifications expiring within preview_days, grouped by qualification.

    ---
    tags:
      - Qualifications Preview
    summary: Get expiring qualifications by column
    description: |
      Pilots with any qualification in MQP or MQOBP groups that have less than preview_days left.
      Returns one column per qualification; each column lists pilot name and remaining days, sorted by days ascending.
    parameters:
      - in: query
        name: preview_days
        type: integer
        required: false
        description: Include qualifications with remaining_days < this value (default from PREVIEW_DAYS).
    responses:
      200:
        description: Columns of qualification name and pilots with remaining days
    """
    preview_days_arg = request.args.get("preview_days", type=int)
    preview_days = preview_days_arg if preview_days_arg is not None else PREVIEW_DAYS

    with Session(engine) as session:
        data = qualifications_preview_service.get_expiring_by_qualification(
            session, preview_days=preview_days
        )
        return jsonify(data), 200

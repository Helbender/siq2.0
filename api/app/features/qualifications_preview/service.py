"""Qualifications preview service - business logic."""

from datetime import date, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.features.qualifications_preview.constants import PREVIEW_DAYS
from app.features.qualifications_preview.repository import QualificationsPreviewRepository


class QualificationsPreviewService:
    """Service for qualifications preview business logic."""

    def __init__(self) -> None:
        self.repository = QualificationsPreviewRepository()

    def get_expiring_by_qualification(
        self, session: Session, preview_days: int | None = None
    ) -> dict[str, Any]:
        """Get pilots with MQP/MQOBP qualifications expiring within preview_days, grouped by qualification.

        Args:
            session: Database session
            preview_days: Days threshold (default PREVIEW_DAYS). Only qualifications with remaining_days < this are included.

        Returns:
            {"columns": [{"qualification_id": int, "qualification_name": str, "pilots": [{"name": str, "remaining_days": int}]}]}
        """
        days = preview_days if preview_days is not None else PREVIEW_DAYS
        all_tq = self.repository.find_mqp_mqobp_tripulante_qualificacoes_presente(
            session
        )
        today = date.today()

        # qualification_id -> list of { name, remaining_days }
        by_qual: dict[int, list[dict[str, Any]]] = {}
        # qualification_id -> (qualification_name) for header
        qual_names: dict[int, str] = {}

        for tq in all_tq:
            validade = tq.qualificacao.validade
            expiry_date = tq.data_ultima_validacao + timedelta(days=validade)
            remaining_days = (expiry_date - today).days
            if remaining_days >= days:
                continue
            qid = tq.qualificacao_id
            qual_names[qid] = tq.qualificacao.nome
            pilot_display = tq.tripulante.rank or ""
            if pilot_display and tq.tripulante.name:
                pilot_display = f"{pilot_display} {tq.tripulante.name}".strip()
            else:
                pilot_display = tq.tripulante.name or ""
            if qid not in by_qual:
                by_qual[qid] = []
            by_qual[qid].append({"name": pilot_display.strip(), "remaining_days": remaining_days})

        # Sort each list by remaining_days ascending
        for qid in by_qual:
            by_qual[qid].sort(key=lambda x: x["remaining_days"])

        # Build columns in stable order (by qualification_id)
        columns = []
        for qid in sorted(by_qual.keys()):
            columns.append(
                {
                    "qualification_id": qid,
                    "qualification_name": qual_names[qid],
                    "pilots": by_qual[qid],
                }
            )
        return {"columns": columns}

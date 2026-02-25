from __future__ import annotations  # noqa: D100, INP001

from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)
from users import Base


class CrewAndPositions(Base):
    __tablename__ = "crew_and_positions"

    position: Mapped[str] = mapped_column(String(5), unique=True, nullable=False, primary_key=True)
    qualifications: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # noqa: UP007

    def _repr_(self) -> str:
        return f"Position: {self.position}, Qualifications: {self.qualifications}"

    def to_json(self) -> dict:
        return {"position": self.position, "qualifications": self.qualifications}

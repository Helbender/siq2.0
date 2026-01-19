"""Qualification models for the qualifications feature."""

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

from app.shared.models import Base  # type: ignore
from app.shared.enums import GrupoQualificacoes, TipoTripulante

if TYPE_CHECKING:
    from app.features.users.models import TripulanteQualificacao  # type: ignore


class Qualificacao(Base):
    """Qualification model."""

    __tablename__ = "qualificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    grupo: Mapped[GrupoQualificacoes] = mapped_column(
        SQLEnum(GrupoQualificacoes, name="grupoqualificacoes", native_enum=False), nullable=False
    )
    validade: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_aplicavel: Mapped[TipoTripulante] = mapped_column(SQLEnum(TipoTripulante), nullable=False)

    atribuicoes: Mapped[list["TripulanteQualificacao"]] = relationship(
        back_populates="qualificacao", cascade="all, delete-orphan"
    )


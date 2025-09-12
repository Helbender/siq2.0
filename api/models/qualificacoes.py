from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

from models.basemodels import Base  # type: ignore
from models.enums import GrupoQualificacoes, TipoTripulante
from models.tripulantes import (  # type: ignore
    TripulanteQualificacao,
)


class Qualificacao(Base):
    __tablename__ = "qualificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    grupo: Mapped[GrupoQualificacoes] = mapped_column(SQLEnum(GrupoQualificacoes), nullable=False)
    validade: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_aplicavel: Mapped[TipoTripulante] = mapped_column(SQLEnum(TipoTripulante), nullable=False)

    atribuicoes: Mapped[list["TripulanteQualificacao"]] = relationship(
        back_populates="qualificacao", cascade="all, delete-orphan"
    )

from datetime import date  # noqa: TCH003
from enum import Enum

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

year_init: int = 2020
date_init: str = f"{year_init}-01-01"


class Base(DeclarativeBase):
    """subclasses will be converted to dataclasses."""


class TipoTripulante(Enum):
    PILOTO = "PILOTO"
    OPERADOR_CABINE = "OPERADOR_CABINE"
    CONTROLADOR_TATICO = "CONTROLADOR_TATICO"
    OPERADOR_VIGILANCIA = "OPERADOR_VIGILANCIA"
    OPERACOES = "OPERAÇÕES"


class GrupoQualificacoes(Enum):
    ALERTA = "ALERTA"
    VIGILANCIA = "VIGILANCIA"
    NVG = "NVG"
    TATICO = "TATICO"
    OUTROS = "OUTROS"


class Tripulante(Base):
    __tablename__ = "tripulantes"

    nip: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rank: Mapped[str] = mapped_column(String(5))
    position: Mapped[str] = mapped_column(String(5))
    email: Mapped[str] = mapped_column(String(50))
    admin: Mapped[bool] = mapped_column(default=False)
    recover: Mapped[str] = mapped_column(String(500), default="")
    squadron: Mapped[str] = mapped_column(String(30), default="")
    password: Mapped[str] = mapped_column(String(150))
    tipo: Mapped[TipoTripulante] = mapped_column(
        SQLEnum(TipoTripulante), nullable=False
    )

    qualificacoes: Mapped[list["TripulanteQualificacao"]] = relationship(
        back_populates="tripulante", cascade="all, delete-orphan"
    )

    def to_json(self):
        response = {}
        for column in self.__table__.columns:
            col_name = column.name
            if col_name in ["qualificacoes", "recover", "password"]:
                continue
            value = getattr(self, col_name)
            if isinstance(value, Enum):
                response[col_name] = value.value
            else:
                response[col_name] = value
        return response


class Qualificacao(Base):
    __tablename__ = "qualificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    grupo: Mapped[GrupoQualificacoes] = mapped_column(
        SQLEnum(GrupoQualificacoes), nullable=False
    )
    validade: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_aplicavel: Mapped[TipoTripulante] = mapped_column(
        SQLEnum(TipoTripulante), nullable=False
    )

    atribuicoes: Mapped[list["TripulanteQualificacao"]] = relationship(
        back_populates="qualificacao", cascade="all, delete-orphan"
    )


class TripulanteQualificacao(Base):
    __tablename__ = "tripulante_qualificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    tripulante_id: Mapped[int] = mapped_column(
        ForeignKey("tripulantes.nip"), nullable=False
    )
    qualificacao_id: Mapped[int] = mapped_column(
        ForeignKey("qualificacoes.id"), nullable=False
    )
    data_ultima_validacao: Mapped[date] = mapped_column(Date, nullable=False)

    tripulante: Mapped["Tripulante"] = relationship(back_populates="qualificacoes")
    qualificacao: Mapped["Qualificacao"] = relationship(back_populates="atribuicoes")

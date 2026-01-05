from datetime import date, timedelta  # noqa: TCH003
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

from models.basemodels import Base  # type: ignore
from models.enums import StatusTripulante, TipoTripulante


class StatusTripulanteType(TypeDecorator):
    """Custom type decorator for StatusTripulante enum to handle value-based matching."""

    impl = String
    cache_ok = True

    def __init__(self, enum_class, length=20, **kwargs):
        self.enum_class = enum_class
        super().__init__(length=length, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        # Match by enum value, not name
        for enum_member in self.enum_class:
            if enum_member.value == value:
                return enum_member
        # If no match found, try direct value match as fallback
        return value


if TYPE_CHECKING:
    from app.features.flights.models import FlightPilots  # type: ignore
    from app.features.qualifications.models import Qualificacao  # type: ignore


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
    tipo: Mapped[TipoTripulante] = mapped_column(SQLEnum(TipoTripulante), nullable=False)
    status: Mapped[StatusTripulante] = mapped_column(
        StatusTripulanteType(StatusTripulante),
        nullable=False,
        default=StatusTripulante.PRESENTE,
    )

    qualificacoes: Mapped[list["TripulanteQualificacao"]] = relationship(
        back_populates="tripulante", cascade="all, delete-orphan"
    )
    flight_pilots: Mapped[list["FlightPilots"]] = relationship(
        back_populates="tripulante", cascade="all, delete-orphan"
    )

    def to_json(self):
        response = {}
        for column in self.__table__.columns:
            col_name = column.name
            if col_name in ["recover", "password"]:
                continue
            value = getattr(self, col_name)
            if isinstance(value, Enum):
                response[col_name] = value.value
            else:
                response[col_name] = value
        # Sort qualificacoes by grupo and nome for consistent ordering
        sorted_quals = sorted(
            self.qualificacoes,
            key=lambda q: (q.qualificacao.grupo.value, q.qualificacao.nome),
        )
        response["qualificacoes"] = [q.to_json() for q in sorted_quals]
        return response


class TripulanteQualificacao(Base):
    __tablename__ = "tripulante_qualificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    tripulante_id: Mapped[int] = mapped_column(ForeignKey("tripulantes.nip"), nullable=False)
    qualificacao_id: Mapped[int] = mapped_column(ForeignKey("qualificacoes.id"), nullable=False)
    data_ultima_validacao: Mapped[date] = mapped_column(Date, nullable=False)

    tripulante: Mapped["Tripulante"] = relationship(back_populates="qualificacoes")
    qualificacao: Mapped["Qualificacao"] = relationship(back_populates="atribuicoes")

    def to_json(self):
        validade = self.qualificacao.validade  # assuming validade is an integer (days) field in Qualificacao
        expiry_date = self.data_ultima_validacao + timedelta(days=validade)
        dias_restantes = (expiry_date - date.today()).days
        return {
            "nome": self.qualificacao.nome,
            "grupo": self.qualificacao.grupo.value,
            "validade_info": [dias_restantes, expiry_date.strftime("%d-%b-%Y"), validade],
        }

from __future__ import annotations  # noqa: D100, INP001

from datetime import date, timedelta
from typing import TYPE_CHECKING, List

from models.users import Base, People, year_init  # type: ignore
from sqlalchemy import ForeignKey
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

if TYPE_CHECKING:
    from flights import FlightCrew  # type: ignore

QUALIFICATIONS = {
    "bsoc": (180, "alerta"),
    "bskit": (180, "alerta"),
    "paras": (180, "diversos"),
    "nvg": (180, "diversos"),
    "carga": (90, "diversos"),
}


class Crew(People, Base):
    __tablename__ = "crew"

    qualification: Mapped[QualificationCrew] = relationship(
        "QualificationCrew",
        back_populates="crew",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    flight_crew: Mapped[List[FlightCrew]] = relationship(
        back_populates="crew",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_json(self, qualification_data: bool = False) -> dict:
        """Return all model data in JSON format."""
        result = super().to_json()
        if qualification_data:
            result["qualification"] = self.qualification.to_json()
        return result

    def is_qualified(self) -> bool:
        """Check if the crew is qualified."""
        return self.qualification.is_qualified()


class QualificationCrew(Base):
    __tablename__ = "qualifications_crew"

    crew_id: Mapped[int] = mapped_column(ForeignKey("crew.nip", ondelete="CASCADE"), primary_key=True)
    crew: Mapped[Crew] = relationship(back_populates="qualification")
    last_bsoc_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_bskit_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1),
        server_default=f"{year_init}-01-01",
    )
    last_paras_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1),
        server_default=f"{year_init}-01-01",
    )
    # bsoc_init: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01")
    # bskit_init: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01")

    def to_json(self) -> list:
        """Return all model data in JSON format."""
        qualist: list = self.get_qualification_list()

        mylist = [{"name": item, "dados": self._get_days(getattr(self, f"last_{item.lower()}_date"))} for item in qualist]
        oldest = min(mylist, key=lambda x: x["dados"][0])
        mylist.append({"name": "oldest", "dados": [oldest["name"], oldest["dados"][1]]})
        return mylist

    def update(self, data: FlightCrew, date: date) -> QualificationCrew:
        """Update with Last qualification date."""
        if data.bsoc and date > self.last_bsoc_date:
            self.last_bsoc_date = date

        return self

    def is_qualified(self) -> bool:
        """Check if the crew is qualified.

        WIP
        """
        return False

    def get_qualification_list(self, init=False) -> list:
        if init:
            return [column.name[:-5] for column in self.__table__.columns if "_init" in column.name]
        return [column.name[5:-5].upper() for column in self.__table__.columns if "_date" in column.name]

    @staticmethod
    def _get_days(data: date) -> list[int | str]:
        today = date.today()  # noqa: DTZ011
        dias = (data - today + timedelta(days=180)).days
        expire = (data + timedelta(days=180)).strftime("%d-%b-%Y")
        return [dias, expire]

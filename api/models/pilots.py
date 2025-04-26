from __future__ import annotations  # noqa: D100, INP001

from datetime import date, timedelta
from typing import TYPE_CHECKING, List

from models.users import Base, People, year_init, date_init  # type: ignore
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


if TYPE_CHECKING:
    from flights import FlightPilots  # type: ignore


class Pilot(People, Base):
    __tablename__ = "pilots"

    qualification: Mapped[Qualification] = relationship(
        "Qualification",
        back_populates="pilot",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    flight_pilots: Mapped[List[FlightPilots]] = relationship(back_populates="pilot")

    def __repr__(self):
        repr = super().__repr__()
        # repr += self.qualification.__repr__()
        return repr

    def to_json(self, qualification_data=False) -> dict:
        """Return all model data in JSON format."""
        result = super().to_json()
        if qualification_data:
            result["qualification"] = self.qualification.to_json()
        return result


class Qualification(Base):
    __tablename__ = "qualifications"

    pilot_id: Mapped[int] = mapped_column(ForeignKey("pilots.nip", ondelete="CASCADE"), primary_key=True)
    pilot: Mapped[Pilot] = relationship(back_populates="qualification")

    last_day_landings: Mapped[str] = mapped_column(String(55), default=date_init)
    last_night_landings: Mapped[str] = mapped_column(String(55), default=date_init)
    last_prec_app: Mapped[str] = mapped_column(String(55), default=date_init)
    last_nprec_app: Mapped[str] = mapped_column(String(55), default=date_init)
    # last_day_date: Mapped[date] = mapped_column(
    #     insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    # )
    # last_night_date: Mapped[date] = mapped_column(
    #     insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    # )
    # last_prec_app_date: Mapped[date] = mapped_column(
    #     insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    # )
    # last_nprec_app_date: Mapped[date] = mapped_column(
    #     insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    # )

    last_qa1_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_qa2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_bsp1_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_bsp2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_ta_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
    last_vrp1_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )
    last_vrp2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))

    last_cto_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )
    last_sid_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )
    last_mono_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )
    last_nfp_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )
    last_bskit_date: Mapped[date] = mapped_column(
        insert_default=date(year_init, 1, 1), server_default=f"{year_init}-01-01"
    )

    def update(self, data: FlightPilots, date: date) -> Qualification:
        """Update with Last qualification date."""
        attr_list = [column.name[5:-5] for column in self.__table__.columns]
        attr_list = attr_list[5:]

        for item in attr_list:
            if getattr(data, item):
                setattr(self, f"last_{item}_date", date)

        self.last_day_landings = Qualification._get_last_five(
            self.last_day_landings.split(),
            data.day_landings,
            date.strftime("%Y-%m-%d"),
        )
        self.last_night_landings = Qualification._get_last_five(
            self.last_night_landings.split(),
            data.night_landings,
            date.strftime("%Y-%m-%d"),
        )
        self.last_prec_app = Qualification._get_last_five(
            self.last_prec_app.split(),
            data.prec_app,
            date.strftime("%Y-%m-%d"),
        )
        self.last_nprec_app = Qualification._get_last_five(
            self.last_nprec_app.split(),
            data.nprec_app,
            date.strftime("%Y-%m-%d"),
        )

        return self

    def __repr__(self) -> str:
        return self.to_json().__repr__()

    def to_json(self) -> dict:
        # Gets the columns names for standard qualifications
        attr_list = [column.name for column in self.__table__.columns]
        attr_list = attr_list[5:]

        unsorted_dict: dict = {}

        for item in attr_list:
            # print(f"Item: {item}")
            value = getattr(self, item)
            # print(f"Value: {value}")a =
            unsorted_dict[f"last{item[5:-5].upper()}"] = value

        oldest_key: str = min(unsorted_dict, key=unsorted_dict.get)

        final_dict: dict = {
            "lastDayLandings": list(self.last_day_landings.split()),
            "lastNightLandings": list(self.last_night_landings.split()),
            "lastPrecApp": list(self.last_prec_app.split()),
            "lastNprecApp": list(self.last_nprec_app.split()),
        }

        for k, v in unsorted_dict.items():
            # print(type(v))
            if k[4:] in ["CTO", "SID", "MONO", "NFP"]:
                final_dict[k] = self._get_days(v, 45)
            else:
                final_dict[k] = self._get_days(v)
        final_dict["oldest"] = [oldest_key[4:], self._get_days(unsorted_dict[oldest_key])[1]]
        return final_dict

    @staticmethod
    def _get_days(data: date, validade: int = 180) -> list[int | str]:
        today = date.today()
        dias = (data - today + timedelta(days=validade)).days
        expire = (data + timedelta(days=validade)).strftime("%d-%b-%Y")
        return [dias, expire]

    @staticmethod
    def _get_last_five(last: list, number: int, date: str) -> str:
        for _ in range(number):
            last.append(date)
            if len(last) > 5:
                last.sort()
                last.pop(0)
        return " ".join(last)

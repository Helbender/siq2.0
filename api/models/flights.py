from __future__ import annotations  # noqa: D100, INP001

# import locale
from datetime import date  # noqa: TC003
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from models.basemodels import Base  # type: ignore

# locale.setlocale(locale.LC_TIME, "pt_PT.UTF-8")  # Ou 'pt_BR.UTF-8' para português do Brasil
if TYPE_CHECKING:
    from models.tripulantes import Tripulante  # type: ignore


class Flight(Base):
    """Flight Model.

    Basic flight parameters and estabilish relations.

    :param Flight Pilots for the FlightPilot Table with each Pilot flight data (One-To-Many)
    :param Flight Crew for the FlightCrew Table with each Crew flight data (One-To-Many)

    """

    __tablename__: str = "flights_table"

    fid: Mapped[int] = mapped_column(primary_key=True)
    airtask: Mapped[str] = mapped_column(String(7), nullable=False)
    flight_type: Mapped[str] = mapped_column(String(5))
    flight_action: Mapped[str] = mapped_column(String(5))
    tailnumber: Mapped[int]
    date: Mapped[date]
    origin: Mapped[str] = mapped_column(String(4))
    destination: Mapped[str] = mapped_column(String(4))
    departure_time: Mapped[str] = mapped_column(String(5))
    arrival_time: Mapped[str] = mapped_column(String(5))
    total_time: Mapped[str] = mapped_column(String(5))
    atr: Mapped[int]
    passengers: Mapped[int]
    doe: Mapped[int]
    cargo: Mapped[int]
    number_of_crew: Mapped[int]
    orm: Mapped[int]
    fuel: Mapped[int]
    activation_first: Mapped[str] = mapped_column(String(5), insert_default="__:__", server_default="__:__")
    activation_last: Mapped[str] = mapped_column(String(5), insert_default="__:__", server_default="__:__")
    ready_ac: Mapped[str] = mapped_column(String(5), insert_default="__:__", server_default="__:__")
    med_arrival: Mapped[str] = mapped_column(String(5), insert_default="__:__", server_default="__:__")

    flight_pilots: Mapped[List[FlightPilots]] = relationship(  # noqa: UP006
        back_populates="flight",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        flight_crewmembers = [flightpilot.to_json() for flightpilot in self.flight_pilots]

        # Return the JSON response
        return {
            "id": self.fid,
            "airtask": self.airtask,
            "date": self.date.strftime("%Y-%m-%d"),
            "origin": self.origin,
            "destination": self.destination,
            "ATD": self.departure_time,
            "ATA": self.arrival_time,
            "ATE": self.total_time,
            "flightType": self.flight_type,
            "flightAction": self.flight_action,
            "tailNumber": self.tailnumber,
            "totalLandings": self.atr,
            "passengers": self.passengers,
            "doe": self.doe,
            "cargo": self.cargo,
            "numberOfCrew": self.number_of_crew,
            "orm": self.orm,
            "fuel": self.fuel,
            "activationFirst": self.activation_first,
            "activationLast": self.activation_last,
            "readyAC": self.ready_ac,
            "medArrival": self.med_arrival,
            "flight_pilots": flight_crewmembers,
        }

    def get_file_name(self) -> str:
        """Construct file name base on Row parameters.

        Returns:
            str: String with AIRTASK DATE ATD and Aircraft info

        """
        return f"1M {self.airtask} {self.date.strftime('%d%b%Y')} {self.departure_time.strip(':')} {self.tailnumber}.1m"


class FlightPilots(Base):
    """SQLALCHEMY Database class with the Pilots of each flight."""

    __tablename__ = "flight_pilots"

    flight_id: Mapped[int] = mapped_column(
        ForeignKey("flights_table.fid", ondelete="CASCADE"),
        primary_key=True,
    )
    pilot_id: Mapped[int] = mapped_column(ForeignKey("tripulantes.nip", ondelete="CASCADE"), primary_key=True)
    position: Mapped[str] = mapped_column(String(5))

    day_landings: Mapped[int | None]  # noqa: UP007
    night_landings: Mapped[int | None]  # noqa: UP007
    prec_app: Mapped[int | None]  # noqa: UP007
    nprec_app: Mapped[int | None]  # noqa: UP007

    qual1: Mapped[str | None]  # noqa: UP007
    qual2: Mapped[str | None]  # noqa: UP007
    qual3: Mapped[str | None]  # noqa: UP007
    qual4: Mapped[str | None]  # noqa: UP007
    qual5: Mapped[str | None]  # noqa: UP007
    qual6: Mapped[str | None]  # noqa: UP007

    tripulante: Mapped[Tripulante] = relationship(back_populates="flight_pilots")
    flight: Mapped[Flight] = relationship(back_populates="flight_pilots")

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        response = {
            "name": self.tripulante.name,
            "nip": self.tripulante.nip,
            "rank": self.tripulante.rank,
            "position": self.position,
            "ATR": self.day_landings,
            "ATN": self.night_landings,
            "precapp": self.prec_app,
            "nprecapp": self.nprec_app,
        }
        # for i in self.tripulante.qualification.get_qualification_list():
        #     # print(f"{i.lower()}: {getattr(self, i.lower())}")
        #     response[i] = getattr(self, i.lower(), False)

        return response


# class FlightCrew(Base):
#     """SQLALCHEMY Database class with the Crew of each flight."""

#     __tablename__ = "flight_crew"

#     flight_id: Mapped[int] = mapped_column(
#         ForeignKey("flights_table.fid", ondelete="CASCADE"),
#         primary_key=True,
#     )

#     crew_id: Mapped[int] = mapped_column(
#         ForeignKey("crew.nip", ondelete="CASCADE"), primary_key=True
#     )
#     position: Mapped[str] = mapped_column(String(5))

#     qual1: Mapped[str | None]  # noqa: UP007
#     qual2: Mapped[str | None]  # noqa: UP007
#     qual3: Mapped[str | None]  # noqa: UP007
#     qual4: Mapped[str | None]  # noqa: UP007
#     qual5: Mapped[str | None]  # noqa: UP007
#     qual6: Mapped[str | None]  # noqa: UP007

#     crew: Mapped[Crew] = relationship(back_populates="flight_crew")
#     flight: Mapped[Flight] = relationship(back_populates="flight_crew")

#     def to_json(self) -> dict:
#         """Return all model data in JSON format."""
#         response = {
#             "name": self.crew.name,
#             "position": self.position,
#             "nip": self.crew.nip,
#         }
#         for i in self.crew.qualification.get_qualification_list():
#             # print(f"{i.lower()}: {getattr(self, i.lower())}")
#             response[i] = getattr(self, i.lower(), False)
#         return response

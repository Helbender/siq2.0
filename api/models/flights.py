from __future__ import annotations  # noqa: D100, INP001

# import locale
from datetime import date  # noqa: TC003
from typing import TYPE_CHECKING, List, Optional

from models.users import Base  # type: ignore
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

# locale.setlocale(locale.LC_TIME, "pt_PT.UTF-8")  # Ou 'pt_BR.UTF-8' para português do Brasil
if TYPE_CHECKING:
    from crew import Crew  # type: ignore
    from pilots import Pilot  # type: ignore


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
    )
    flight_crew: Mapped[List[FlightCrew]] = relationship(  # noqa: UP006
        back_populates="flight",
        cascade="all, delete-orphan",
    )

    # def __repr__(self) -> str:
    #     """Print Dictionary the instance attributes."""
    #     return self.to_json().__repr__()

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        # flight_crewmembers = [flightpilot.to_json() for flightpilot in self.flight_pilots]
        # flight_crewmembers.extend([flightcrew.to_json() for flightcrew in self.flight_crew])
        flight_crewmembers = []
        for flightpilot in self.flight_pilots:
            flight_crewmembers.append(flightpilot.to_json())
        for flightcrew in self.flight_crew:
            flight_crewmembers.append(flightcrew.to_json())

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
        return f"1M {self.airtask} {self.date.strftime('%d%b%Y')} {self.departure_time.strip(':')} {self.tailnumber}.1m"


class FlightPilots(Base):
    """SQLALCHEMY Database class with the Pilots of each flight."""

    __tablename__ = "flight_pilots"

    flight_id: Mapped[int] = mapped_column(
        ForeignKey("flights_table.fid"),
        primary_key=True,
    )
    pilot_id: Mapped[int] = mapped_column(ForeignKey("pilots.nip"), primary_key=True)
    position: Mapped[str] = mapped_column(String(5))

    day_landings: Mapped[int]
    night_landings: Mapped[int]
    prec_app: Mapped[int]
    nprec_app: Mapped[int]

    cto: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    sid: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    mono: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    nfp: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007

    qa1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    qa2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)  # noqa: UP007
    bsp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    bsp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    ta: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    bskit: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    paras: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    nvg: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007

    pilot: Mapped[Pilot] = relationship(back_populates="flight_pilots")
    flight: Mapped[Flight] = relationship(back_populates="flight_pilots")

    # def __repr__(self) -> str:
    #     """Print Dictionary the instance attributes and Flight Info."""
    #     rep = f"Airtask {self.flight.airtask}\n Database ID: {self.flight_id} "
    #     for k, v in self.to_json():
    #         rep += f"\n{k}:{v}"
    #     return rep

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        response = {
            "name": self.pilot.name,
            "nip": self.pilot.nip,
            "rank": self.pilot.rank,
            "position": self.position,
            "ATR": self.day_landings,
            "ATN": self.night_landings,
            "precapp": self.prec_app,
            "nprecapp": self.nprec_app,
        }
        response["QA1"] = self.qa1
        response["QA2"] = self.qa2
        response["BSP1"] = self.bsp1
        response["BSP2"] = self.bsp2
        response["TA"] = self.ta
        response["VRP1"] = self.vrp1
        response["VRP2"] = self.vrp2
        response["CTO"] = self.cto
        response["SID"] = self.sid
        response["MONO"] = self.mono
        response["NFP"] = self.nfp
        response["BSKIT"] = self.bskit
        response["PARAS"] = self.paras
        response["NVG"] = self.nvg

        return response


class FlightCrew(Base):
    """SQLALCHEMY Database class with the Crew of each flight."""

    __tablename__ = "flight_crew"

    flight_id: Mapped[int] = mapped_column(
        ForeignKey("flights_table.fid"),
        primary_key=True,
    )

    crew_id: Mapped[int] = mapped_column(ForeignKey("crew.nip"), primary_key=True)
    position: Mapped[str] = mapped_column(String(5))

    bsoc: Mapped[Optional[bool]]  # noqa: UP007
    bskit: Mapped[Optional[bool]]  # noqa: UP007

    crew: Mapped[Crew] = relationship(back_populates="flight_crew")
    flight: Mapped[Flight] = relationship(back_populates="flight_crew")

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        response = {
            "name": self.crew.name,
            "position": self.position,
            "nip": self.crew.nip,
        }
        response["BSOC"] = self.bsoc
        response["BSKIT"] = self.bskit
        return response

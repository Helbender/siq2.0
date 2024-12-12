from __future__ import annotations  # noqa: D100, INP001

from datetime import date  # noqa: TCH003
from typing import TYPE_CHECKING, List, Optional

from models.users import Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

if TYPE_CHECKING:
    from crew import Crew
    from pilots import Pilot


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
    flight_pilots: Mapped[List[FlightPilots]] = relationship(  # noqa: UP006
        back_populates="flight",
        cascade="all, delete-orphan",
    )
    flight_crew: Mapped[List[FlightCrew]] = relationship(  # noqa: UP006
        back_populates="flight",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> dict:
        """Print Dictionary the instance attributes."""
        return self.to_json()

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        return {
            "id": self.fid,
            "airtask": self.airtask,
            "date": self.date.strftime("%d-%b-%Y"),
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
        }

    def to_name(self) -> str:
        return f"1M_{self.airtask}_{self.date}_{self.departure_time}"


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
    qa1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    qa2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)  # noqa: UP007
    bsp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    bsp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    ta: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007

    pilot: Mapped[Pilot] = relationship(back_populates="flight_pilots")
    flight: Mapped[Flight] = relationship(back_populates="flight_pilots")

    def __repr__(self) -> str:
        """Print Dictionary the instance attributes and Flight Info."""
        rep = f"Airtask {self.flight.airtask}\n Database ID: {self.flight_id} "
        for k, v in self.to_json():
            rep += f"\n{k}:{v}"
        return rep

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        response = {
            "name": self.pilot.name,
            "nip": self.pilot.nip,
            "position": self.position,
            "ATR": self.day_landings,
            "ATN": self.night_landings,
            "precapp": self.prec_app,
            "nprecapp": self.nprec_app,
        }
        if self.qa1:
            response["QA1"] = self.qa1
        if self.qa2:
            response["QA2"] = self.qa2
        if self.bsp1:
            response["BSP1"] = self.bsp1
        if self.bsp2:
            response["BSP2"] = self.bsp2
        if self.ta:
            response["TA"] = self.ta
        if self.vrp1:
            response["VRP1"] = self.vrp1
        if self.vrp2:
            response["VRP2"] = self.vrp2

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

    crew: Mapped[Crew] = relationship(back_populates="flight_crew")
    flight: Mapped[Flight] = relationship(back_populates="flight_crew")

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        response = {
            "name": self.crew.name,
            "position": self.position,
            "nip": self.crew.nip,
        }
        if self.bsoc:
            response["BSOC"] = self.bsoc
        return response

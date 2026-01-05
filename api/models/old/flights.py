from __future__ import annotations  # noqa: D100, INP001

# import locale
from datetime import date  # noqa: TC003
from typing import TYPE_CHECKING
from typing import List

from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from models.users import Base  # type: ignore

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
        passive_deletes=True,
    )
    flight_crew: Mapped[List[FlightCrew]] = relationship(  # noqa: UP006
        back_populates="flight",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # def __repr__(self) -> str:
    #     """Print Dictionary the instance attributes."""
    #     return self.to_json().__repr__()

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        flight_crewmembers = [flightpilot.to_json() for flightpilot in self.flight_pilots]
        flight_crewmembers.extend([flightcrew.to_json() for flightcrew in self.flight_crew])

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
    pilot_id: Mapped[int] = mapped_column(ForeignKey("pilots.nip", ondelete="CASCADE"), primary_key=True)
    position: Mapped[str] = mapped_column(String(5))

    day_landings: Mapped[int]
    night_landings: Mapped[int]
    prec_app: Mapped[int]
    nprec_app: Mapped[int]

    cto: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    sid: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    mono: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    nfp: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007

    qa1: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    qa2: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)  # noqa: UP007
    bsp1: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    bsp2: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    ta: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp1: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    vrp2: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    bskit: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    paras: Mapped[bool | None]  # = mapped_column(nullable=True, default=False)# noqa: UP007
    nvg: Mapped[bool | None]  # = mapped_column(nullable=True, default=False) # noqa: UP007
    nvg2: Mapped[bool | None]  # = mapped_column(nullable=True, default=False) # noqa: UP007

    pilot: Mapped[Pilot] = relationship(back_populates="flight_pilots")
    flight: Mapped[Flight] = relationship(back_populates="flight_pilots")

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        # Collect qualifications that are True, in order
        qualifications_list = []
        for i in self.pilot.qualification.get_qualification_list():
            if getattr(self, i.lower(), False):
                qualifications_list.append(i)

        # Map first 6 qualifications to QUAL1-QUAL6
        response = {
            "name": self.pilot.name,
            "nip": self.pilot.nip,
            "rank": self.pilot.rank,
            "position": self.position,
            "VIR": "",
            "VN": "",
            "CON": "",
            "ATR": self.day_landings,
            "ATN": self.night_landings,
            "precapp": self.prec_app,
            "nprecapp": self.nprec_app,
            "QUAL1": qualifications_list[0] if len(qualifications_list) > 0 else "",
            "QUAL2": qualifications_list[1] if len(qualifications_list) > 1 else "",
            "QUAL3": qualifications_list[2] if len(qualifications_list) > 2 else "",
            "QUAL4": qualifications_list[3] if len(qualifications_list) > 3 else "",
            "QUAL5": qualifications_list[4] if len(qualifications_list) > 4 else "",
            "QUAL6": qualifications_list[5] if len(qualifications_list) > 5 else "",
        }

        return response


class FlightCrew(Base):
    """SQLALCHEMY Database class with the Crew of each flight."""

    __tablename__ = "flight_crew"

    flight_id: Mapped[int] = mapped_column(
        ForeignKey("flights_table.fid", ondelete="CASCADE"),
        primary_key=True,
    )

    crew_id: Mapped[int] = mapped_column(ForeignKey("crew.nip", ondelete="CASCADE"), primary_key=True)
    position: Mapped[str] = mapped_column(String(5))

    bsoc: Mapped[bool | None]  # noqa: UP007
    bskit: Mapped[bool | None]  # noqa: UP007
    paras: Mapped[bool | None]  # noqa: UP007

    crew: Mapped[Crew] = relationship(back_populates="flight_crew")
    flight: Mapped[Flight] = relationship(back_populates="flight_crew")

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        # Collect qualifications that are True, in order
        qualifications_list = []
        for i in self.crew.qualification.get_qualification_list():
            if getattr(self, i.lower(), False):
                qualifications_list.append(i)

        # Map first 6 qualifications to QUAL1-QUAL6
        response = {
            "name": self.crew.name,
            "position": self.position,
            "nip": self.crew.nip,
            "QUAL1": qualifications_list[0] if len(qualifications_list) > 0 else "",
            "QUAL2": qualifications_list[1] if len(qualifications_list) > 1 else "",
            "QUAL3": qualifications_list[2] if len(qualifications_list) > 2 else "",
            "QUAL4": qualifications_list[3] if len(qualifications_list) > 3 else "",
            "QUAL5": qualifications_list[4] if len(qualifications_list) > 4 else "",
            "QUAL6": qualifications_list[5] if len(qualifications_list) > 5 else "",
        }

        return response

from __future__ import annotations

import json

from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

year_init: int = 2020
date_init: str = f"{year_init}-01-01"


class Base(DeclarativeBase):
    """subclasses will be converted to dataclasses."""


class People:
    """Basic People Model.

    Used for non flying users and serves as super class for the flying users
    """

    nip: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20))
    rank: Mapped[str] = mapped_column(String(5))
    position: Mapped[str] = mapped_column(String(3))
    email: Mapped[str] = mapped_column(String(50))
    admin: Mapped[bool] = mapped_column(default=False)
    recover: Mapped[str] = mapped_column(String(500), default="")
    squadron: Mapped[str] = mapped_column(String(30), default="")
    password: Mapped[str] = mapped_column(String(150))

    def __repr__(self):
        return json.dumps(self.to_json())

    def to_json(self):
        """Return all model data in JSON format."""
        return {
            "nip": self.nip,
            "name": self.name,
            "rank": self.rank,
            "position": self.position,
            "email": self.email,
            "admin": self.admin,
            "recover": self.recover,
            "squadron": self.squadron,
            # "password": self.password,
        }


class User(People, Base):
    """Basic User model.

    Created only because other Users Model can ineherith directly from a class with table name
    """

    __tablename__: str = "users"

    def to_json(self) -> dict:
        """Return all model data in JSON format."""
        return super().to_json()


# class Pilot(People, Base):
#     __tablename__ = "pilots"

#     qualification: Mapped[Qualification] = relationship(
#         "Qualification",
#         back_populates="pilot",
#         cascade="all, delete",
#         passive_deletes=True,
#     )
#     flight_pilots: Mapped[List[FlightPilots]] = relationship(back_populates="pilot")

#     def __repr__(self):
#         repr = super().__repr__()
#         # repr += self.qualification.__repr__()
#         return repr

#     def to_json(self, qualification_data=False) -> dict:
#         """Return all model data in JSON format."""
#         result = super().to_json()
#         if qualification_data:
#             result["qualification"] = self.qualification.to_json()
#         return result


# class Qualification(Base):
#     __tablename__ = "qualifications"

#     pilot_id: Mapped[int] = mapped_column(ForeignKey("pilots.nip"), primary_key=True)
#     pilot: Mapped[Pilot] = relationship(back_populates="qualification")

#     last_day_landings: Mapped[str] = mapped_column(String(55), default=date_init)
#     last_night_landings: Mapped[str] = mapped_column(String(55), default=date_init)
#     last_prec_app: Mapped[str] = mapped_column(String(55), default=date_init)
#     last_nprec_app: Mapped[str] = mapped_column(String(55), default=date_init)
#     last_qa1_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_qa2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_bsp1_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_bsp2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_ta_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_vrp1_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_vrp2_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_cto: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     last_sid: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     # last_mono: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))
#     # last_nfp: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))

#     def update(self, data: FlightPilots, date: date) -> Qualification:
#         """Update with Last qualification date."""
#         if data.qa1 and date > self.last_qa1_date:
#             self.last_qa1_date = date

#         if data.qa2 and date > self.last_qa2_date:
#             self.last_qa2_date = date

#         if data.bsp1 and date > self.last_bsp1_date:
#             self.last_bsp1_date = date

#         if data.bsp2 and date > self.last_bsp2_date:
#             self.last_bsp2_date = date

#         if data.ta and date > self.last_ta_date:
#             self.last_ta_date = date

#         if data.vrp1 and date > self.last_vrp1_date:
#             self.last_vrp1_date = date
#         if data.vrp2 and date > self.last_vrp2_date:
#             self.last_vrp2_date = date

#         self.last_day_landings = Qualification._get_last_five(
#             self.last_day_landings.split(),
#             data.day_landings,
#             date.strftime("%Y-%m-%d"),
#         )
#         self.last_night_landings = Qualification._get_last_five(
#             self.last_night_landings.split(),
#             data.night_landings,
#             date.strftime("%Y-%m-%d"),
#         )
#         self.last_prec_app = Qualification._get_last_five(
#             self.last_prec_app.split(),
#             data.prec_app,
#             date.strftime("%Y-%m-%d"),
#         )
#         self.last_nprec_app = Qualification._get_last_five(
#             self.last_nprec_app.split(),
#             data.nprec_app,
#             date.strftime("%Y-%m-%d"),
#         )

#         return self

#     def __repr__(self) -> str:
#         return f"\nATR:{self.last_day_landings}\tATN:{self.last_night_landings}\tQA1: {self.last_qa1_date}\n"

#     def to_json(self) -> dict:
#         unsorted_dict = {
#             "lastQA1": self.last_qa1_date,
#             "lastQA2": self.last_qa2_date,
#             "lastBSP1": self.last_bsp1_date,
#             "lastBSP2": self.last_bsp2_date,
#             "lastTA": self.last_ta_date,
#             "lastVRP1": self.last_vrp1_date,
#             "lastVRP2": self.last_vrp2_date,
#             "lastCTO": self.last_cto,
#         }
#         sorted_dict: list = sorted(unsorted_dict, reverse=True)
#         oldest_key = sorted_dict[0]
#         return {
#             # "lastDayLandings": [date for date in self.last_day_landings.split()],  # noqa: ERA001
#             "lastDayLandings": list(self.last_day_landings.split()),
#             "lastNightLandings": list(self.last_night_landings.split()),
#             "lastPrecApp": list(self.last_prec_app.split()),
#             "lastNprecApp": list(self.last_nprec_app.split()),
#             "lastQA1": self._get_days(self.last_qa1_date)[0],
#             "lastQA2": self._get_days(self.last_qa2_date)[0],
#             "lastBSP1": self._get_days(self.last_bsp1_date)[0],
#             "lastBSP2": self._get_days(self.last_bsp2_date)[0],
#             "lastTA": self._get_days(self.last_ta_date)[0],
#             "lastVRP1": self._get_days(self.last_vrp1_date)[0],
#             "lastVRP2": self._get_days(self.last_vrp2_date)[0],
#             "lastCTO": self._get_days(self.last_cto)[0],
#             "oldest": [oldest_key[4:], self._get_days(unsorted_dict[oldest_key])[1]],
#             # "oldest": sorted_dict[0][4:],
#             # "oldest": oldest_key[4:],
#         }

#     @staticmethod
#     def _get_days(data: date, validade: int = 180) -> list[int | str]:
#         today = date.today()
#         dias = (data - today + timedelta(days=validade)).days
#         expire = (data + timedelta(days=validade)).strftime("%d-%b-%Y")
#         return [dias, expire]

#     @staticmethod
#     def _get_last_five(last: list, number: int, date: str) -> str:
#         for _ in range(number):
#             last.append(date)
#             if len(last) > 5:
#                 last.sort()
#                 last.pop(0)
#         return " ".join(last)


# class Flight(Base):
#     """Flight Model.

#     Basic flight parameters and estabilish relations.

#     :param Flight Pilots for the FlightPilot Table with each Pilot flight data (One-To-Many)
#     :param Flight Crew for the FlightCrew Table with each Crew flight data (One-To-Many)

#     """

#     __tablename__: str = "flights_table"

#     fid: Mapped[int] = mapped_column(primary_key=True)
#     airtask: Mapped[str] = mapped_column(String(7), nullable=False)
#     flight_type: Mapped[str] = mapped_column(String(5))
#     flight_action: Mapped[str] = mapped_column(String(5))
#     tailnumber: Mapped[int]
#     date: Mapped[date]
#     origin: Mapped[str] = mapped_column(String(4))
#     destination: Mapped[str] = mapped_column(String(4))
#     departure_time: Mapped[str] = mapped_column(String(5))
#     arrival_time: Mapped[str] = mapped_column(String(5))
#     total_time: Mapped[str] = mapped_column(String(5))
#     atr: Mapped[int]
#     passengers: Mapped[int]
#     doe: Mapped[int]
#     cargo: Mapped[int]
#     number_of_crew: Mapped[int]
#     orm: Mapped[int]
#     fuel: Mapped[int]
#     flight_pilots: Mapped[List[FlightPilots]] = relationship(  # noqa: UP006
#         back_populates="flight",
#         cascade="all, delete-orphan",
#     )
#     flight_crew: Mapped[List[FlightCrew]] = relationship(  # noqa: UP006
#         back_populates="flight",
#         cascade="all, delete-orphan",
#     )

#     def __repr__(self) -> str:
#         """Print Dictionary the instance attributes."""
#         return self.to_json().__repr__()

#     def to_json(self) -> dict:
#         """Return all model data in JSON format."""
#         return {
#             "id": self.fid,
#             "airtask": self.airtask,
#             "date": self.date.strftime("%d-%b-%Y"),
#             "origin": self.origin,
#             "destination": self.destination,
#             "ATD": self.departure_time,
#             "ATA": self.arrival_time,
#             "ATE": self.total_time,
#             "flightType": self.flight_type,
#             "flightAction": self.flight_action,
#             "tailNumber": self.tailnumber,
#             "totalLandings": self.atr,
#             "passengers": self.passengers,
#             "doe": self.doe,
#             "cargo": self.cargo,
#             "numberOfCrew": self.number_of_crew,
#             "orm": self.orm,
#             "fuel": self.fuel,
#         }

#     def get_file_name(self) -> str:
#         return f"1M {self.airtask} {self.date.strftime('%d%b%Y')} {self.departure_time.strip(':')}.1m"


# class FlightPilots(Base):
#     """SQLALCHEMY Database class with the Pilots of each flight."""

#     __tablename__ = "flight_pilots"

#     flight_id: Mapped[int] = mapped_column(
#         ForeignKey("flights_table.fid"),
#         primary_key=True,
#     )
#     pilot_id: Mapped[int] = mapped_column(ForeignKey("pilots.nip"), primary_key=True)
#     position: Mapped[str] = mapped_column(String(5))

#     day_landings: Mapped[int]
#     night_landings: Mapped[int]
#     prec_app: Mapped[int]
#     nprec_app: Mapped[int]

#     cto: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     sid: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007

#     qa1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     qa2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)  # noqa: UP007
#     bsp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     bsp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     ta: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     vrp1: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007
#     vrp2: Mapped[Optional[bool]]  # = mapped_column(nullable=True, default=False)# noqa: UP007

#     pilot: Mapped[Pilot] = relationship(back_populates="flight_pilots")
#     flight: Mapped[Flight] = relationship(back_populates="flight_pilots")

#     def __repr__(self) -> str:
#         """Print Dictionary the instance attributes and Flight Info."""
#         rep = f"Airtask {self.flight.airtask}\n Database ID: {self.flight_id} "
#         for k, v in self.to_json():
#             rep += f"\n{k}:{v}"
#         return rep

#     def to_json(self) -> dict:
#         """Return all model data in JSON format."""
#         response = {
#             "name": self.pilot.name,
#             "nip": self.pilot.nip,
#             "position": self.position,
#             "ATR": self.day_landings,
#             "ATN": self.night_landings,
#             "precapp": self.prec_app,
#             "nprecapp": self.nprec_app,
#         }
#         response["QA1"] = self.qa1
#         response["QA2"] = self.qa2
#         response["BSP1"] = self.bsp1
#         response["BSP2"] = self.bsp2
#         response["TA"] = self.ta
#         response["VRP1"] = self.vrp1
#         response["VRP2"] = self.vrp2
#         response["CTO"] = self.cto
#         response["SID"] = self.sid

#         return response


# class FlightCrew(Base):
#     """SQLALCHEMY Database class with the Crew of each flight."""

#     __tablename__ = "flight_crew"

#     flight_id: Mapped[int] = mapped_column(
#         ForeignKey("flights_table.fid"),
#         primary_key=True,
#     )

#     crew_id: Mapped[int] = mapped_column(ForeignKey("crew.nip"), primary_key=True)
#     position: Mapped[str] = mapped_column(String(5))

#     bsoc: Mapped[Optional[bool]]  # noqa: UP007

#     crew: Mapped[Crew] = relationship(back_populates="flight_crew")
#     flight: Mapped[Flight] = relationship(back_populates="flight_crew")

#     def to_json(self) -> dict:
#         """Return all model data in JSON format."""
#         response = {
#             "name": self.crew.name,
#             "position": self.position,
#             "nip": self.crew.nip,
#         }
#         response["BSOC"] = self.bsoc
#         return response


# class Crew(People, Base):
#     __tablename__ = "crew"

#     qualification: Mapped[QualificationCrew] = relationship(
#         "QualificationCrew",
#         back_populates="crew",
#         cascade="all, delete",
#         passive_deletes=True,
#     )
#     flight_crew: Mapped[List[FlightCrew]] = relationship(back_populates="crew")

#     def to_json(self, qualification_data: bool = False) -> dict:
#         """Return all model data in JSON format."""
#         result = super().to_json()
#         if qualification_data:
#             result["qualification"] = self.qualification.to_json()
#         return result


# class QualificationCrew(Base):
#     __tablename__ = "qualifications_crew"

#     crew_id: Mapped[int] = mapped_column(ForeignKey("crew.nip"), primary_key=True)
#     crew: Mapped[Crew] = relationship(back_populates="qualification")
#     last_bsoc_date: Mapped[date] = mapped_column(insert_default=date(year_init, 1, 1))

#     def to_json(self) -> dict:
#         """Return all model data in JSON format."""
#         oldest_key = "lastBSOC"
#         return {
#             "lastBSOC": self._get_days(self.last_bsoc_date)[0],
#             "oldest": [oldest_key[4:], self._get_days(self.last_bsoc_date)[1]],
#         }

#     def update(self, data: FlightCrew, date: date) -> QualificationCrew:
#         """Update with Last qualification date."""
#         if data.bsoc and date > self.last_bsoc_date:
#             self.last_bsoc_date = date

#         return self

#     @staticmethod
#     def _get_days(data: date) -> list[int | str]:
#         today = date.today()  # noqa: DTZ011
#         dias = (data - today + timedelta(days=180)).days
#         expire = (data + timedelta(days=180)).strftime("%d-%b-%Y")
#         return [dias, expire]

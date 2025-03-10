from __future__ import annotations

import json

from sqlalchemy import String
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
)

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

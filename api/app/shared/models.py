from sqlalchemy.orm import DeclarativeBase

year_init: int = 2020
date_init: str = f"{year_init}-01-01"


class Base(DeclarativeBase):
    """subclasses will be converted to dataclasses."""

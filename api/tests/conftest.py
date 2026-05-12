"""Shared pytest fixtures for SIQ 2.0 backend tests."""

import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Register all models in Base.metadata before creating tables
import app.features.flights.models  # noqa: F401
import app.features.qualifications.models  # noqa: F401
import app.features.users.models  # noqa: F401
import app.shared.rbac_models  # noqa: F401
from app.shared.models import Base

_DEFAULT_TEST_DB_URL = "postgresql+psycopg2://siq:siq@localhost:5432/siq_test"
TEST_DB_URL = os.environ.get("TEST_DB_URL", _DEFAULT_TEST_DB_URL)


def _ensure_test_db_exists() -> None:
    """Create the test database if it doesn't exist."""
    db_name = TEST_DB_URL.rsplit("/", 1)[-1]
    maintenance_url = TEST_DB_URL.rsplit("/", 1)[0] + "/postgres"
    engine = create_engine(maintenance_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    engine.dispose()


@pytest.fixture(scope="session")
def db_engine():
    """PostgreSQL engine — tables created once per session, dropped after."""
    _ensure_test_db_exists()
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def session(db_engine):
    """Transaction-wrapped session per test — rolls back after each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    sess = Session(connection, join_transaction_mode="create_savepoint")
    try:
        yield sess
    finally:
        sess.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="session")
def flask_app():
    """Minimal Flask app com JWT configurado — partilhado por todos os testes da sessão."""
    from flask import Flask
    from flask_jwt_extended import JWTManager

    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "test-secret-key-siq20-pelo-menos-32-chars"
    JWTManager(app)
    return app


@pytest.fixture
def flight_factory(session):
    """Create test flights with minimal valid values via direct model insertion."""
    from datetime import date

    from app.features.flights.models import Flight

    def _make(**kwargs):
        defaults = dict(
            airtask="00A0001",
            flight_type="SAR",
            flight_action="OPER",
            tailnumber=16701,
            date=date(2025, 1, 15),
            origin="LPPT",
            destination="LPFR",
            departure_time="10:00",
            arrival_time="11:30",
            total_time="01:30",
            atr=0,
            passengers=0,
            doe=0,
            cargo=0,
            number_of_crew=2,
            orm=0,
            fuel=0,
        )
        defaults.update(kwargs)
        flight = Flight(**defaults)
        session.add(flight)
        session.flush()
        return flight

    return _make


@pytest.fixture
def tripulante_factory(session):
    """Create test tripulantes via direct model insertion."""
    from app.features.users.models import Tripulante
    from app.shared.enums import TipoTripulante

    def _make(**kwargs):
        defaults = dict(
            nip=99901,
            name="Piloto Teste",
            rank="CAP",
            position="PC",
            tipo=TipoTripulante.PILOTO,
            email="piloto@esq502.pt",
            password="hashed_password_test",
        )
        defaults.update(kwargs)
        t = Tripulante(**defaults)
        session.add(t)
        session.flush()
        return t

    return _make

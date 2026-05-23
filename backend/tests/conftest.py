"""
Test fixtures. Requires a running PostgreSQL.

Defaults to a `taktscore_test` database on the same host as DATABASE_URL; the
test DB is created and tables built at session start. Override with the
TEST_DATABASE_URL env var to point elsewhere.
"""

from __future__ import annotations

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.db import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://taktscore:taktscore@localhost:5432/taktscore_test",
)
ADMIN_URL = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
TEST_DB_NAME = TEST_DATABASE_URL.rsplit("/", 1)[1]

# Safety guard: the fixture drops and recreates this database every session, so refuse
# to run unless the name is clearly marked as a test database. Prevents wiping a real DB
# if TEST_DATABASE_URL is ever misconfigured.
if not TEST_DB_NAME.endswith("_test"):
    raise RuntimeError(
        f"Refusing to use {TEST_DB_NAME!r} as a test database: "
        "TEST_DATABASE_URL must point at a database whose name ends with '_test'."
    )


@pytest.fixture(scope="session")
def engine() -> Generator[Engine, None, None]:
    admin_engine = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    finally:
        admin_engine.dispose()

    test_engine = create_engine(TEST_DATABASE_URL, future=True)
    Base.metadata.create_all(test_engine)
    try:
        yield test_engine
    finally:
        test_engine.dispose()


@pytest.fixture(autouse=True)
def _truncate(engine: Engine) -> None:
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE scores"))
        conn.commit()


@pytest.fixture
def client(engine: Engine) -> Generator[TestClient, None, None]:
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def _override_get_db() -> Generator[Session, None, None]:
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()

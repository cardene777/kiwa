"""pytest conftest — pin the kiwa spec to KIWA_MODULE/LAYER and ship a TestClient fixture."""

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Make sure the kiwa_spec fixture finds the integration spec for this example.
os.environ.setdefault("KIWA_MODULE", "todos")
os.environ.setdefault("KIWA_LAYER", "integration")


@pytest.fixture(autouse=True)
def _reset_store():
    """Reset the in-memory FastAPI store between tests."""
    from app import main

    main._store.clear()
    main._next_id = 1
    yield


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent

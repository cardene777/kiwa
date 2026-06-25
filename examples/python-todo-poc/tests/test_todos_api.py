"""kiwa-test-py example — drive FastAPI integration tests from the same spec markdown.

The `kiwa_spec` fixture is provided by `kiwa-test-py`'s pytest plugin (entry
point `pytest11`). When the spec is loaded the test below loops over every
automated case and asserts the expected status code per route.
"""

from __future__ import annotations


def test_spec_loaded(kiwa_spec):
    assert kiwa_spec is not None
    assert kiwa_spec.module == "todos"
    assert kiwa_spec.layer == "integration"
    assert len(kiwa_spec.cases) >= 6


def test_list_empty(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-001")
    res = client.get(case.route)
    assert res.status_code == 200
    assert res.json() == []


def test_create_returns_id(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-002")
    res = client.post(case.route, json={"title": "hi"})
    assert res.status_code == 201
    body = res.json()
    assert body["id"] == 1
    assert body["title"] == "hi"


def test_get_existing(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-003")
    client.post("/todos", json={"title": "fetch me"})
    res = client.get(case.route)
    assert res.status_code == 200
    assert res.json()["title"] == "fetch me"


def test_get_unknown(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-004")
    res = client.get(case.route)
    assert res.status_code == 404


def test_delete_existing(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-005")
    client.post("/todos", json={"title": "to-delete"})
    res = client.delete(case.route)
    assert res.status_code == 204
    assert client.get("/todos").json() == []


def test_delete_unknown(client, kiwa_spec):
    case = next(c for c in kiwa_spec.cases if c.id == "T-TODO-006")
    res = client.delete(case.route)
    assert res.status_code == 404


def test_skips_manual_cases(kiwa_spec):
    manual = [c for c in kiwa_spec.cases if c.automation == "manual"]
    assert any(c.id == "T-TODO-007" for c in manual)

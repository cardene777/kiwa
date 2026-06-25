# Python adapter with `kiwa-test-py`

> [🇬🇧 English](./python-pytest.md) • [🇯🇵 日本語](../../ja/cookbook/python-pytest.md)

Use the same `tests/spec/{layer}/test-spec-{module}.md` that drives the TypeScript chain to drive Python pytest as well. `kiwa-test-py` ships a parser, a `kiwa_spec` pytest fixture, and `requests` / `httpx` HTTP adapters.

## When to use this

- Backend is FastAPI / Flask / Django and the team writes pytest, not Vitest
- Same spec markdown should drive both TS integration tests and Python integration tests
- You want axe-core / Playwright on the front end *and* pytest on the backend, from one design

## Install

```bash
pip install kiwa-test-py
# optional extras
pip install 'kiwa-test-py[fastapi]'   # FastAPI TestClient helpers
pip install 'kiwa-test-py[cov]'       # pytest-cov integration
```

Requires Python >= 3.10.

## Parse a spec

```python
from kiwa_test_py import parse_spec

doc = parse_spec(open("tests/spec/integration/test-spec-items.md").read())
print(doc.module, doc.layer, len(doc.cases))
for case in doc.cases:
    if case.automation == "yes":
        print(case.id, case.when, "->", case.then)
```

`SpecDoc` and `SpecCase` mirror the TypeScript dataclasses — same field names (`id`, `observation`, `given`, `when`, `then`, `priority`, `automation`, `mode`, `route`), so existing skill output drops in without rewriting.

## The `kiwa_spec` fixture

Add `kiwa-test-py` to your `pyproject.toml` test deps — the pytest plugin entry point registers automatically. Then any test can request the `kiwa_spec` fixture.

```python
# conftest.py
import os
os.environ.setdefault("KIWA_MODULE", "items")
os.environ.setdefault("KIWA_LAYER", "integration")
```

```python
# test_items_api.py
from kiwa_test_py import requests_adapter

def test_specified_routes_return_200(kiwa_spec):
    api = requests_adapter(base_url="http://localhost:8000")
    for case in kiwa_spec.cases:
        if case.automation != "yes":
            continue
        res = api.get(case.route)
        assert res.status_code == 200, f"{case.id} failed"
```

`kiwa_spec` is `None` when no spec file is found, so guard with `if kiwa_spec is None: pytest.skip(...)` for soft contracts.

## httpx (async) example

```python
import pytest
from kiwa_test_py import httpx_adapter

@pytest.mark.asyncio
async def test_async_route(kiwa_spec):
    api = httpx_adapter(base_url="http://localhost:8000", async_client=True)
    res = await api.get("/items")
    assert res.status_code == 200
    await api._client.aclose()
```

## FastAPI TestClient (no live server)

```python
from fastapi.testclient import TestClient
from app.main import app

def test_routes_match_spec(kiwa_spec):
    client = TestClient(app)
    for case in kiwa_spec.cases:
        if case.automation != "yes":
            continue
        res = client.get(case.route)
        assert res.status_code == 200
```

## Coverage via pytest-cov

```bash
pip install 'kiwa-test-py[cov]'
pytest --cov=app --cov-report=term-missing
```

Pairs with `@kiwa-test/observability`'s `fromIstanbulCoverageSummary` when you want a single dashboard across TS + Python coverage.

## Spec format

Same 9-column markdown table the kiwa-design skill produces — see [`/kiwa-design` § lang suffix SSOT](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-design/SKILL.md).

## Related

- Package: [`kiwa-test-py`](../../../kiwa-py/README.md)
- TypeScript counterpart: [`@kiwa-test/spec`](../../../packages/spec/README.md)

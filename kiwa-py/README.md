# @kiwa-lab/py — Python pytest adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-lab/core` + integration adapters to the Python ecosystem.

## Install

```bash
pip install kiwa-test-py
# optional extras
pip install 'kiwa-test-py[fastapi]'  # FastAPI TestClient helpers
pip install 'kiwa-test-py[cov]'      # pytest-cov integration
```

Requires Python >= 3.10.

## Usage

### parse a kiwa-design spec

```python
from kiwa_test_py import parse_spec

doc = parse_spec(open("tests/spec/api/test-spec-items.md").read())
for case in doc.cases:
    if case.automation == "yes":
        print(case.id, case.when, "->", case.then)
```

### pytest `kiwa_spec` fixture

The plugin auto-loads `tests/spec/<layer>/test-spec-<module>.md` if `KIWA_LAYER` / `KIWA_MODULE` env are set, otherwise scans `tests/spec/` for the first match.

```python
def test_specified_route_returns_200(kiwa_spec, requests_adapter_fixture):
    api_case = next(c for c in kiwa_spec.cases if c.id == "T-API-001")
    res = requests_adapter_fixture.get(api_case.route)
    assert res.status_code == 200
```

### http adapters

```python
from kiwa_test_py import requests_adapter, httpx_adapter

# sync requests
adapter = requests_adapter(base_url="http://localhost:8000")
adapter.get("/items")
adapter.post("/items", json={"name": "foo"})

# httpx sync / async
sync = httpx_adapter(base_url="http://localhost:8000")
async_ = httpx_adapter(base_url="http://localhost:8000", async_client=True)
```

## Spec format

See [kiwa-design SKILL](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-design/SKILL.md) for the 9-column markdown table format. `parse_spec` returns:

- `SpecDoc(module, layer, cases, raw, warnings)`
- `SpecCase(id, observation, given, when, then, priority, automation, mode, route, notes)`

## Status

Initial release covers parser + sync / async HTTP adapters. FastAPI TestClient helpers and Celery / Django ORM adapters are tracked in the kiwa monorepo issue tracker.

## License

MIT

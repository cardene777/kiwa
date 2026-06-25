# Python adapter `kiwa-test-py` を使う

> [🇬🇧 English](../../en/cookbook/python-pytest.md) • [🇯🇵 日本語](./python-pytest.md)

TS chain と同じ `tests/spec/{layer}/test-spec-{module}.md` を Python pytest に drive させる。 `kiwa-test-py` は parser、 `kiwa_spec` pytest fixture、 `requests` / `httpx` HTTP adapter を提供する。

## こんなときに使う

- backend が FastAPI / Flask / Django で、 team は pytest 派 (Vitest ではない)
- 同じ spec markdown で TS integration test も Python integration test も drive したい
- front end に axe-core / Playwright、 backend に pytest、 1 つの設計から両方走らせたい

## インストール

```bash
pip install kiwa-test-py
# 追加 extras
pip install 'kiwa-test-py[fastapi]'   # FastAPI TestClient helper
pip install 'kiwa-test-py[cov]'       # pytest-cov 統合
```

Python >= 3.10 必須。

## spec を parse する

```python
from kiwa_test_py import parse_spec

doc = parse_spec(open("tests/spec/integration/test-spec-items.md").read())
print(doc.module, doc.layer, len(doc.cases))
for case in doc.cases:
    if case.automation == "yes":
        print(case.id, case.when, "->", case.then)
```

`SpecDoc` / `SpecCase` は TS dataclass と field 名一致 (`id` / `observation` / `given` / `when` / `then` / `priority` / `automation` / `mode` / `route`)、 既存 skill 出力をそのまま入れられる。

## `kiwa_spec` fixture

`pyproject.toml` の test deps に `kiwa-test-py` を入れれば pytest plugin entry point が自動登録される。 test 内で `kiwa_spec` fixture を要求するだけ。

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

spec file 不在のとき `kiwa_spec` は `None`、 soft contract の場合 `if kiwa_spec is None: pytest.skip(...)` で guard する。

## httpx (async) 例

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

## FastAPI TestClient (live server 不要)

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

## pytest-cov による coverage

```bash
pip install 'kiwa-test-py[cov]'
pytest --cov=app --cov-report=term-missing
```

`@kiwa-test/observability` の `fromIstanbulCoverageSummary` と組み合わせれば、 TS + Python の coverage を 1 つの dashboard に集約できる。

## spec format

kiwa-design skill が出力する 9 column markdown table と一致 — [`/kiwa-design` § lang suffix SSOT](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-design/SKILL.md) 参照。

## 関連

- Package: [`kiwa-test-py`](../../../kiwa-py/README.md)
- TS 版: [`@kiwa-test/spec`](../../../packages/spec/README.md)

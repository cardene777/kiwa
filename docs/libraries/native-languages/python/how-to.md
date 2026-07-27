# pytest で仕様を選ぶ

CI では、どの仕様を読んだかが曖昧な test は再現できません。`KIWA_LAYER` と `KIWA_MODULE` をセットすると、plugin は `tests/spec/<layer>/test-spec-<module>.md` だけを選び、session-scoped の `kiwa_spec` fixture として test に渡します。

## 対象を固定する

`items` API の仕様を使う場合は、test command と同じ行で環境変数を渡します。

```bash
KIWA_LAYER=api KIWA_MODULE=items pytest -q
```

この command は `tests/spec/api/test-spec-items.md` を読みます。file が存在しない場合、plugin は file name の候補を推測せず、`tests/spec` 以下で最初に見つけた `test-spec-*.md` を使うことがあります。これでは別 module の test が偶然通るため、CI では layer と module の両方を常に指定します。

## route を HTTP test に渡す

次の test は specification から `T-API-001` の route を取り出し、local application に request を送ります。

```python
from kiwa_test_py import requests_adapter


def test_list_items(kiwa_spec):
    assert kiwa_spec is not None
    assert kiwa_spec.warnings == []

    case = next(item for item in kiwa_spec.cases if item.id == "T-API-001")
    client = requests_adapter(base_url="http://127.0.0.1:8000")
    try:
        response = client.get(case.route)
    finally:
        client.close()

    assert response.status_code == 200
```

application を別 terminal や test fixture で起動したうえで実行します。

```bash
KIWA_LAYER=api KIWA_MODULE=items pytest -q tests/test_items_api.py
```

`pytest` command が PATH にない環境では、Quickstart で package を追加した interpreter を使って `KIWA_LAYER=api KIWA_MODULE=items python3 -m pytest -q tests/test_items_api.py` のように実行します。Windows の `python` と macOS や Linux の `python3` を混在させず、install と test で同じ virtual environment を使ってください。

`1 passed` になれば、spec の route を読んで HTTP request を送り、200 を確認できています。endpoint が起動していない場合は requests 自体が connection error を返します。これは parser の error ではないため、application の起動、base URL、network policy を先に確認します。

## 仕様がない場合を明示する

`kiwa_spec` は仕様 file が見つからないと `None` を返します。仕様が release gate として必須なら、上のように `assert kiwa_spec is not None` として失敗させます。仕様をまだ作っていない環境を許容する test なら、次のように skip 理由を残します。

```python
import pytest


def test_optional_contract(kiwa_spec):
    if kiwa_spec is None:
        pytest.skip("kiwa specification is not present")
```

## adapter の URL と lifecycle

`requests_adapter` と同期の `httpx_adapter` は relative path の先頭に slash を補い、base URL の末尾 slash を除いて request URL を作ります。`http://` または `https://` で始まる path はそのまま使うため、spec 内の absolute URL を許すかどうかは project の test policy で決めてください。

adapter は pytest fixture ではありません。`requests_adapter` は内部の `requests.Session` を、同期 `httpx_adapter` は `httpx.Client` を持つため、所有した test が `close()` します。`async_client=True` で作った `HttpxAdapter` の `close()` は AsyncClient を await しません。async client の所有者が `await client.aclose()` を呼びます。adapter は request を送るだけで、server、database、認証 state、外部 service は準備しません。

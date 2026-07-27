# kiwa-test-py リファレンス

`kiwa-test-py` の root import は `SpecCase`、`SpecDoc`、`parse_spec`、`requests_adapter`、`httpx_adapter` を公開します。pytest plugin は追加で `kiwa_spec` fixture を登録します。

## parser

`parse_spec(markdown, module="", default_layer="unit")` は例外を送出せず `SpecDoc` を返します。table がない場合、または必須 column がない場合も `cases` は空になり、理由を `warnings` に残します。

| model | field |
| --- | --- |
| `SpecDoc` | `module`、`layer`、`cases`、`raw`、`warnings` |
| `SpecCase` | `id`、`observation`、`given`、`when`、`then`、`priority`、`automation`、`mode`、`route` |

仕様 table には `ID`、`Observation`、`Given`、`When`、`Then` column が必要です。有効な layer は `contract`、`unit`、`integration`、`e2e`、`api`、`ui`、`data`、`cli` です。有効な mode は `mock`、`live`、`hybrid` です。未知の値は warning になり、`Priority` は `P0` から `P3` 以外なら `P2` になります。

## pytest plugin

entry point `kiwa_test_py.plugin` は session scope の `kiwa_spec` fixture を提供します。`KIWA_MODULE` と `KIWA_LAYER` が両方ある場合は `tests/spec/<layer>/test-spec-<module>.md` を選びます。片方でもない場合は `tests/spec` 以下で最初に見つかった `test-spec-*.md` を使います。file がなければ fixture は `None` です。

探索順に依存した CI を避けるため、CI では両方の環境変数を指定し、test 内では `kiwa_spec is not None` を確認してください。

## HTTP adapter

`requests_adapter(base_url="", **kwargs)` は同期 `RequestsAdapter`、`httpx_adapter(base_url="", **kwargs)` は `HttpxAdapter` を返します。どちらも `get`、`post`、`put`、`delete`、`patch` を `request` へ委譲します。

relative path は base URL の末尾 slash を除いて先頭 slash を補い、absolute `http://` と `https://` URL はそのまま使います。`RequestsAdapter` は内部 `requests.Session`、`HttpxAdapter` は同期 `httpx.Client` を既定で作成します。

| adapter | option | lifecycle |
| --- | --- | --- |
| `RequestsAdapter` | `session` を注入できる | `close` は session の `close` を呼ぶ |
| `HttpxAdapter` | `client` または `async_client=True` | sync client は `close` を呼ぶ |

`async_client=True` の request は awaitable です。一方で `HttpxAdapter.close` は injected `AsyncClient` の `aclose` を await しません。async client の所有者は利用側で `await client.aclose()` を呼んでください。

`requests` または `httpx` を解決できない場合、対応する extra の install を促す `RuntimeError` が constructor から送出されます。

## dependency

Python 3.10 以降が必要です。base dependency は pytest、requests、httpx です。`fastapi` extra は FastAPI と uvicorn、`cov` extra は pytest-cov を加えます。FastAPI TestClient helper はこの package の public API ではありません。

## 全 API の宣言

public export と docstring は [package root](https://github.com/cardene777/kiwa/blob/main/kiwa-py/kiwa_test_py/__init__.py)、[parser](https://github.com/cardene777/kiwa/blob/main/kiwa-py/kiwa_test_py/parser.py)、[adapter](https://github.com/cardene777/kiwa/blob/main/kiwa-py/kiwa_test_py/adapters.py)、[plugin](https://github.com/cardene777/kiwa/blob/main/kiwa-py/kiwa_test_py/plugin.py) にあります。

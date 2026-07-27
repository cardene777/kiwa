# kiwa-test-py を始める

ここでは `tests/spec/api/test-spec-items.md` にある仕様表を読み、必要な case を一つ確認します。先に仕様の内容を parser で検証しておくと、HTTP test を書く前に column の不足や未知の mode を見つけられます。

## インストールする

Python 3.10 以降の virtual environment に package を追加します。

```bash
python -m pip install kiwa-test-py
```

macOS や Linux で `python` command が見つからない場合は、同じ virtual environment を指す `python3` に置き換えます。たとえば `python3 -m pip install kiwa-test-py` と `python3 -m pytest` を組にして使ってください。Windows では通常 `python` を使います。

base install には pytest、requests、httpx が含まれます。coverage report が必要な project だけ `python -m pip install 'kiwa-test-py[cov]'` を使います。FastAPI と uvicorn は optional extra ですが、FastAPI TestClient はこの package の public API ではありません。

## 仕様を用意する

次の file を作成します。

```markdown
- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-API-001 | list items | items exist | GET items | 200 and item list | P0 | yes | mock | /api/items |
```

file path は `tests/spec/api/test-spec-items.md` にします。table には最低でも `ID`、`Observation`、`Given`、`When`、`Then` が必要です。`Priority`、`Automation`、`Mode`、`Route` は利用目的に応じて追加します。

## 最初の test を書く

`tests/test_items_spec.py` に次を置きます。

```python
from pathlib import Path

from kiwa_test_py import parse_spec


def test_items_spec_is_usable():
    markdown = Path("tests/spec/api/test-spec-items.md").read_text(encoding="utf-8")
    spec = parse_spec(markdown)

    assert spec.warnings == []
    case = next(item for item in spec.cases if item.id == "T-API-001")
    assert case.route == "/api/items"
    assert case.automation == "yes"
```

この test は HTTP request を送らず、仕様の format と case selection だけを確認します。`parse_spec` は table の欠落や未知の layer、mode を例外にせず `warnings` に残します。そのため `spec.warnings == []` を assertion に含めることで、見た目だけの test になるのを防ぎます。

## 実行して確認する

```bash
pytest -q tests/test_items_spec.py
```

次のように一件が通れば、仕様表から `T-API-001` を選び、route と automation を読めています。

```text
1 passed
```

仕様 table が存在しない場合は `cases` が空になり、`warnings` に `no test case table found` が入ります。`next` はその場合に `StopIteration` になるため、任意の仕様を扱う test では `if spec.warnings` を先に検査するか、明示的に skip してください。

## skill との関係

`kiwa-test-py` 用に Python test を直接生成する companion skill はありません。`/kiwa:kiwa-python` は TypeScript package の `@kiwa-lab/python` を対象にする別の skill です。仕様 Markdown を作る場合は、初回だけ kiwa plugin を導入して対象の API や画面に合う design skill を実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

生成した `tests/spec/<layer>/test-spec-<module>.md` を review してから、この package の parser と pytest plugin に渡してください。

次は [pytest で仕様を選ぶ](./how-to) で、CI から一つの仕様 file を固定し、HTTP test に渡します。

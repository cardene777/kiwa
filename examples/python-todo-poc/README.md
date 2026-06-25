# python-todo-poc

`kiwa-test-py` の動作確認 example。 FastAPI で簡易 todo API を作り、 1 つの kiwa-design spec markdown から pytest 経由で API 統合テストを drive する。

## 構成

```
examples/python-todo-poc/
├── app/
│   └── main.py                            # FastAPI app (GET/POST/DELETE /todos)
├── tests/
│   ├── conftest.py                        # KIWA_MODULE / KIWA_LAYER 設定
│   ├── spec/integration/
│   │   └── test-spec-todos.md             # kiwa-design 9 column spec
│   └── test_todos_api.py                  # kiwa_spec fixture + TestClient で spec 駆動
├── pyproject.toml
└── README.md
```

## 起動

```bash
cd examples/python-todo-poc
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'   # kiwa-test-py + fastapi + pytest 一式

pytest -v                  # 全 case 走らせる
pytest -v -k T-TODO-001    # spec の特定 case のみ
```

## ポイント

- `tests/spec/integration/test-spec-todos.md` は kiwa-design skill 出力と同 format
- `kiwa_spec` fixture が `tests/spec/**` を auto-scan、 `SpecDoc` を返す
- test 本体は spec の `automation == "yes"` の case を loop で TestClient に叩く
- FastAPI 用 extras (`pip install 'kiwa-test-py[fastapi]'`) で `fastapi.testclient.TestClient` 利用可能

`kiwa-test-py` の package detail は [`kiwa-py/README.md`](../../kiwa-py/README.md)、 cookbook は [`docs/en/cookbook/python-pytest.md`](../../docs/en/cookbook/python-pytest.md) 参照。

# test-spec-counter-api.rust-axum.md (PoC for Issue #596 v1.5-5)

> Layer 1 (`/kiwa-design --module counter-api --layer rust-axum`) 出力サンプル — `kiwa-test-rs` v0.2 の `kiwa::axum::test_app(router)` + `TestApp::request(HttpMethod, path).send()` で消費される最小 Rust axum integration test spec。

- module: counter-api
- layer: rust-axum

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ、 axum `Router` 実装。 4 endpoint。

- `GET /counter` → `200 + { value: i64 }`
- `POST /counter/increment` → `200 + { value: i64 }` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + { value: i64 }`
- `POST /counter/reset` → `200 + { value: 0 }`

実装は `Router::new().route("/counter", get(handler))....with_state(state)` で構築、 `kiwa::axum::test_app(router)` で `TestApp` を起動し `tower::ServiceExt::oneshot` 経由で in-process 駆動 (real port なし、 TIME_WAIT flakiness 回避)。 `TestApp` は private tokio runtime を持ち caller thread は sync、 Drop で runtime 自動解放。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- axum `Router` は state injection (`Router::with_state(Arc<AppState>)`) で counter state を共有
- `TestApp::request(HttpMethod, path)` chain で `header()` / `body()` / `json()` を組み立て `send()` で `TestResponse` を取得
- `TestResponse` は `status()` / `body_str()` / `json::<T>()` / `headers()` で response を全 buffer 解析

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC API |
| セキュリティ影響 | 中 | request header に Authorization 等 sensitive data を含む可能性 |
| データ破壊リスク | 低 | counter state は in-memory のみ、 test ごとに新規 |
| 利用頻度 | 中 | sample 経路 + framework 比較用途 |
| 過去障害履歴 | 低 | 該当なし |

総合リスク = 中 (security 軸)。

## 推奨テスト構成

- runner ... `cargo test --features axum` (kiwa-test-rs default feature 経路、 tower + tokio runtime + axum 0.7+)
- 観点 ... 正常系 (4 endpoint の 200 応答) / 異常系 (404 / 405 / extractor reject) / state injection / middleware layer
- 自動化方針 ... 全 axum integration test 自動化、 `oneshot` 駆動で test ごと 5-20ms 程度 (port bind なし)

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答 + JSON body)
- 異常系 (定義外 path で 404、 定義 method 外で 405、 extractor 失敗で 400)
- 状態遷移 (increment 3 回 → reset → value=0、 state は `Router::with_state` 経由で共有)
- 入力バリデーション (Content-Type 不一致 / body parse 失敗で 400 系)
- セキュリティ (Authorization header 検証、 middleware で gate)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-RS-AX-001 | 正常系 — GET /counter で 200 | Router::new().route("/counter", get(get_counter)).with_state(state) | let test = test_app(router); let resp = test.request(HttpMethod::Get, "/counter").send(); | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 0); | P0 | yes | mock | /counter |
| T-RS-AX-002 | 正常系 — POST /counter/increment で 200 + value 1 | route 登録 (POST /counter/increment) + initial state value=0 | test.request(HttpMethod::Post, "/counter/increment").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 1); | P0 | yes | mock | /counter/increment |
| T-RS-AX-003 | 正常系 — POST /counter/decrement で 200 + value -1 | initial state value=0 | test.request(HttpMethod::Post, "/counter/decrement").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, -1); | P0 | yes | mock | /counter/decrement |
| T-RS-AX-004 | 正常系 — POST /counter/reset で 200 + value 0 | initial state value=5 | test.request(HttpMethod::Post, "/counter/reset").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 0); | P0 | yes | mock | /counter/reset |
| T-RS-AX-005 | 異常系 — 未定義 path で 404 | Router::new().route("/counter", get(...)) のみ | test.request(HttpMethod::Get, "/unknown").send() | assert_kiwa_eq!(resp.status(), 404); | P1 | yes | mock | /unknown |
| T-RS-AX-006 | 異常系 — 定義 method 外で 405 | Router で GET /counter のみ登録 | test.request(HttpMethod::Post, "/counter").send() | assert_kiwa_eq!(resp.status(), 405); | P1 | yes | mock | /counter |
| T-RS-AX-007 | 状態遷移 — increment 3 回 → reset → value=0 | initial state value=0 | 4 連続 send (incr x3 + reset) | 4 連続 response が status=200、 最終 value=0 | P1 | yes | mock | (連携) |
| T-RS-AX-008 | セキュリティ — Authorization header gate | Router::new().route(...).layer(auth_middleware) + valid token | test.request(...).header("Authorization", "Bearer valid").send() | assert_kiwa_eq!(resp.status(), 200); | P2 | yes | mock | /counter |
| T-RS-AX-009 | セキュリティ — Authorization header 欠落で 401 | 同上、 header なし | test.request(HttpMethod::Get, "/counter").send() (header なし) | assert_kiwa_eq!(resp.status(), 401); | P2 | yes | mock | /counter |

## 自動化すべきテスト

- T-RS-AX-001 〜 T-RS-AX-009 全 9 件 ... `cargo test --features axum` で deterministic 実行、 `oneshot` 駆動で port なし、 test ごと 5-20ms 程度。 並列 test (`cargo test -- --test-threads=N`) でも port 衝突なし

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 test_app 起動なし、 reqwest 直叩き) 経路は別 fixture 経路で未記述
- `Router::nest("/api", sub_router)` 経路は本 PoC では未 cover、 v1.5-6 (Issue #597) で `--mode axum` 経路で nested router 観点追加予定

# test-spec-counter-api.rust-actix.md (PoC for Issue #596 v1.5-5)

> Layer 1 (`/kiwa-design --module counter-api --layer rust-actix-web`) 出力サンプル — `kiwa-test-rs` v0.2 の `kiwa::actix::test_app(factory)` + `TestApp::request(HttpMethod, path).send()` で消費される最小 Rust actix-web integration test spec。

- module: counter-api
- layer: rust-actix-web

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ、 actix-web `App` 実装。 4 endpoint。

- `GET /counter` → `200 + { value: i64 }`
- `POST /counter/increment` → `200 + { value: i64 }` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + { value: i64 }`
- `POST /counter/reset` → `200 + { value: 0 }`

実装は `|| App::new().app_data(web::Data::new(state)).service(get_counter).service(increment_counter)` で factory closure 経由、 `kiwa::actix::test_app(factory)` で `TestApp` 起動 + `actix_web::test::call_service` 経由 in-process 駆動 (real port なし、 TIME_WAIT flakiness 回避)。 `App` は `!Clone` のため factory closure 必須、 `TestApp` は private actix-rt runtime + 初期化済 service を所有し caller thread は sync、 Drop で runtime + service 解放。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- actix-web `App` は state injection (`App::app_data(web::Data::new(Arc<AppState>))`) で counter state を共有
- `TestApp::request(HttpMethod, path)` chain で `header()` / `body()` を組み立て `send()` で `TestResponse` を取得
- `TestResponse` の surface は axum adapter と 1:1 一致 (`status()` / `body_str()` / `json::<T>()` / `headers()`)、 spec の表 + assertion code を 2 framework 間で共有可能

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC API |
| セキュリティ影響 | 中 | request header に Authorization 等 sensitive data を含む可能性 |
| データ破壊リスク | 低 | counter state は in-memory のみ、 test ごとに新規 (factory closure 経由) |
| 利用頻度 | 中 | sample 経路 + framework 比較用途 |
| 過去障害履歴 | 低 | 該当なし |

総合リスク = 中 (security 軸)。

## 推奨テスト構成

- runner ... `cargo test --features actix` (kiwa-test-rs default feature 経路、 actix-rt + actix-web 4+)
- 観点 ... 正常系 (4 endpoint の 200 応答) / 異常系 (404 / 405 / extractor reject) / Data extractor / middleware (`wrap`)
- 自動化方針 ... 全 actix integration test 自動化、 `call_service` 駆動で test ごと 5-30ms 程度 (port bind なし、 actix-rt 起動コストで axum よりわずかに遅い)

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答 + JSON body)
- 異常系 (定義外 path で 404、 定義 method 外で 405、 extractor 失敗で 400)
- 状態遷移 (increment 3 回 → reset → value=0、 state は `web::Data` 経由で共有)
- 入力バリデーション (Content-Type 不一致 / body parse 失敗で 400 系)
- セキュリティ (Authorization header 検証、 `App::wrap` で middleware gate)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-RS-AC-001 | 正常系 — GET /counter で 200 | || App::new().app_data(web::Data::new(state.clone())).service(get_counter) | let test = test_app(factory); let resp = test.request(HttpMethod::Get, "/counter").send(); | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 0); | P0 | yes | mock | /counter |
| T-RS-AC-002 | 正常系 — POST /counter/increment で 200 + value 1 | factory closure で increment route 登録 + initial state value=0 | test.request(HttpMethod::Post, "/counter/increment").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 1); | P0 | yes | mock | /counter/increment |
| T-RS-AC-003 | 正常系 — POST /counter/decrement で 200 + value -1 | initial state value=0 | test.request(HttpMethod::Post, "/counter/decrement").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, -1); | P0 | yes | mock | /counter/decrement |
| T-RS-AC-004 | 正常系 — POST /counter/reset で 200 + value 0 | initial state value=5 | test.request(HttpMethod::Post, "/counter/reset").send() | assert_kiwa_eq!(resp.status(), 200); assert_kiwa_eq!(resp.json::<CounterDto>()?.value, 0); | P0 | yes | mock | /counter/reset |
| T-RS-AC-005 | 異常系 — 未定義 path で 404 | factory closure で /counter のみ登録 | test.request(HttpMethod::Get, "/unknown").send() | assert_kiwa_eq!(resp.status(), 404); | P1 | yes | mock | /unknown |
| T-RS-AC-006 | 異常系 — 定義 method 外で 405 | App で GET /counter のみ登録 | test.request(HttpMethod::Post, "/counter").send() | assert_kiwa_eq!(resp.status(), 405); | P1 | yes | mock | /counter |
| T-RS-AC-007 | 状態遷移 — increment 3 回 → reset → value=0 | initial state value=0、 web::Data で共有 | 4 連続 send (incr x3 + reset) | 4 連続 response が status=200、 最終 value=0 | P1 | yes | mock | (連携) |
| T-RS-AC-008 | セキュリティ — Authorization header gate | App::new().service(...).wrap(auth_middleware) + valid token | test.request(...).header("Authorization", "Bearer valid").send() | assert_kiwa_eq!(resp.status(), 200); | P2 | yes | mock | /counter |
| T-RS-AC-009 | セキュリティ — Authorization header 欠落で 401 | 同上、 header なし | test.request(HttpMethod::Get, "/counter").send() (header なし) | assert_kiwa_eq!(resp.status(), 401); | P2 | yes | mock | /counter |

## 自動化すべきテスト

- T-RS-AC-001 〜 T-RS-AC-009 全 9 件 ... `cargo test --features actix` で deterministic 実行、 `call_service` 駆動で port なし、 test ごと 5-30ms 程度。 並列 test でも port 衝突なし (factory closure が test ごとに新規 App 構築)

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 test_app 起動なし、 reqwest 直叩き) 経路は別 fixture 経路で未記述
- `web::scope("/api").service(...)` の scope nesting 経路は本 PoC では未 cover、 v1.5-6 (Issue #597) で `--mode actix-web` 経路で scope 観点追加予定
- axum adapter (`test-spec-counter-api.rust-axum.md`) と Then / Given column を共有して 2 framework の挙動一致確認テスト追加可能 (`assertions.rs` module 化 + 各 framework から呼出)

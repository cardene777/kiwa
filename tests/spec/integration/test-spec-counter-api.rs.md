# test-spec-counter-api.rs.md (PoC for Issue #580 v1.4-5)

> Layer 1 (`/kiwa-design --module counter-api --layer rust-integration`) 出力サンプル — `kiwa-test-rs` の `kiwa::integration::mock_server` + reqwest で消費される最小 Rust integration test spec。

- module: counter-api
- layer: rust-integration

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ。 4 endpoint。

- `GET /counter` → `200 + { value: i64 }`
- `POST /counter/increment` → `200 + { value: i64 }` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + { value: i64 }`
- `POST /counter/reset` → `200 + { value: 0 }`

実装は `reqwest::blocking::Client` で hyper mock_server を叩く、 `kiwa::integration::mock_server(MockServerOpts::default().with_route(Route::new(HttpMethod::Get, "/counter", handler)))` で route table seed + request recorder 利用 (`mock_server` は sync で内部 tokio runtime を持つ)。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- mock_server は in-memory hyper backend で起動、 port は OS 割当
- recorder で method / path / body を session 内 capture、 test 終了で `Drop` cleanup

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC API |
| セキュリティ影響 | 中 | recorder に Authorization header 等 sensitive data 残存可能性 |
| データ破壊リスク | 低 | counter state は in-memory のみ |
| 利用頻度 | 中 | sample 経路 |
| 過去障害履歴 | 低 | 該当なし |

総合リスク = 中 (security 軸)。

## 推奨テスト構成

- runner ... cargo test --features integration (kiwa-test-rs default feature 経路、 hyper + tokio runtime)
- 観点 ... 正常系 / 異常系 (404 / 405 / 5xx) / recorder 検証 / multi-route 並列
- 自動化方針 ... 全 integration test 自動化、 mock_server 起動コストで 100ms 程度

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答)
- 異常系 (定義外 path で 404、 定義 method 外で 405)
- recorder 検証 (method / path / body 完全一致、 件数一致)
- multi-route (1 mock_server に複数 route 同居、 並列 reqwest send で順序非依存)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-RS-I-001 | 正常系 — GET /counter で 200 | MockServerOpts::default().with_route(Route::new(HttpMethod::Get, "/counter", \|_req\| MockResponse::json(br#"{"value":0}"#.to_vec()))) | let server = mock_server(opts); let r = client.get(&format!("{}/counter", server.base_url())).send()?; | assert_kiwa_eq!(r.status().as_u16(), 200); assert_kiwa_eq!(r.json::<Value>()?["value"], 0); | P0 | yes | mock | /counter |
| T-RS-I-002 | 正常系 — POST /counter/increment で 200 + value 1 | with_route で POST /counter/increment → { value: 1 } | client.post(&format!("{}/counter/increment", server.base_url())).send()? | assert_kiwa_eq!(r.status().as_u16(), 200); assert_kiwa_eq!(json["value"], 1); | P0 | yes | mock | /counter/increment |
| T-RS-I-003 | 異常系 — 未定義 path で 404 | with_route で /counter のみ | client.get(&format!("{}/unknown", server.base_url())).send()? | assert_kiwa_eq!(r.status().as_u16(), 404); | P1 | yes | mock | /unknown |
| T-RS-I-004 | recorder 検証 — request 1 件 capture | with_route で GET /counter | client.get(&format!("{}/counter", server.base_url())).send()?; let reqs = server.recorded_requests(); | assert_kiwa_eq!(server.request_count(), 1); assert_kiwa_eq!(reqs[0].method, HttpMethod::Get); assert_kiwa_eq!(reqs[0].path, "/counter"); | P1 | yes | mock | /counter |
| T-RS-I-005 | multi-route — 4 endpoint 並列 reqwest send | 4 endpoint 全てを with_route 連結 | std::thread::spawn で 4 並列 reqwest::blocking send | 全 4 response が 200、 server.request_count() == 4 | P2 | yes | mock | (全 4) |

## 自動化すべきテスト

- T-RS-I-001 〜 T-RS-I-005 全 5 件 ... cargo test --features integration で deterministic 実行、 hyper port は OS 割当で並列衝突なし

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 mock_server 起動なし) 経路は v0.2 では mock のみ、 live は別 fixture で外部 URL 指定する経路を本 spec では未記述

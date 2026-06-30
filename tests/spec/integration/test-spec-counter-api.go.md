# test-spec-counter-api.go.md (PoC for Issue #580 v1.4-5)

> Layer 1 (`/kiwa-design --module counter-api --layer go-integration`) 出力サンプル — `kiwa-test-go` の `kiwa.NewMockServer` + http.Client で消費される最小 Go integration test spec。

- module: counter-api
- layer: go-integration

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ。 4 endpoint。

- `GET /counter` → `200 + {"value": 0}`
- `POST /counter/increment` → `200 + {"value": int64}` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + {"value": int64}`
- `POST /counter/reset` → `200 + {"value": 0}`

実装は `http.Client` で `kiwa.NewMockServer(t, opts)` 起動の `httptest.Server` を叩く、 route table seed + request recorder 利用。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- mock_server は `httptest.NewServer` 起動 (port は OS 割当)
- recorder で method / path / body を session 内 capture、 `t.Cleanup` で port release

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

- runner ... go test ./... (kiwa-test-go の `kiwa.NewMockServer`、 standard library `net/http/httptest` のみ依存、 zero external deps)
- 観点 ... 正常系 / 異常系 (404 / 405) / recorder 検証 / multi-route 並列 (`t.Parallel`)
- 自動化方針 ... 全 integration test 自動化、 httptest.NewServer 起動コストで 10ms 程度

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答)
- 異常系 (定義外 path で 404、 定義 method 外で 405 + Allow header)
- recorder 検証 (method / path / body 完全一致、 件数一致)
- multi-route (1 mock_server に複数 route 同居、 並列 http.Client send で順序非依存)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-GO-I-001 | 正常系 — GET /counter で 200 | kiwa.MockServerOpts{}.WithRoute(kiwa.Route{ Method: kiwa.MethodGet, Path: "/counter", Handler: handler_fn }) | server := kiwa.NewMockServer(t, opts); resp, _ := http.Get(server.URL() + "/counter") | kiwa.AssertEqual(t, resp.StatusCode, 200); body decode で value == int64(0) | P0 | yes | mock | /counter |
| T-GO-I-002 | 正常系 — POST /counter/increment で 200 + value 1 | WithRoute で POST /counter/increment → { value: 1 } | http.Post(server.URL() + "/counter/increment", ...) | kiwa.AssertEqual(t, resp.StatusCode, 200); body decode で value == int64(1) | P0 | yes | mock | /counter/increment |
| T-GO-I-003 | 異常系 — 未定義 path で 404 | WithRoute で /counter のみ | http.Get(server.URL() + "/unknown") | kiwa.AssertEqual(t, resp.StatusCode, 404) | P1 | yes | mock | /unknown |
| T-GO-I-004 | recorder 検証 — request 1 件 capture | WithRoute で GET /counter | http.Get で 1 request; reqs := server.RecordedRequests() | kiwa.AssertEqual(t, server.RequestCount(), 1); reqs[0].Method == kiwa.MethodGet; reqs[0].Path == "/counter" | P1 | yes | mock | /counter |
| T-GO-I-005 | multi-route — 4 endpoint 並列 t.Parallel send | WithRoute で 4 endpoint 全て | t.Parallel() で 4 sub-test 並列 http.Client send | 全 4 response が 200、 server.RequestCount() == 4 (sub-test 間で sync) | P2 | yes | mock | (全 4) |

## 自動化すべきテスト

- T-GO-I-001 〜 T-GO-I-005 全 5 件 ... go test の default 経路、 net/http/httptest は standard library のみで deterministic、 port OS 割当で並列衝突なし

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 NewMockServer なし) 経路は v0.1 では mock のみ、 live は別 fixture で外部 URL 指定する経路を本 spec では未記述

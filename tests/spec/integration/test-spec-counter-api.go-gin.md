# test-spec-counter-api.go-gin.md (PoC for Issue #596 v1.5-5)

> Layer 1 (`/kiwa-design --module counter-api --layer go-gin`) 出力サンプル — `kiwa-test-go` v0.2 の `kiwa_gin.NewTestServer(t, engine)` + `srv.Request(method, path).Send()` で消費される最小 Go Gin integration test spec。

- module: counter-api
- layer: go-gin

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ、 Gin `*gin.Engine` 実装。 4 endpoint。

- `GET /counter` → `200 + { "value": int64 }`
- `POST /counter/increment` → `200 + { "value": int64 }` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + { "value": int64 }`
- `POST /counter/reset` → `200 + { "value": 0 }`

実装は `gin.SetMode(gin.TestMode); engine := gin.New(); engine.GET("/counter", getCounter); engine.POST("/counter/increment", incrementCounter); ...` で engine 構築、 `kiwa_gin.NewTestServer(t, engine)` で `*TestServer` 起動 + `httptest.NewRecorder` + `engine.ServeHTTP` 経由 in-process 駆動 (real port なし、 TIME_WAIT flakiness 回避、 Gin 公式 testing docs と同一手法)。 `*TestServer` は engine + request recorder を所有し `t.Cleanup` で auto-cleanup。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- Gin `*gin.Engine` は state injection (`engine.Use(stateMiddleware)` or closure capture) で counter state を共有
- `srv.Request(method, path)` chain で `Header(k, v)` / `Body(b)` / `JSON(b)` を組み立て `Send()` で `*Response` を取得
- `*Response` の surface は `StatusCode()` / `Headers()` / `Body()` / `BodyString()` / `JSON(&dto)` で response を全 buffer 解析、 echo adapter と 1:1 一致 (test code 共有可能)
- `srv.RecordedRequests()` は v1.4 `kiwa.RecordedRequest` shape を re-export、 v1.4 mock_server と assertion 互換

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC API |
| セキュリティ影響 | 中 | request header に Authorization 等 sensitive data を含む可能性 + recorder に残存 |
| データ破壊リスク | 低 | counter state は in-memory のみ、 test ごとに engine 新規 |
| 利用頻度 | 中 | sample 経路 + framework 比較用途 |
| 過去障害履歴 | 低 | 該当なし |

総合リスク = 中 (security 軸)。

## 推奨テスト構成

- runner ... `go test ./...` (kiwa-test-go default、 Gin v1.10+)
- 観点 ... 正常系 (4 endpoint の 200 応答) / 異常系 (404 / 405) / middleware / route group / param binding / `t.Parallel()` 並列
- 自動化方針 ... 全 Gin integration test 自動化、 `ServeHTTP` 駆動で test ごと 1-5ms 程度 (port bind なし、 Go の light runtime)

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答 + JSON body)
- 異常系 (定義外 path で 404、 定義 method 外で 405)
- 状態遷移 (increment 3 回 → reset → value=0、 state は closure capture or middleware 経由で共有)
- 入力バリデーション (Content-Type 不一致 / body parse 失敗で 400 系)
- セキュリティ (Authorization header 検証、 `engine.Use` で middleware gate)
- 並行処理 (`t.Parallel()` で並列実行時、 engine を test ごと新規生成して route registration race 回避)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-GO-GIN-001 | 正常系 — GET /counter で 200 | gin.SetMode(gin.TestMode); engine := gin.New(); engine.GET("/counter", getCounter) | srv := kiwa_gin.NewTestServer(t, engine); resp := srv.Request(kiwa.MethodGET, "/counter").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); var dto CounterDto; resp.JSON(&dto); kiwa.AssertEqual(t, dto.Value, int64(0)) | P0 | yes | mock | /counter |
| T-GO-GIN-002 | 正常系 — POST /counter/increment で 200 + value 1 | engine + POST /counter/increment route + initial state value=0 | srv.Request(kiwa.MethodPOST, "/counter/increment").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); var dto CounterDto; resp.JSON(&dto); kiwa.AssertEqual(t, dto.Value, int64(1)) | P0 | yes | mock | /counter/increment |
| T-GO-GIN-003 | 正常系 — POST /counter/decrement で 200 + value -1 | initial state value=0 | srv.Request(kiwa.MethodPOST, "/counter/decrement").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); kiwa.AssertEqual(t, dto.Value, int64(-1)) | P0 | yes | mock | /counter/decrement |
| T-GO-GIN-004 | 正常系 — POST /counter/reset で 200 + value 0 | initial state value=5 | srv.Request(kiwa.MethodPOST, "/counter/reset").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); kiwa.AssertEqual(t, dto.Value, int64(0)) | P0 | yes | mock | /counter/reset |
| T-GO-GIN-005 | 異常系 — 未定義 path で 404 | engine.GET("/counter", ...) のみ | srv.Request(kiwa.MethodGET, "/unknown").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 404) | P1 | yes | mock | /unknown |
| T-GO-GIN-006 | 異常系 — 定義 method 外で 405 | engine で GET /counter のみ登録 | srv.Request(kiwa.MethodPOST, "/counter").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 405) | P1 | yes | mock | /counter |
| T-GO-GIN-007 | 状態遷移 — increment 3 回 → reset → value=0 | initial state value=0、 closure capture で共有 | 4 連続 Send (incr x3 + reset) | 4 連続 StatusCode 200、 最終 value=0 | P1 | yes | mock | (連携) |
| T-GO-GIN-008 | recorder 検証 — request 1 件 capture | engine.GET("/counter", ...) | srv.Request(kiwa.MethodGET, "/counter").Header("Authorization", "Bearer x").Send() | reqs := srv.RecordedRequests(); kiwa.AssertEqual(t, len(reqs), 1); kiwa.AssertEqual(t, reqs[0].Method, kiwa.MethodGET); kiwa.AssertEqual(t, reqs[0].Path, "/counter"); kiwa.AssertEqual(t, reqs[0].Headers.Get("Authorization"), "Bearer x") | P1 | yes | mock | /counter |
| T-GO-GIN-009 | セキュリティ — Authorization header gate | engine.Use(authMiddleware); engine.GET("/counter", ...) + valid token | srv.Request(kiwa.MethodGET, "/counter").Header("Authorization", "Bearer valid").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200) | P2 | yes | mock | /counter |
| T-GO-GIN-010 | セキュリティ — Authorization header 欠落で 401 | 同上、 header なし | srv.Request(kiwa.MethodGET, "/counter").Send() (header なし) | kiwa.AssertEqual(t, resp.StatusCode(), 401) | P2 | yes | mock | /counter |
| T-GO-GIN-011 | 並行処理 — `t.Parallel()` で 10 並列 send | engine を test ごと新規生成、 t.Parallel() 宣言 | 10 goroutine で各 Send | 全 10 response 200、 監視期間内に race 検出なし (`go test -race`) | P2 | yes | mock | /counter |

## 自動化すべきテスト

- T-GO-GIN-001 〜 T-GO-GIN-011 全 11 件 ... `go test ./...` で deterministic 実行、 `ServeHTTP` 駆動で port なし、 test ごと 1-5ms 程度。 `t.Parallel()` でも engine 新規生成で route registration race 回避

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 NewTestServer 起動なし、 http.Client 直叩き) 経路は別 fixture 経路で未記述
- `engine.Group("/api")` の route group 経路は本 PoC では未 cover、 v1.5-6 (Issue #597) で `--mode gin` 経路で group 観点追加予定
- echo adapter (`test-spec-counter-api.go-echo.md`) と assertion code 完全互換、 同 spec を `srv := kiwa_gin.NewTestServer(t, engine)` ↔ `srv := kiwa_echo.NewTestServer(t, e)` 切替で 2 framework の挙動一致確認テスト追加可能

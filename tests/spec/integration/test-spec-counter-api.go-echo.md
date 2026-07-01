# test-spec-counter-api.go-echo.md (PoC for Issue #596 v1.5-5)

> Layer 1 (`/kiwa-design --module counter-api --layer go-echo`) 出力サンプル — `kiwa-test-go` v0.2 の `kiwa_echo.NewTestServer(t, e)` + `srv.Request(method, path).Send()` で消費される最小 Go Echo integration test spec。

- module: counter-api
- layer: go-echo

## 対象機能

`counter-api` — `counter` 機能を HTTP API で公開した integration スコープ、 Echo `*echo.Echo` 実装。 4 endpoint。

- `GET /counter` → `200 + { "value": int64 }`
- `POST /counter/increment` → `200 + { "value": int64 }` (Counter++ 後の値)
- `POST /counter/decrement` → `200 + { "value": int64 }`
- `POST /counter/reset` → `200 + { "value": 0 }`

実装は `e := echo.New(); e.GET("/counter", getCounter); e.POST("/counter/increment", incrementCounter); ...` で Echo instance 構築、 `kiwa_echo.NewTestServer(t, e)` で `*TestServer` 起動 + `httptest.NewRecorder` + `e.ServeHTTP` 経由 in-process 駆動 (real port なし、 TIME_WAIT flakiness 回避、 Echo 公式 testing docs `https://echo.labstack.com/docs/testing` と同一手法)。 `*TestServer` は Echo + request recorder を所有し `t.Cleanup` で auto-cleanup。

## 仕様の要約

- 全 endpoint は JSON body return、 status は default 200
- Echo `*echo.Echo` は state injection (`e.Use(stateMiddleware)` or closure capture) で counter state を共有
- `srv.Request(method, path)` chain で `Header(k, v)` / `Body(b)` / `JSON(b)` を組み立て `Send()` で `*Response` を取得
- `*Response` の surface は `StatusCode()` / `Headers()` / `Body()` / `BodyString()` / `JSON(&dto)` で response を全 buffer 解析、 Gin adapter と 1:1 一致 (test code 共有可能、 import の `kiwa_gin` ↔ `kiwa_echo` 切替のみで挙動同一確認)
- `srv.RecordedRequests()` は v1.4 `kiwa.RecordedRequest` shape を re-export、 v1.4 mock_server と assertion 互換

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC API |
| セキュリティ影響 | 中 | request header に Authorization 等 sensitive data を含む可能性 + recorder に残存 |
| データ破壊リスク | 低 | counter state は in-memory のみ、 test ごとに Echo 新規 |
| 利用頻度 | 中 | sample 経路 + framework 比較用途 |
| 過去障害履歴 | 低 | 該当なし |

総合リスク = 中 (security 軸)。

## 推奨テスト構成

- runner ... `go test ./...` (kiwa-test-go default、 Echo v4+)
- 観点 ... 正常系 (4 endpoint の 200 応答) / 異常系 (404 / 405) / middleware / group / param binding (`:param` / `*` glob) / `t.Parallel()` 並列
- 自動化方針 ... 全 Echo integration test 自動化、 `ServeHTTP` 駆動で test ごと 1-5ms 程度 (port bind なし、 Go の light runtime、 Gin と同等性能)

## テスト観点一覧

- 正常系 (4 endpoint の 200 応答 + JSON body)
- 異常系 (定義外 path で 404、 定義 method 外で 405)
- 状態遷移 (increment 3 回 → reset → value=0、 state は closure capture or middleware 経由で共有)
- 入力バリデーション (Content-Type 不一致 / body parse 失敗で 400 系)
- セキュリティ (Authorization header 検証、 `e.Use` で middleware gate)
- 並行処理 (`t.Parallel()` で並列実行時、 Echo を test ごと新規生成して route registration race 回避、 Gin と同じ制約)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-GO-ECHO-001 | 正常系 — GET /counter で 200 | e := echo.New(); e.GET("/counter", getCounter) | srv := kiwa_echo.NewTestServer(t, e); resp := srv.Request(kiwa.MethodGET, "/counter").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); var dto CounterDto; resp.JSON(&dto); kiwa.AssertEqual(t, dto.Value, int64(0)) | P0 | yes | mock | /counter |
| T-GO-ECHO-002 | 正常系 — POST /counter/increment で 200 + value 1 | e + POST /counter/increment route + initial state value=0 | srv.Request(kiwa.MethodPOST, "/counter/increment").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); var dto CounterDto; resp.JSON(&dto); kiwa.AssertEqual(t, dto.Value, int64(1)) | P0 | yes | mock | /counter/increment |
| T-GO-ECHO-003 | 正常系 — POST /counter/decrement で 200 + value -1 | initial state value=0 | srv.Request(kiwa.MethodPOST, "/counter/decrement").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); kiwa.AssertEqual(t, dto.Value, int64(-1)) | P0 | yes | mock | /counter/decrement |
| T-GO-ECHO-004 | 正常系 — POST /counter/reset で 200 + value 0 | initial state value=5 | srv.Request(kiwa.MethodPOST, "/counter/reset").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); kiwa.AssertEqual(t, dto.Value, int64(0)) | P0 | yes | mock | /counter/reset |
| T-GO-ECHO-005 | 異常系 — 未定義 path で 404 | e.GET("/counter", ...) のみ | srv.Request(kiwa.MethodGET, "/unknown").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 404) | P1 | yes | mock | /unknown |
| T-GO-ECHO-006 | 異常系 — 定義 method 外で 405 | e で GET /counter のみ登録 | srv.Request(kiwa.MethodPOST, "/counter").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 405) | P1 | yes | mock | /counter |
| T-GO-ECHO-007 | 状態遷移 — increment 3 回 → reset → value=0 | initial state value=0、 closure capture で共有 | 4 連続 Send (incr x3 + reset) | 4 連続 StatusCode 200、 最終 value=0 | P1 | yes | mock | (連携) |
| T-GO-ECHO-008 | recorder 検証 — request 1 件 capture | e.GET("/counter", ...) | srv.Request(kiwa.MethodGET, "/counter").Header("Authorization", "Bearer x").Send() | reqs := srv.RecordedRequests(); kiwa.AssertEqual(t, len(reqs), 1); kiwa.AssertEqual(t, reqs[0].Method, kiwa.MethodGET); kiwa.AssertEqual(t, reqs[0].Path, "/counter"); kiwa.AssertEqual(t, reqs[0].Headers.Get("Authorization"), "Bearer x") | P1 | yes | mock | /counter |
| T-GO-ECHO-009 | セキュリティ — Authorization header gate | e.Use(authMiddleware); e.GET("/counter", ...) + valid token | srv.Request(kiwa.MethodGET, "/counter").Header("Authorization", "Bearer valid").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200) | P2 | yes | mock | /counter |
| T-GO-ECHO-010 | セキュリティ — Authorization header 欠落で 401 | 同上、 header なし | srv.Request(kiwa.MethodGET, "/counter").Send() (header なし) | kiwa.AssertEqual(t, resp.StatusCode(), 401) | P2 | yes | mock | /counter |
| T-GO-ECHO-011 | 並行処理 — `t.Parallel()` で 10 並列 send | Echo を test ごと新規生成、 t.Parallel() 宣言 | 10 goroutine で各 Send | 全 10 response 200、 監視期間内に race 検出なし (`go test -race`) | P2 | yes | mock | /counter |
| T-GO-ECHO-012 | param binding — Echo 固有の `:param` matcher | e.GET("/counter/:id", getCounterByID) | srv.Request(kiwa.MethodGET, "/counter/42").Send() | kiwa.AssertEqual(t, resp.StatusCode(), 200); kiwa.AssertEqual(t, dto.ID, "42") | P2 | yes | mock | /counter/:id |

## 自動化すべきテスト

- T-GO-ECHO-001 〜 T-GO-ECHO-012 全 12 件 ... `go test ./...` で deterministic 実行、 `ServeHTTP` 駆動で port なし、 test ごと 1-5ms 程度。 `t.Parallel()` でも Echo 新規生成で route registration race 回避

## 手動確認でよいテスト

(なし)

## 不足している仕様

- live mode (実 endpoint、 NewTestServer 起動なし、 http.Client 直叩き) 経路は別 fixture 経路で未記述
- `e.Group("/api")` の group 経路は param binding を含めて本 PoC では一部 cover (T-GO-ECHO-012)、 v1.5-6 (Issue #597) で `--mode echo` 経路で group + nested group 観点追加予定
- Gin adapter (`test-spec-counter-api.go-gin.md`) と assertion code 完全互換、 同 spec を `srv := kiwa_gin.NewTestServer(t, engine)` ↔ `srv := kiwa_echo.NewTestServer(t, e)` 切替で 2 framework の挙動一致確認テスト追加可能

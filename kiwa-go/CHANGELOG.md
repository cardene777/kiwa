# kiwa-test-go

このファイルは [Keep a Changelog](https://keepachangelog.com/) スタイルで、
`kiwa-test-go` module の破壊的変更 / 追加機能 / 修正を release 単位で追う。

## v0.5.0 — v1.14 milestone (unreleased)

`kiwa-test-go` v0.5.0 は Iris (`kataras/iris/v12`) + go-chi (`go-chi/chi/v5`)
対応を軸にした polyglot 深化 release。 `kiwa-test-go/iris` +
`kiwa-test-go/chi` subpackage を追加、 v1.5+ の gin / echo / fiber と同一
`TestServer` contract を http.Handler 経由 (chi) と iris.Application.ServeHTTP
経由 (iris) で成立させる。

### 追加機能

- Iris adapter (`kiwa-test-go/iris`) 追加 — `kiwa_iris.NewTestServer(t, app)` +
  in-process `app.ServeHTTP(w, req)` driver、 iris の routing engine を
  `app.Build()` で一度だけ compile して再利用する lazy build 実装
- Chi adapter (`kiwa-test-go/chi`) 追加 — `kiwa_chi.NewTestServer(t, r)` +
  in-process `r.ServeHTTP(w, req)` driver、 chi.Router を http.Handler 経由で
  直接 dispatch (net/http 標準 handler で最軽量な subpackage)

### Contract 継続

Iris / Chi ともに v1.5+ の gin / echo / fiber と同 API contract。

- `srv.Request(method, path)` chain builder (`Header` / `Body` / `JSON` / `Send`)
- `Response` helper (`StatusCode` / `Headers` / `HeadersAll` / `HeadersAllValues` /
  `Cookies` / `Body` / `BodyString` / `JSON`)
- `srv.RecordedRequests()` / `srv.RequestCount()` recorder
- `srv.Stop()` idempotent + post-Stop `Send()` → `t.Fatalf`
- `t.Cleanup(srv.Stop)` 自動 register
- Body 大量再利用時の defensive copy (v1.6-2 hazard 3 対応済)

### 依存追加

- `github.com/kataras/iris/v12` v12.2.11
- `github.com/go-chi/chi/v5` v5.3.0

## v0.4.0 — v1.7 milestone (unreleased)

`kiwa-test-go` v0.4.0 は Fiber (fasthttp) 対応を軸にした polyglot 継続深化 release。
`kiwa-test-go/fiber` subpackage を追加、 gin / echo と同一 `TestServer` contract
を fasthttp 経由で成立させる。

### 追加機能

- Fiber adapter (`kiwa-test-go/fiber`) 追加 — `kiwa_fiber.NewTestServer(t, app)` +
  in-process `*fiber.App.Test(*http.Request)` driver
  ([#625](https://github.com/cardene777/kiwa/issues/625))。 Fiber は net/http では
  なく fasthttp 上に載っているため `httptest.NewRecorder + engine.ServeHTTP` の
  gin / echo pattern が使えず、 framework 標準 `App.Test` を経由する。 surface
  contract (`Request(method, path).Header/.Body/.JSON.Send()` builder chain +
  `RecordedRequests()` + `HeadersAll` / `Cookies` accessor) は gin / echo と同一。
  Fiber 固有 `.Timeout(ms)` builder step で `App.Test` の 1s default ceiling
  を上書き可、 `-1` で timeout 完全解除、 `<-1` は `-1` に clamp。
- `Stop()` は gin / echo と同じく harness の stop bit flip のみ、 `app.Shutdown()`
  は意図的に呼ばない (Fiber の Shutdown は listener 未 bind でも user 登録の
  OnShutdown hook を発火してしまい、 gin / echo contract から drift するため)。
  App.Test は in-memory net.Conn を driver するため release すべき listener は
  存在しない。

## v0.3.0 — v1.6 milestone (unreleased)

`kiwa-test-go` v0.3.0 は v1.5 Codex adversarial review の findings 5 件を
消化する品質固め release。 Go adapter (`gin` / `echo`) には 1 件の破壊的変更を含む。

### 破壊的変更

- `srv.Request(...).Send()` は不正入力 (未初期化 `*TestServer` / 不正 method /
  post-Stop invoke) 遭遇時に **panic せず `t.Fatalf` で test を失敗させる** ように
  変更 — Issue [#610](https://github.com/cardene777/kiwa/issues/610)。 従来の
  `Send()` は panic を起こすため `recover()` で握り潰されると test の合否判定を
  すり抜けるリスクがあった。 v0.3 では `testing.TB` 経由で `t.Fatalf` に接続、
  test framework が正しく test 失敗として扱う。 移行は `NewTestServer(t, ...)`
  に `testing.TB` を渡している限り無し (call site 変更不要)、 `recover()` で
  panic を明示的に catch していた場合は削除が必要。

### 追加機能

- Multi-value response header の array 保持 — `Set-Cookie` 等の複数 value header
  が last-value 上書きされず `[]string` として保持される
  ([#607](https://github.com/cardene777/kiwa/issues/607))。 従来の
  `resp.Headers()` (`map[string]string` を返す last-value 版) は既存 test の
  互換性維持のため **戻り値型も含めそのまま保持**、 新たに
  `resp.HeadersAll()` (`map[string][]string` を返す) を追加した。
  `Set-Cookie` の全 value を取りたい場合は `resp.HeadersAll()["set-cookie"]`
  を使う。 同 API は `RecordedRequest` にも `Headers` (single) + `HeadersAll`
  (multi) 両方の field として反映されている。
- `Stop()` lifecycle activation — post-Stop `Send()` 呼出は
  `t.Fatalf("kiwa: server already stopped")` で明示 error 化
  ([#609](https://github.com/cardene777/kiwa/issues/609))。 従来は no-op flag のみ
  で post-Stop invoke が silent success していた。
- `recordRequest` deduplication — `internal/recorder` package に統合、
  `integration.go` / `gin/gin.go` / `echo/echo.go` 3 か所の重複実装を 1 か所に
  集約 ([#611](https://github.com/cardene777/kiwa/issues/611))。 public API surface
  変更なし。

### 修正

- v1.4 + v1.5 全 adapter で body defensive copy 徹底
  ([#608](https://github.com/cardene777/kiwa/issues/608))。 `Response.Body()` /
  `recordRequest` の両側で buffer reuse safety を確保。
- Echo adapter docs で「Echo logger silencing は per instance」表現統一
  ([#612](https://github.com/cardene777/kiwa/issues/612))。 README + godoc で
  「once in your test package init」 と混在していた表現を「per instance
  (typically inside the helper that builds each `*echo.Echo`)」 に統一。 echo は
  `gin.SetMode` のような global toggle を持たないため per-instance silencing が
  唯一の正解。

## v0.2.0 — v1.5 milestone

- Gin adapter (`kiwa-test-go/gin`) 追加 — `kiwa_gin.NewTestServer(t, engine)` +
  in-process `engine.ServeHTTP` driver ([#594](https://github.com/cardene777/kiwa/issues/594))。
- Echo adapter (`kiwa-test-go/echo`) 追加 — `kiwa_echo.NewTestServer(t, e)` +
  in-process `e.ServeHTTP` driver ([#595](https://github.com/cardene777/kiwa/issues/595))。
- Go module floor を 1.25 に引き上げ (gin v1.12 が 1.25 requiring)。

## v0.1.0 — v1.4 milestone

- `SetupUnitEnv` + `Mode` (`Mock` / `Live`) + `AssertEqual` / `AssertClose` +
  `t.Cleanup`-based auto-stop ([#578](https://github.com/cardene777/kiwa/issues/578))。
- `NewMockServer` + `Route` table + `RecordedRequest` recorder + 404 fallback
  ([#579](https://github.com/cardene777/kiwa/issues/579))。

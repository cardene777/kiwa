# kiwa-test-go — Go `testing.T` adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-test/core` to the Go
ecosystem. Provides a deterministic fixture (`SetupUnitEnv`) with mode
selection (`Mock` / `Live`), automatic cleanup via `t.Cleanup`, and
diff-aware assertion helpers (`AssertEqual` / `AssertClose`).

## Install

```bash
# core (unit + integration mock server, zero runtime deps)
go get github.com/cardene777/kiwa-test-go@v0.2.0

# Gin adapter (opt-in subpackage, pulls gin as a transitive dep)
go get github.com/cardene777/kiwa-test-go/gin@v0.2.0

# Echo adapter (opt-in subpackage, pulls echo/v4 as a transitive dep)
go get github.com/cardene777/kiwa-test-go/echo@v0.2.0
```

Requires Go >= 1.25 from v0.2 onwards (gin v1.12 raised the floor; the
core unit + integration helpers themselves still need only the standard
library). The core package keeps zero runtime dependencies — only the
optional `gin` / `echo` subpackages pull their respective framework
into your test binary.

## Usage

### `SetupUnitEnv(t, opts)` — deterministic fixture

```go
import (
    "testing"

    "github.com/cardene777/kiwa-test-go"
)

func TestExample(t *testing.T) {
    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
        Mode:  kiwa.ModeMock,
        Seed:  kiwa.Seed(42),
        Label: "example",
    })

    kiwa.AssertEqual(t, env.Mode(), kiwa.ModeMock)
    kiwa.AssertEqual(t, *env.Seed(), uint64(42))
    // env.Stop() runs automatically when t finishes (t.Cleanup).
}
```

`SetupUnitEnv` registers `env.Stop` with `t.Cleanup` so tests cannot forget
cleanup — the fixture is released even when assertions short-circuit the
test with `t.Fatalf`.

### `AssertEqual` / `AssertClose`

```go
kiwa.AssertEqual(t, 2+2, 4)
kiwa.AssertEqual(t, []int{1, 2, 3}, []int{1, 2, 3}, "sequence")
kiwa.AssertClose(t, 1.0, 1.0+1e-9, 1e-6)
kiwa.AssertClose(t, 1.0, 2.0, 1e-6, "floating drift hint")
```

Failure messages include `got` / `want` / `delta` / `tol` / `hint` so
`go test -v` output is diff-friendly. Both helpers call `t.Helper()` so the
stack frame surfaced by Go's testing package points at the caller, not at
the helper.

`AssertEqual` uses `reflect.DeepEqual`, so structs, slices, maps, and
pointer targets are all compared by value. `AssertClose` fails on `NaN` on
either side.

### Mode selection

| `Mode` | Purpose | Downstream adapters |
|---|---|---|
| `ModeMock` (default) | Fully deterministic in-process fixture, no network / filesystem. | `NewMockServer` (this release, integration helper). |
| `ModeLive` | Real-resource fixture, opt-in. | Same adapters, hitting real endpoints. |

`UnitEnv` is intentionally not safe for cross-goroutine sharing — fixtures
are scoped to the test goroutine that created them. The monotonic `ID()` is
atomic so parallel `SetupUnitEnv` calls from `t.Parallel` tests still
receive distinct ids.

### `NewMockServer(t, opts)` — integration test helper

Wraps `net/http/httptest.Server` with a route table, a request recorder,
and `t.Cleanup`-based port release so an `http.Client` can drive a fully
deterministic API endpoint inside a `go test` run.

```go
import (
    "io"
    "net/http"
    "testing"

    "github.com/cardene777/kiwa-test-go"
)

func TestListUsers(t *testing.T) {
    srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
        kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
            return kiwa.JSON([]byte(`[{"id":1,"name":"sora"}]`))
        }),
    ))

    resp, err := http.Get(srv.URL() + "/users")
    if err != nil {
        t.Fatalf("Get: %v", err)
    }
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    kiwa.AssertEqual(t, resp.StatusCode, 200)
    kiwa.AssertEqual(t, string(body), `[{"id":1,"name":"sora"}]`)

    kiwa.AssertEqual(t, srv.RequestCount(), 1)
    kiwa.AssertEqual(t, srv.RecordedRequests()[0].Path, "/users")
}
```

Contract.

- `NewMockServer(t, opts)` binds to an OS-assigned ephemeral port (no fixed
  port option in v0.1) so parallel tests do not clash.
- `MockServerOpts.WithRoute(Route)` is chainable; the route table is
  evaluated in registration order and the first `(method, path)` match wins.
- `RouteHandler` receives the captured `RecordedRequest` so handlers can
  inspect headers / body without re-reading the wire request.
- Unmatched routes 404 with a self-describing body — accidental rogue
  requests fail the test instead of hanging.
- `srv.RecordedRequests()` returns a fresh snapshot (`Method`, `Path`,
  lowercased `Headers`, `Body` bytes) on every call so assertions cannot
  race the server goroutines.
- `srv.Stop()` is idempotent; `t.Cleanup` invokes it automatically so the
  port is released even when the test fails with `t.Fatalf`. **v0.3+** —
  invoking any HTTP request against `srv.URL()` after `Stop()` returns a
  connection-refused error (the underlying `httptest.Server` is closed);
  the recorder is frozen at the moment `Stop()` fires and returns the same
  snapshot on subsequent calls.
- **v0.3+** — multi-value request headers are retained via
  `srv.RecordedRequests()[i].HeadersAll` (`map[string][]string`). The
  existing `Headers` (`map[string]string`) stays source-compatible for the
  last-value case.

### `kiwa_gin.NewTestServer(t, engine)` — Gin web framework adapter (v0.2)

Wraps `*gin.Engine` in a `TestServer` that drives requests **in-process**
through `engine.ServeHTTP` — no real port, no `TIME_WAIT` flakiness, no
parallel `go test` port clashes. Mirrors the Rust `kiwa::axum::test_app`
API so the same Layer 1 spec compiles to Go (Gin) and Rust (axum) test
files.

```go
import (
    "net/http"
    "testing"

    "github.com/gin-gonic/gin"

    "github.com/cardene777/kiwa-test-go"
    kiwa_gin "github.com/cardene777/kiwa-test-go/gin"
)

func TestHealth(t *testing.T) {
    gin.SetMode(gin.TestMode)
    engine := gin.New()
    engine.GET("/health", func(c *gin.Context) {
        c.String(http.StatusOK, "ok")
    })

    srv := kiwa_gin.NewTestServer(t, engine)
    resp := srv.Request(kiwa.MethodGET, "/health").Send()
    kiwa.AssertEqual(t, resp.StatusCode(), 200)
    kiwa.AssertEqual(t, resp.BodyString(), "ok")
}
```

Contract.

- `kiwa_gin.NewTestServer(t, engine)` accepts any `*gin.Engine` (built via
  `gin.New()` or `gin.Default()`) and registers `t.Cleanup` for harness
  release.
- `srv.Request(method, path).Header(k, v).Body(b).JSON(b).Send()` is the
  typed request builder. The chainable shape mirrors v1.4
  `kiwa.NewMockServer` route registration so polyglot specs read the
  same.
- `*Response` exposes `StatusCode() / Headers() / Body() / BodyString() /
  JSON(target)` — buffered up-front so assertions stay race-free.
- `srv.RecordedRequests()` returns `[]kiwa.RecordedRequest` (the v1.4
  shape, re-exported) so the recorder is identical across the two
  adapters.
- The adapter does **not** mutate `gin.SetMode` — call
  `gin.SetMode(gin.TestMode)` once in your test package `init` if you
  want to silence gin's debug logging.
- **v0.3+** — `srv.Stop()` activates a hard lifecycle boundary.
  `srv.Request(...).Send()` after `Stop()` fails the test with
  `t.Fatalf("kiwa-gin: Send() called after Stop() ...")` instead of
  silently succeeding. This closes the v1.5 finding where a stale
  reference to a stopped `TestServer` could still exercise handlers.
- **v0.3+** — `Send()` no longer `panic()`s on unrecoverable errors
  (nil server, unsupported method, marshal failure). It now calls
  `t.Fatalf` on the captured `testing.TB` so `recover()` in a downstream
  handler cannot swallow the failure. Migration is a no-op provided
  `NewTestServer(t, engine)` receives a real `testing.TB`.
- **v0.3+** — multi-value response headers are retained via new
  `resp.HeadersAll()` (`map[string][]string`) and
  `srv.RecordedRequests()[i].HeadersAll` (same shape). The existing
  `resp.Headers()` (`map[string]string`) stays source-compatible for the
  last-value case — call `HeadersAll()` when you need the full list
  (e.g. multiple `Set-Cookie` values).

`kiwa_gin.NewTestServer` composes with v1.4 `kiwa.NewMockServer`: the
Gin handler under test can call out to a kiwa mock for upstream traffic
and both recorders capture independently (see
[`gin/gin_test.go`](gin/gin_test.go) `TestInteropWithKiwaMockServer`).

### `kiwa_echo.NewTestServer(t, e)` — Echo web framework adapter (v0.2)

Wraps `*echo.Echo` in a `TestServer` that drives requests **in-process**
through `e.ServeHTTP` — same trade-off as the Gin adapter (no real port,
no `TIME_WAIT` flakiness, no parallel `go test` port clashes). Mirrors
the Rust `kiwa::axum::test_app` API and the Gin adapter contract so the
same Layer 1 spec compiles to Go (Echo / Gin) and Rust (axum) test files.

```go
import (
    "io"
    "net/http"
    "testing"

    "github.com/labstack/echo/v4"

    "github.com/cardene777/kiwa-test-go"
    kiwa_echo "github.com/cardene777/kiwa-test-go/echo"
)

func TestHealth(t *testing.T) {
    e := echo.New()
    e.HideBanner = true
    e.HidePort = true
    e.Logger.SetOutput(io.Discard)
    e.GET("/health", func(c echo.Context) error {
        return c.String(http.StatusOK, "ok")
    })

    srv := kiwa_echo.NewTestServer(t, e)
    resp := srv.Request(kiwa.MethodGET, "/health").Send()
    kiwa.AssertEqual(t, resp.StatusCode(), 200)
    kiwa.AssertEqual(t, resp.BodyString(), "ok")
}
```

Contract.

- `kiwa_echo.NewTestServer(t, e)` accepts any `*echo.Echo` (built via
  `echo.New()`) and registers `t.Cleanup` for harness release.
- `srv.Request(method, path).Header(k, v).Body(b).JSON(b).Send()` is the
  typed request builder. The chainable shape mirrors v1.4
  `kiwa.NewMockServer` and the `kiwa_gin` adapter so polyglot specs
  read the same.
- `*Response` exposes `StatusCode() / Headers() / Body() / BodyString() /
  JSON(target)` — buffered up-front so assertions stay race-free.
- `srv.RecordedRequests()` returns `[]kiwa.RecordedRequest` (the v1.4
  shape, re-exported) so the recorder is identical across the three
  adapters (`kiwa.NewMockServer` / `kiwa_gin` / `kiwa_echo`).
- The adapter does **not** mutate echo globals — echo has no global-mode
  toggle equivalent to `gin.SetMode`, so silencing has to happen **per
  instance** via `e.Logger.SetOutput(io.Discard)` (and
  `e.HideBanner = true` / `e.HidePort = true`) inside the helper that
  builds each `*echo.Echo` if you want a quiet `go test` log.
- **v0.3+** — `srv.Stop()` activates a hard lifecycle boundary.
  `srv.Request(...).Send()` after `Stop()` fails the test with
  `t.Fatalf("kiwa-echo: Send() called after Stop() ...")` instead of
  silently succeeding. This closes the v1.5 finding where a stale
  reference to a stopped `TestServer` could still exercise handlers.
- **v0.3+** — `Send()` no longer `panic()`s on unrecoverable errors
  (nil server, unsupported method, marshal failure). It now calls
  `t.Fatalf` on the captured `testing.TB` so `recover()` in a downstream
  handler cannot swallow the failure. Migration is a no-op provided
  `NewTestServer(t, e)` receives a real `testing.TB`.
- **v0.3+** — multi-value response headers are retained via new
  `resp.HeadersAll()` (`map[string][]string`) and
  `srv.RecordedRequests()[i].HeadersAll` (same shape). The existing
  `resp.Headers()` (`map[string]string`) stays source-compatible for the
  last-value case — call `HeadersAll()` when you need the full list
  (e.g. multiple `Set-Cookie` values).

`kiwa_echo.NewTestServer` composes with v1.4 `kiwa.NewMockServer`: the
Echo handler under test can call out to a kiwa mock for upstream traffic
and both recorders capture independently (see
[`echo/echo_test.go`](echo/echo_test.go) `TestInteropWithKiwaMockServer`).

### Differentiation vs raw `net/http/httptest`

`httptest.NewServer` is already a correct, minimal wrapper around
`net.Listener` + `http.Server`. `kiwa.NewMockServer` does not try to hide
it — instead it adds the kiwa fixture contract so a multi-language Layer 1
spec compiles to either ecosystem.

| Concern | `net/http/httptest` | `kiwa.NewMockServer` |
|---|---|---|
| Port release | `srv.Close()` (manual) | `t.Cleanup` registered for you |
| Route table | Single `http.HandlerFunc` you wire yourself | `[]Route` data — readable, comparable |
| Request log | Write your own via the handler | `RecordedRequests()` snapshot, including 404s |
| Polyglot Layer 1 spec | Go-only | Same contract as `kiwa-test-rs::integration::mock_server` |
| Match richness | Whatever you write | Exact `(method, path)` — v0.1 |

For matchers richer than exact method + path (regex / JSON path / response
sequencing) reach for [`gock`](https://github.com/h2non/gock) or
[`httpmock`](https://github.com/jarcoal/httpmock) — they coexist with
`kiwa` fixtures.

### `testing.TB` accepted

`SetupUnitEnv`, `AssertEqual`, and `AssertClose` all accept `testing.TB`, so
they work inside `*testing.T`, `*testing.B`, and `*testing.F` bodies. The
same helpers can be reused in benchmarks and fuzz tests without rewrite.

## Roadmap

- v0.1 unit (shipped) — `SetupUnitEnv` + `Mode` (Mock / Live) + `AssertEqual`
  / `AssertClose` + `t.Cleanup`-based auto-stop, shipped via Issue
  [#578](https://github.com/cardene777/kiwa/issues/578).
- v0.1 integration (shipped) — `NewMockServer` + `Route` table +
  `RecordedRequest` recorder + 404 fallback for unmatched routes, shipped
  via Issue [#579](https://github.com/cardene777/kiwa/issues/579).
- v0.2 Gin adapter (shipped) — `kiwa_gin.NewTestServer` +
  in-process `engine.ServeHTTP` driver + typed Request / Response
  builders + `kiwa.RecordedRequest` recorder, shipped via Issue
  [#594](https://github.com/cardene777/kiwa/issues/594).
- v0.2 Echo adapter — `kiwa_echo.NewTestServer` +
  in-process `e.ServeHTTP` driver + typed Request / Response builders
  + `kiwa.RecordedRequest` recorder, shipped via Issue
  [#595](https://github.com/cardene777/kiwa/issues/595).
- v0.3 (v1.6 quality milestone) — multi-value response header retention
  ([#607](https://github.com/cardene777/kiwa/issues/607)), defensive body
  copy sweep ([#608](https://github.com/cardene777/kiwa/issues/608)),
  `TestServer.Stop()` lifecycle activation
  ([#609](https://github.com/cardene777/kiwa/issues/609)), `Send()`
  panic → `t.Fatalf` migration
  ([#610](https://github.com/cardene777/kiwa/issues/610)),
  `internal/recorder` dedup
  ([#611](https://github.com/cardene777/kiwa/issues/611)) and Echo
  logger docs consistency
  ([#612](https://github.com/cardene777/kiwa/issues/612)). Contains one
  breaking change — `Send()` no longer panics but calls `t.Fatalf`; see
  [CHANGELOG.md](CHANGELOG.md).
- v0.4+ — Layer 1 spec → `_test.go` codegen polyglot expansion and Layer
  2 `kiwa-go` skill chain (Issue
  [#581](https://github.com/cardene777/kiwa/issues/581)).

## Related

- Parent v1.6 milestone — [#606](https://github.com/cardene777/kiwa/issues/606)
- Parent v1.5 milestone — [#591](https://github.com/cardene777/kiwa/issues/591)
- Parent v1.4 milestone — [#575](https://github.com/cardene777/kiwa/issues/575)
- PoC (unit + integration) — [`examples/go-testing-poc/`](../examples/go-testing-poc)
- PoC (Gin Counter API) — [`examples/go-gin-poc/`](../examples/go-gin-poc)
- PoC (Echo Counter API) — [`examples/go-echo-poc/`](../examples/go-echo-poc)
- TypeScript core — [`@kiwa-test/core`](../packages/core)
- Rust sibling — [`kiwa-test-rs`](../kiwa-rs)
- Python sibling — [`kiwa-test-py`](../kiwa-py)

## Publish (maintainers)

```bash
git tag kiwa-go/v0.3.0
git push --tags
# pkg.go.dev auto-indexes the new tag within minutes.
```

The git tag prefix follows the standard Go monorepo convention
(`<module-dir>/vX.Y.Z`) so `go get` resolves the module without ambiguity.

## License

MIT

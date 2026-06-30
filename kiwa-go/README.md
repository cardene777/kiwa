# kiwa-test-go — Go `testing.T` adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-test/core` to the Go
ecosystem. Provides a deterministic fixture (`SetupUnitEnv`) with mode
selection (`Mock` / `Live`), automatic cleanup via `t.Cleanup`, and
diff-aware assertion helpers (`AssertEqual` / `AssertClose`).

## Install

```bash
go get github.com/cardene777/kiwa-test-go@v0.1.0
```

Requires Go >= 1.21. The module has zero runtime dependencies (only the
standard library).

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
  port is released even when the test fails with `t.Fatalf`.

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
- v0.1 integration (this release) — `NewMockServer` + `Route` table +
  `RecordedRequest` recorder + 404 fallback for unmatched routes, shipped
  via Issue [#579](https://github.com/cardene777/kiwa/issues/579).
- v0.2+ — Layer 1 spec → `_test.go` codegen (kiwa-design polyglot extension,
  Issue [#580](https://github.com/cardene777/kiwa/issues/580)) and Layer 2
  `kiwa-go` skill chain (Issue
  [#581](https://github.com/cardene777/kiwa/issues/581)).

## Related

- Parent v1.4 milestone — [#575](https://github.com/cardene777/kiwa/issues/575)
- PoC — [`examples/go-testing-poc/`](../examples/go-testing-poc)
- TypeScript core — [`@kiwa-test/core`](../packages/core)
- Rust sibling — [`kiwa-test-rs`](../kiwa-rs)
- Python sibling — [`kiwa-test-py`](../kiwa-py)

## Publish (maintainers)

```bash
git tag kiwa-go/v0.1.0
git push --tags
# pkg.go.dev auto-indexes the new tag within minutes.
```

The git tag prefix follows the standard Go monorepo convention
(`<module-dir>/vX.Y.Z`) so `go get` resolves the module without ambiguity.

## License

MIT

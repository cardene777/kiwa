# go-fiber-poc — kiwa-test-go v0.2 Fiber adapter PoC

End-to-end PoC for the [`kiwa-test-go/fiber`](../../kiwa-go/fiber) adapter
shipped with v1.7 (Issue [#625](https://github.com/cardene777/kiwa/issues/625)).

Implements a tiny in-memory Counter API on top of `*fiber.App` and
exercises it through `kiwa_fiber.NewTestServer`:

| Route | Behaviour |
|---|---|
| `GET /healthz` | Returns 200 `ok` (sanity check). |
| `GET /count` | Returns the current counter value as `{"count": N}`. |
| `POST /count/incr` | Increments by 1 and returns the new value. |
| `POST /count/reset` | Sets to `{"to": N}` from the request body. Returns 400 on bad JSON. |

## Run

```bash
cd examples/go-fiber-poc
go test -race ./...
```

Expected: **8 tests pass** with `-race` clean.

## Why Fiber gets its own adapter

Fiber sits on `fasthttp`, not `net/http`. That means the
`httptest.NewRecorder + engine.ServeHTTP` pattern the Gin and Echo
adapters use cannot drive a Fiber handler — the handler's request
abstraction is `*fiber.Ctx` backed by `fasthttp.RequestCtx`, which
`httptest.NewRecorder` does not understand.

The Fiber adapter goes through the framework's own `*fiber.App.Test`
entry point instead. `App.Test` accepts a standard `*http.Request`,
dumps it to the wire, drives an in-memory `net.Conn` through the
underlying fasthttp server, and returns a parsed `*http.Response` — so
the kiwa contract (typed request builder + buffered response +
recorder) stays identical to the Gin / Echo adapters at the surface,
even though the transport is different underneath.

## What this PoC verifies

- `*fiber.App` binds through `kiwa_fiber.NewTestServer(t, app)` without
  real port allocation (no `TIME_WAIT` flakiness on parallel runs).
- Typed request builder (`srv.Request(method, path).Header / .Body /
  .JSON`) works for `GET` / `POST` (the rest of the HTTP method enum is
  covered in `kiwa-test-go/fiber/fiber_test.go` directly).
- `Response.JSON(target)` decodes Fiber JSON output (no manual
  `json.Unmarshal` boilerplate at every call site).
- `RecordedRequests()` captures the full sequence — including 404s —
  so test bodies can assert on observed traffic without subscribing to
  Fiber middleware.
- Fiber state (the shared `*Counter` behind a mutex) persists across
  `Send` calls — handler-level integration tests can drive multi-step
  scenarios in one fixture.

## Related

- Adapter — [`kiwa-test-go/fiber`](../../kiwa-go/fiber)
- Sibling Gin PoC — [`examples/go-gin-poc/`](../go-gin-poc) (same
  Counter API shape on Gin)
- Sibling Echo PoC — [`examples/go-echo-poc/`](../go-echo-poc) (same
  Counter API shape on Echo)
- Sibling Rust PoC — [`examples/rust-axum-poc/`](../rust-axum-poc) (same
  Counter API shape on axum)
- v1.7 milestone parent — [#621](https://github.com/cardene777/kiwa/issues/621)

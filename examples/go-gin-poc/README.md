# go-gin-poc — kiwa-test-go v0.2 Gin adapter PoC

End-to-end PoC for the [`kiwa-test-go/gin`](../../kiwa-go/gin) adapter
shipped with v0.2 (Issue [#594](https://github.com/cardene777/kiwa/issues/594)).

Implements a tiny in-memory Counter API on top of `*gin.Engine` and
exercises it through `kiwa_gin.NewTestServer`:

| Route | Behaviour |
|---|---|
| `GET /healthz` | Returns 200 `ok` (sanity check). |
| `GET /count` | Returns the current counter value as `{"count": N}`. |
| `POST /count/incr` | Increments by 1 and returns the new value. |
| `POST /count/reset` | Sets to `{"to": N}` from the request body. Returns 400 on bad JSON. |

## Run

```bash
cd examples/go-gin-poc
go test -race ./...
```

Expected: **8 tests pass** with `-race` clean.

## What this PoC verifies

- gin.Engine binds through `kiwa_gin.NewTestServer(t, engine)` without
  real port allocation (no `TIME_WAIT` flakiness on parallel runs).
- Typed request builder (`srv.Request(method, path).Header / .Body / .JSON`)
  works for `GET` / `POST` (the rest of the HTTP method enum is covered
  in `kiwa-test-go/gin/gin_test.go` directly).
- `Response.JSON(target)` decodes gin JSON output (no manual
  `json.Unmarshal` boilerplate at every call site).
- `RecordedRequests()` captures the full sequence so test bodies can
  assert on observed traffic without subscribing to gin middleware.
- Engine state (the shared `*Counter` behind a mutex) persists across
  `Send` calls — handler-level integration tests can drive multi-step
  scenarios in one fixture.

## Related

- Adapter — [`kiwa-test-go/gin`](../../kiwa-go/gin)
- Sibling Rust PoC — [`examples/rust-axum-poc/`](../rust-axum-poc) (same
  Counter API shape on axum)
- v1.5 milestone parent — [#591](https://github.com/cardene777/kiwa/issues/591)

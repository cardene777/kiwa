# rust-axum-poc — kiwa-test-rs v0.2 axum adapter PoC

End-to-end usage example for [`kiwa-test-rs`](../../kiwa-rs) v0.2 axum adapter.

A toy Counter API in `src/lib.rs` exposes 4 routes (`GET /count`,
`POST /increment`, `POST /reset`, `POST /add`). The integration tests under
`tests/counter.rs` drive that Router through `kiwa::axum::test_app` —
in-process, no real port bind, no manual tokio runtime.

## Run

```bash
cargo test -p rust-axum-poc
```

## What this PoC demonstrates

- `kiwa::axum::test_app(router)` accepts a regular `axum::Router` (no extra
  scaffolding required on the application side).
- `TestApp::request(method, path).send()` returns a buffered
  `TestResponse` with `status()` / `body()` / `body_str()` / `json()` /
  `headers()` accessors.
- Request bodies (raw bytes and JSON) round-trip through axum extractors.
- Router `with_state(...)` survives across multiple requests on the same
  `TestApp`.
- `TestApp` `Drop` releases the tokio runtime so subsequent tests can build
  a fresh harness without resource leak.

## Files

| Path | Purpose |
|---|---|
| `src/lib.rs` | Counter API domain — `CounterState` + `router()` builder. |
| `tests/counter.rs` | 7 integration tests covering each route + workflow + 404. |
| `Cargo.toml` | Pulls `kiwa-test-rs` with the `axum` feature opt-in. |

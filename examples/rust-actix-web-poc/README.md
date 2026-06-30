# rust-actix-web-poc — kiwa-test-rs v0.2 actix-web adapter PoC

End-to-end usage example for [`kiwa-test-rs`](../../kiwa-rs) v0.2 actix-web adapter.

A toy Counter API in `src/lib.rs` exposes 4 routes (`GET /count`,
`POST /increment`, `POST /reset`, `POST /add`). The integration tests under
`tests/counter.rs` drive that App through `kiwa::actix::test_app` —
in-process, no real port bind, no manual actix-rt runtime.

## Run

```bash
cargo test -p rust-actix-web-poc
```

## What this PoC demonstrates

- `kiwa::actix::test_app(factory)` accepts a factory closure that builds an
  `actix_web::App` (no extra scaffolding required on the application side).
- `TestApp::request(method, path).send()` returns a buffered `TestResponse`
  with `status()` / `body()` / `body_str()` / `json()` / `headers()`
  accessors — identical surface to `kiwa::axum::test_app` so test code can
  switch between adapters by changing one `use` line.
- Request bodies (raw bytes and JSON) round-trip through actix-web
  extractors.
- App `app_data(Data::new(...))` state survives across multiple requests on
  the same `TestApp`.
- `TestApp` `Drop` releases the actix-rt runtime so subsequent tests can
  build a fresh harness without resource leak.

## Why a factory closure (not the App directly)

`actix_web::App` is constructed lazily through the service chain — it does
not implement `Clone`, and once an App is moved into `init_service` the
value is consumed. The adapter accepts a `Fn() -> App<T>` closure, matching
`actix_web::HttpServer::new`'s shape so the migration from "real server" to
"kiwa test_app" is one rename.

## Files

| Path | Purpose |
|---|---|
| `src/lib.rs` | Counter API domain — `CounterState` + `configure()` builder. |
| `tests/counter.rs` | 7 integration tests covering each route + workflow + 404. |
| `Cargo.toml` | Pulls `kiwa-test-rs` with the `actix-web` feature opt-in. |

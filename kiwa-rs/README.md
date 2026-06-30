# kiwa-test-rs — Rust cargo test adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-test/core` to the Rust ecosystem.
Provides a deterministic fixture (`setup_env`) with mode selection (`Mock` / `Live`),
automatic cleanup via `Drop`, diff-aware assertion macros
(`assert_kiwa_eq!` / `assert_kiwa_close!`), and a hyper-based integration mock
server with a request recorder (`kiwa::integration::mock_server`).

## Install

`Cargo.toml`:

```toml
[dev-dependencies]
kiwa-test-rs = "0.2"
```

Requires Rust >= 1.75 (edition 2021).

The `integration` feature (hyper-based mock server + request recorder) is
enabled by default. Drop it if you only want the unit fixture and want to
avoid pulling in `hyper` / `tokio`:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.2", default-features = false }
```

The `axum` feature adds an in-process axum `Router` test adapter
(`kiwa::axum::test_app`). Opt in when your service is built on axum:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.2", features = ["axum"] }
```

The `actix-web` feature adds an in-process actix-web `App` test adapter
(`kiwa::actix::test_app`). Opt in when your service is built on actix-web:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.2", features = ["actix-web"] }
```

After publish to crates.io (planned during v1.4 close-out):

```bash
cargo install kiwa-test-rs   # only useful if a future binary helper lands; library use is via [dev-dependencies]
```

## Usage

### `setup_env(opts)` — deterministic fixture

```rust
use kiwa::unit::{setup_env, Mode, SetupOpts};

#[test]
fn my_test() {
    let env = setup_env(SetupOpts {
        mode: Mode::Mock,
        seed: Some(42),
        label: Some("my-test".into()),
    });
    assert_eq!(env.mode(), Mode::Mock);
    assert_eq!(env.seed(), Some(42));
    // env goes out of scope -> Drop runs stop() automatically.
}
```

### `assert_kiwa_eq!` / `assert_kiwa_close!`

```rust
use kiwa::{assert_kiwa_eq, assert_kiwa_close};

assert_kiwa_eq!(2 + 2, 4);
assert_kiwa_eq!(vec![1, 2, 3], vec![1, 2, 3], "sequence diverged hint");
assert_kiwa_close!(1.0_f64, 1.0 + 1e-9, 1e-6);
assert_kiwa_close!(1.0_f64, 2.0_f64, 1e-6, "floating drift hint");
```

Failure messages include `left` / `right` / `delta` / `tol` / `hint` so cargo test
output is diff-friendly.

### Mode selection

| `Mode` | Purpose | Downstream adapters |
|---|---|---|
| `Mock` (default) | Fully deterministic in-process fixture, no network / filesystem. | reqwest mock builders, hyper in-memory server (v0.2 integration adapter). |
| `Live` | Real-resource fixture, opt-in. | Same adapters, hitting real endpoints. |

`KiwaEnv` is intentionally `!Send` (interior `Cell`) — fixtures are scoped to the
test thread that created them. Cleanup runs in `Drop`, so tests cannot leak state
across cases.

### `kiwa::integration::mock_server` — hyper-backed API mock

Spin up an HTTP endpoint on an OS-assigned port, register route handlers, and
let the recorder capture every request the test makes.

```rust
use kiwa::integration::{
    mock_server, HttpMethod, MockResponse, MockServerOpts, Route,
};

#[test]
fn list_users_hits_users_endpoint() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_req| MockResponse::json(br#"[{"id":1,"name":"sora"}]"#.to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/users", server.base_url()))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "GET");
    assert_eq!(recorded[0].path, "/users");
}
```

Contract highlights:

- `MockServer` owns a dedicated tokio runtime and shuts down in `Drop`, so the
  port is released deterministically when the test ends — no manual cleanup.
- Routes match on exact `(method, path)` and are evaluated in registration
  order; first match wins. The handler is `Fn(&RecordedRequest) -> MockResponse`,
  so it can inspect the captured request to build a dynamic reply.
- Every incoming request is recorded — including unmatched ones, which the
  server answers with `404 Not Found` so rogue calls fail the test instead of
  hanging.
- `mock_server` is sync: tests stay sync, and parallel cases each get their
  own ephemeral port.

See `examples/rust-cargo-poc/tests/poc_integration.rs` for a domain wrapper
(`UsersClient`) exercised through the mock server.

### Differentiation vs `httpmock` / `wiremock-rs`

`kiwa::integration::mock_server` is intentionally minimal — same fixture
contract as the rest of kiwa (`setup_env` + Drop cleanup), exact path match,
sync handlers. The other Rust mock servers cover different points in the
design space and coexist with kiwa.

| Capability | `kiwa::integration` | [`httpmock`] | [`wiremock-rs`] |
|---|---|---|---|
| API contract aligned with kiwa core (`setup_env` + Drop cleanup, same recorder shape across TS / Python / Rust / Go adapters) | ✅ | ❌ (standalone API) | ❌ (standalone API) |
| Layer 1 spec compatible (`tests/spec/integration/test-spec-*.rs.md` codegen target, see Issue [#580](https://github.com/cardene777/kiwa/issues/580)) | ✅ planned v0.2 → v1.4-5 | ❌ | ❌ |
| Sync test ergonomics (no `async fn test` required) | ✅ | ✅ | ❌ (async-first) |
| Exact path match | ✅ | ✅ + glob / regex | ✅ + glob / regex |
| Regex / JSON-path / header matchers | ❌ (v0.2 scope) | ✅ | ✅ |
| Response sequencing (n-th call returns different body) | ❌ (v0.2 scope) | ✅ | ✅ |
| Recorded request snapshot API | ✅ (`recorded_requests()`) | ✅ (`expects`) | ✅ (`received_requests`) |

Reach for `kiwa::integration` when you want one fixture contract across the
kiwa polyglot family. Reach for `httpmock` or `wiremock-rs` when you need
richer matchers or response sequencing inside a Rust-only test suite — both
can be used alongside `kiwa::unit::setup_env`.

[`httpmock`]: https://crates.io/crates/httpmock
[`wiremock-rs`]: https://crates.io/crates/wiremock

### `kiwa::axum::test_app` — in-process axum Router adapter

Wrap an `axum::Router` in a `TestApp` and drive requests through
`tower::Service::oneshot` — no port bind, no manual tokio runtime, no
`TIME_WAIT` flakiness on parallel cargo test runs.

```rust
use axum::{routing::get, Router};
use kiwa::axum::{test_app, HttpMethod};

#[test]
fn health_endpoint_responds() {
    let app = Router::new().route("/health", get(|| async { "ok" }));
    let test = test_app(app);

    let resp = test.request(HttpMethod::Get, "/health").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "ok");
}
```

`TestApp` API surface:

- `request(method, path)` returns a chainable `RequestBuilder` with
  `.header(k, v)` / `.body(bytes)` / `.json(pre_serialised_bytes)` / `.send()`.
- `TestResponse` exposes `status()` / `headers()` / `body()` / `body_str()`
  / `json()` (the JSON helper returns `Option<serde_json::Value>`).
- `TestApp` `Drop` releases the tokio runtime so each test releases resources
  deterministically — same Drop discipline as `mock_server`.

`kiwa::axum::test_app` composes with `kiwa::integration::mock_server` when
the Router under test proxies to an external service — point the upstream
URL at the mock server's `base_url()` and the two adapters share the same
fixture contract end-to-end. See
`examples/rust-axum-poc/tests/counter.rs` for the full Counter API PoC and
`kiwa-rs/tests/axum_test_app.rs` for the interop case (axum Router →
`spawn_blocking` reqwest → kiwa mock).

### `kiwa::actix::test_app` — in-process actix-web App adapter

Wrap an `actix_web::App` factory in a `TestApp` and drive requests through
`actix_web::test::call_service` — no port bind, no manual actix-rt runtime,
no `TIME_WAIT` flakiness on parallel cargo test runs. Surface mirrors the
axum adapter 1:1 so test code can switch between adapters by changing one
`use` line.

```rust
use actix_web::{web, App, HttpResponse, Responder};
use kiwa::actix::{test_app, HttpMethod};

#[test]
fn health_endpoint_responds() {
    async fn health() -> impl Responder { HttpResponse::Ok().body("ok") }
    let test = test_app(|| App::new().route("/health", web::get().to(health)));

    let resp = test.request(HttpMethod::Get, "/health").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "ok");
}
```

`TestApp` API surface (identical to the axum adapter):

- `request(method, path)` returns a chainable `RequestBuilder` with
  `.header(k, v)` / `.body(bytes)` / `.json(pre_serialised_bytes)` / `.send()`.
- `TestResponse` exposes `status()` / `headers()` / `body()` / `body_str()`
  / `json()` (the JSON helper returns `Option<serde_json::Value>`).
- `TestApp` `Drop` releases the actix-rt runtime so each test releases
  resources deterministically — same Drop discipline as `mock_server` and
  the axum adapter.

`test_app` accepts a **factory closure** (`Fn() -> App<T>`) instead of the
App directly because `actix_web::App` is intentionally non-`Clone` — handing
in a closure matches `actix_web::HttpServer::new`'s shape so the migration
from "real server" to "kiwa test_app" is one rename.

See `examples/rust-actix-web-poc/tests/counter.rs` for the full Counter API
PoC and `kiwa-rs/tests/actix_test_app.rs` for the interop case (actix App →
`spawn_blocking` reqwest → kiwa mock).

## Roadmap

- v0.1 — `setup_env` + Mode (Mock / Live) + assert macros + Drop cleanup, **plus** `kiwa::integration::mock_server` (hyper + request recorder) shipped together via Issue [#577](https://github.com/cardene777/kiwa/issues/577).
- v0.2 (this release) — `kiwa::axum::test_app` in-process `Router` adapter via Issue [#592](https://github.com/cardene777/kiwa/issues/592) + `kiwa::actix::test_app` in-process actix-web `App` adapter via Issue [#593](https://github.com/cardene777/kiwa/issues/593); richer mock_server matchers planned in follow-up v1.5 sub-Issues.
- v0.3+ — proc-macro `#[kiwa_test]` (split into `kiwa-test-rs-macro` crate), Layer 1 spec → `.rs` codegen (kiwa-design polyglot extension, Issue [#580](https://github.com/cardene777/kiwa/issues/580)).

## Related

- Parent v1.5 milestone — [#591](https://github.com/cardene777/kiwa/issues/591) (Rust + Go web framework adapters)
- TypeScript core — [`@kiwa-test/core`](https://github.com/cardene777/kiwa/tree/main/packages/core)
- Python sibling — [`kiwa-test-py`](https://github.com/cardene777/kiwa/tree/main/kiwa-py)
- PoC (unit + mock_server) — [`examples/rust-cargo-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-cargo-poc)
- PoC (axum) — [`examples/rust-axum-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-axum-poc)
- PoC (actix-web) — [`examples/rust-actix-web-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-actix-web-poc)

## License

MIT

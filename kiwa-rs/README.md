# kiwa-test-rs — Rust cargo test adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-lab/core` to the Rust ecosystem.
Provides a deterministic fixture (`setup_env`) with mode selection (`Mock` / `Live`),
automatic cleanup via `Drop`, diff-aware assertion macros
(`assert_kiwa_eq!` / `assert_kiwa_close!`), and a hyper-based integration mock
server with a request recorder (`kiwa::integration::mock_server`).

## Install

`Cargo.toml`:

```toml
[dev-dependencies]
kiwa-test-rs = "0.5"
```

Requires Rust >= 1.75 (edition 2021).

The `integration` feature (hyper-based mock server + request recorder) is
enabled by default. Drop it if you only want the unit fixture and want to
avoid pulling in `hyper` / `tokio`:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", default-features = false }
```

The `axum` feature adds an in-process axum `Router` test adapter
(`kiwa::axum::test_app`). Opt in when your service is built on axum:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["axum"] }
```

The `actix-web` feature adds an in-process actix-web `App` test adapter
(`kiwa::actix::test_app`). Opt in when your service is built on actix-web:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["actix-web"] }
```

The `tower-http` feature adds a middleware chain adapter for axum
(`kiwa::tower_http::test_chain`) plus six middleware-specific helpers
(`kiwa::tower_http::{cors, trace, compression, auth, rate_limit, timeout}`).
The feature transitively enables `axum` because the chain wraps an axum
`Router`. Opt in when your service composes tower-http middleware
(CORS / Trace / Compression / Auth / RateLimit / Timeout / …):

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["tower-http"] }
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
- **v0.3+** — `MockServer::stop()` activates a hard lifecycle boundary.
  Any HTTP request against `server.base_url()` after `stop()` fails at the
  socket layer (the underlying listener is dropped); the recorder is
  frozen at the moment `stop()` fires and returns the same snapshot on
  subsequent calls.
- **v0.3+** — multi-value response headers are retained via new
  `TestResponse::headers_all()` (`HashMap<String, Vec<String>>`) and
  `RecordedRequest::headers_all` (same shape). `Set-Cookie` no longer
  collapses to the last value. Existing single-value accessors
  (`TestResponse::headers()` / `RecordedRequest::headers`) stay
  source-compatible for the last-value case; call `headers_all()` when
  you need the full list.

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
- **v0.3+** — `TestApp::stop()` activates a hard lifecycle boundary.
  `test.request(...).send()` after `stop()` panics with
  `"kiwa: TestApp already stopped"` so post-stop traffic surfaces as a
  test failure instead of silent success (Rust has no `t.Fatalf` analogue,
  so panic is the closest test-runtime-safe signal).
- **v0.3+** — multi-value response headers are retained via new
  `TestResponse::headers_all()` (`HashMap<String, Vec<String>>`).
  Single-value `headers()` stays unchanged for source compatibility.

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
- **v0.3+** — `TestApp::stop()` activates a hard lifecycle boundary.
  `test.request(...).send()` after `stop()` panics with
  `"kiwa: TestApp already stopped"` so post-stop traffic surfaces as a
  test failure instead of silent success (identical semantics to the
  axum adapter).
- **v0.3+** — multi-value response headers are retained via new
  `TestResponse::headers_all()` (`HashMap<String, Vec<String>>`).
  Single-value `headers()` stays unchanged for source compatibility.

`test_app` accepts a **factory closure** (`Fn() -> App<T>`) instead of the
App directly because `actix_web::App` is intentionally non-`Clone` — handing
in a closure matches `actix_web::HttpServer::new`'s shape so the migration
from "real server" to "kiwa test_app" is one rename.

See `examples/rust-actix-web-poc/tests/counter.rs` for the full Counter API
PoC and `kiwa-rs/tests/actix_test_app.rs` for the interop case (actix App →
`spawn_blocking` reqwest → kiwa mock).

### `kiwa::tower_http::test_chain` — middleware chain over axum

Wrap a `tower::ServiceBuilder` layer stack around an `axum::Router` and
drive requests through the same in-process path as
`kiwa::axum::test_app`. Middleware (CORS / Trace / Timeout / SetHeader /
compression / auth / rate limit / …) executes ahead of the routed handler
without binding a real socket, so middleware regression tests share the
axum adapter's TIME_WAIT / port-clash freedom.

Enable the feature in `Cargo.toml` (it automatically pulls in the `axum`
feature it wraps):

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["tower-http"] }
tower = { version = "0.5", features = ["util"] }
tower-http = { version = "0.6", features = ["cors", "trace", "timeout", "set-header"] }
```

Basic usage:

```rust
use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use kiwa::axum::HttpMethod;
use kiwa::tower_http::test_chain;
use std::time::Duration;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;

#[test]
fn middleware_chain_stamps_response_header_and_enforces_timeout() {
    let router = Router::new().route("/health", get(|| async { "ok" }));
    let layers = ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-chain"),
            HeaderValue::from_static("engaged"),
        ))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(1),
        ))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/health").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
    );
}
```

Contract highlights:

- `test_chain(ServiceBuilder + Router)` returns the **same `TestApp`
  handle** as `kiwa::axum::test_app` — the `request()` / `send()` /
  `TestResponse` API stays identical (v1.5 axum contract carries through
  unchanged).
- The `ServiceBuilder` layer stack is applied to the Router via
  `axum::Router::layer` so any middleware that satisfies axum's own
  `Layer<Route>` bound composes out of the box (`CorsLayer`, `TraceLayer`,
  `TimeoutLayer`, `CompressionLayer`, `SetResponseHeaderLayer`, custom
  auth / rate-limit middleware, …).
- `Drop` teardown, `TestApp::stop()` idempotency, and the post-stop
  `send()` panic gate are inherited from the axum adapter — the wrapper
  adds middleware chain composition without touching the runtime
  discipline.
- `test_chain` is opt-in behind the `tower-http` feature which itself
  enables the `axum` feature it wraps; a build without the feature does
  not compile the module.

See `kiwa-rs/tests/tower_http_test_chain.rs` for the full 10-test suite
(smoke / SetResponseHeader / CORS preflight / composed layers / Timeout /
Trace passthrough / Drop / post-stop panic / request-header echo / body
extractor). For an end-to-end usage example against a production-shaped
axum Router + full six-middleware chain, see
[`examples/rust-tower-http-poc/`](../examples/rust-tower-http-poc)
(v1.7-3, Issue [#624](https://github.com/cardene777/kiwa/issues/624)).

### `kiwa::tower_http::{cors, trace, compression, auth, rate_limit, timeout}` — middleware-specific helpers

v1.7-2 (Issue [#623](https://github.com/cardene777/kiwa/issues/623)) adds
six sibling submodules under `kiwa::tower_http` that wrap the raw
`test_chain` primitive with intent-revealing constructors + assertions for
each major tower-http 0.6 middleware. Each helper accepts the tower-http
Layer type directly so callers stay in control of the layer configuration
(origin policy, timeout duration, compression encoding, …).

Enable the same `tower-http` feature as `test_chain` — the helper crate
automatically pulls in tower-http with the `cors + trace + timeout +
set-header + compression-gzip + validate-request + limit + auth` feature
set:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["tower-http"] }
tower = { version = "0.5", features = ["util"] }
# `tower-http` itself is pulled in transitively by the kiwa `tower-http`
# feature — you only need to name it explicitly if a test binary uses
# tower-http features kiwa does not (rare in practice).
```

#### 1. CORS — `kiwa::tower_http::cors`

```rust
use axum::{routing::get, Router};
use kiwa::axum::HttpMethod;
use kiwa::tower_http::cors::{assert_preflight_ok, test_cors};
use tower_http::cors::{Any, CorsLayer};

#[test]
fn cors_preflight_answers_star() {
    let router = Router::new().route("/api/resource", get(|| async { "ok" }));
    let layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    let test = test_cors(layer, router);
    let resp = test
        .request(HttpMethod::Options, "/api/resource")
        .header("origin", "https://example.com")
        .header("access-control-request-method", "GET")
        .send();
    assert_preflight_ok(&resp, "*");
}
```

#### 2. Trace — `kiwa::tower_http::trace`

`TraceLayer` writes into the `tracing` subscriber; the kiwa helper does
not intercept spans (would tie the crate to `tracing_test`). Instead
compose a sibling `SetResponseHeaderLayer` that stamps a synthetic span
id and read it back with `assert_trace_layer_active`:

```rust
use axum::http::{HeaderName, HeaderValue};
use axum::{routing::get, Router};
use kiwa::axum::HttpMethod;
use kiwa::tower_http::test_chain;
use kiwa::tower_http::trace::assert_trace_layer_active;
use tower::ServiceBuilder;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::trace::TraceLayer;

#[test]
fn trace_layer_wired_via_sibling_header_stamp() {
    let router = Router::new().route("/traced", get(|| async { "ok" }));
    let layers = ServiceBuilder::new()
        .layer(TraceLayer::new_for_http())
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-trace"),
            HeaderValue::from_static("span-42"),
        ));
    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/traced").send();
    assert_trace_layer_active(&resp, "x-kiwa-trace");
}
```

#### 3. Compression — `kiwa::tower_http::compression`

```rust
use axum::{routing::get, Router};
use kiwa::axum::HttpMethod;
use kiwa::tower_http::compression::{assert_compressed, test_compression};
use tower_http::compression::CompressionLayer;

#[test]
fn compression_stamps_content_encoding_on_large_body() {
    let router = Router::new().route(
        "/large",
        get(|| async { "x".repeat(4096) }),
    );
    let test = test_compression(CompressionLayer::new(), router);
    let resp = test
        .request(HttpMethod::Get, "/large")
        .header("accept-encoding", "gzip")
        .send();
    assert_compressed(&resp, "gzip");
}
```

#### 4. Auth — `kiwa::tower_http::auth`

Request-side helpers that build the `Authorization` header pair the
tower-http `ValidateRequestHeaderLayer::bearer` / `::basic` layer
expects:

```rust
use axum::{routing::get, Router};
use kiwa::axum::HttpMethod;
use kiwa::tower_http::auth::{with_basic, with_bearer};
use kiwa::tower_http::test_chain;
use tower::ServiceBuilder;
use tower_http::validate_request::ValidateRequestHeaderLayer;

#[test]
fn bearer_auth_round_trip() {
    let router = Router::new().route("/secret", get(|| async { "ok" }));
    let layers = ServiceBuilder::new()
        .layer(ValidateRequestHeaderLayer::bearer("kiwa-token"));
    let test = test_chain(layers, router);
    let (k, v) = with_bearer("kiwa-token");
    let resp = test.request(HttpMethod::Get, "/secret").header(k, v).send();
    assert_eq!(resp.status(), 200);
}

#[test]
fn basic_auth_round_trip() {
    let router = Router::new().route("/vault", get(|| async { "ok" }));
    let layers = ServiceBuilder::new()
        .layer(ValidateRequestHeaderLayer::basic("kiwa-user", "kiwa-pass"));
    let test = test_chain(layers, router);
    let (k, v) = with_basic("kiwa-user", "kiwa-pass");
    let resp = test.request(HttpMethod::Get, "/vault").header(k, v).send();
    assert_eq!(resp.status(), 200);
}
```

#### 5. Rate limit — `kiwa::tower_http::rate_limit`

`exhaust(app, method, path, n)` drives `n` requests through a
rate-limited (or body-limited) `TestApp` and returns the last response —
the one the caller asserts against. Layer construction stays in the
caller's `ServiceBuilder` chain so both tower-native `RateLimitLayer`
(rate budget) and tower-http `RequestBodyLimitLayer` (payload limit)
compose:

```rust
use axum::{routing::get, Router};
use kiwa::axum::HttpMethod;
use kiwa::tower_http::rate_limit::exhaust;
use kiwa::tower_http::test_chain;
use tower::ServiceBuilder;
use tower_http::limit::RequestBodyLimitLayer;

#[test]
fn body_limit_rejects_oversize_request() {
    async fn eat(body: axum::body::Bytes) -> String {
        format!("received {}", body.len())
    }
    let router = Router::new().route("/limited", axum::routing::post(eat));
    let layers = ServiceBuilder::new().layer(RequestBodyLimitLayer::new(0));
    let test = test_chain(layers, router);
    let throttled = {
        let mut last = None;
        for _ in 0..3 {
            last = Some(
                test.request(HttpMethod::Post, "/limited")
                    .header("content-length", "1")
                    .body(vec![b'x'])
                    .send(),
            );
        }
        last.unwrap()
    };
    // `RequestBodyLimitLayer(0)` fast-paths via Content-Length before the
    // handler reads the body; the last response is 413 Payload Too Large.
    assert_eq!(throttled.status(), 413);
    // The `exhaust` helper collapses the loop into one line.
    let last = exhaust(&test, HttpMethod::Post, "/limited", 1);
    // (single request; here we assert against the driver call directly.)
    let _ = last;
}
```

#### 6. Timeout — `kiwa::tower_http::timeout`

```rust
use std::time::Duration;

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use kiwa::axum::HttpMethod;
use kiwa::tower_http::timeout::{assert_timed_out, test_timeout};
use tower_http::timeout::TimeoutLayer;

async fn slow() -> impl IntoResponse {
    tokio::time::sleep(Duration::from_millis(200)).await;
    (StatusCode::OK, "slow-but-done")
}

#[test]
fn timeout_short_circuits_slow_handler_with_408() {
    let router = Router::new().route("/slow", get(slow));
    let layer = TimeoutLayer::with_status_code(
        StatusCode::REQUEST_TIMEOUT,
        Duration::from_millis(20),
    );
    let test = test_timeout(layer, router);
    let resp = test.request(HttpMethod::Get, "/slow").send();
    assert_timed_out(&resp, StatusCode::REQUEST_TIMEOUT);
}
```

Contract highlights (all six helpers):

- Each helper returns the shared `TestApp` type from `kiwa::axum` — so
  `request()` / `send()` / `TestResponse` ergonomics stay identical to
  the v1.5 axum feature (v1.7-1 test_chain contract carries through
  unchanged).
- Assertion helpers include the response status + relevant headers in
  their panic message so a middleware regression surfaces with a
  self-describing failure instead of `assertion left == right` opaque
  diffs.
- The `auth` helpers stay request-side only (they build the
  `Authorization` header pair, they do not wrap a router) so callers
  compose `ValidateRequestHeaderLayer` / `AddAuthorizationLayer`
  themselves — that decouples the kiwa helper from tower-http's
  auth feature drift.

See `kiwa-rs/tests/tower_http_middleware.rs` for the full 24-test suite
(4 CORS / 3 Trace / 4 Compression / 5 Auth / 4 RateLimit / 4 Timeout,
including the negative-path panic assertions).

## Roadmap

- v0.1 — `setup_env` + Mode (Mock / Live) + assert macros + Drop cleanup, **plus** `kiwa::integration::mock_server` (hyper + request recorder) shipped together via Issue [#577](https://github.com/cardene777/kiwa/issues/577).
- v0.2 — `kiwa::axum::test_app` in-process `Router` adapter via Issue [#592](https://github.com/cardene777/kiwa/issues/592) + `kiwa::actix::test_app` in-process actix-web `App` adapter via Issue [#593](https://github.com/cardene777/kiwa/issues/593); richer mock_server matchers planned in follow-up v1.5 sub-Issues.
- v0.3 (v1.6 quality milestone) — multi-value response header retention via new `headers_all()` accessor ([#607](https://github.com/cardene777/kiwa/issues/607)), defensive body copy sweep ([#608](https://github.com/cardene777/kiwa/issues/608)), `TestApp::stop()` lifecycle activation ([#609](https://github.com/cardene777/kiwa/issues/609)), `fold_headers` recorder dedup ([#611](https://github.com/cardene777/kiwa/issues/611)). Fully source-compatible with v0.2 for adopters — existing `headers()` / `headers` accessors keep the same `HashMap<String, String>` shape. See [CHANGELOG.md](CHANGELOG.md).
- v0.4 (v1.7 polyglot 継続深化) — `kiwa::tower_http::test_chain` (tower-http middleware chain adapter over the axum Router) via Issue [#622](https://github.com/cardene777/kiwa/issues/622). `ServiceBuilder<...>` layer stack drives through the same `TestApp` contract as `kiwa::axum::test_app`. Opt-in behind the `tower-http` feature (default OFF). v1.7-2 ([#623](https://github.com/cardene777/kiwa/issues/623)) added six middleware-specific helper submodules — `kiwa::tower_http::{cors, trace, compression, auth, rate_limit, timeout}` — with intent-revealing constructors (`test_cors` / `test_trace` / `test_compression` / `test_timeout`) and assertions (`assert_preflight_ok` / `assert_trace_layer_active` / `assert_compressed` / `assert_timed_out`) plus request-side auth header builders (`with_bearer` / `with_basic`) and a rate-limit driver (`exhaust`).
- v0.5+ — proc-macro `#[kiwa_test]` (split into `kiwa-test-rs-macro` crate), Layer 1 spec → `.rs` codegen (kiwa-design polyglot extension, Issue [#580](https://github.com/cardene777/kiwa/issues/580)).

## Related

- Parent v1.6 milestone — [#606](https://github.com/cardene777/kiwa/issues/606) (v1.5 findings 5 件消化 + docs 整合化)
- Parent v1.5 milestone — [#591](https://github.com/cardene777/kiwa/issues/591) (Rust + Go web framework adapters)
- TypeScript core — [`@kiwa-lab/core`](https://github.com/cardene777/kiwa/tree/main/packages/core)
- Python sibling — [`kiwa-test-py`](https://github.com/cardene777/kiwa/tree/main/kiwa-py)
- PoC (unit + mock_server) — [`examples/rust-cargo-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-cargo-poc)
- PoC (axum) — [`examples/rust-axum-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-axum-poc)
- PoC (actix-web) — [`examples/rust-actix-web-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-actix-web-poc)

## License

MIT

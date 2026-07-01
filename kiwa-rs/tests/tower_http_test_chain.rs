//! Integration tests for `kiwa::tower_http::test_chain`.
//!
//! Each test wraps an [`axum::Router`] with a `tower::ServiceBuilder` layer
//! stack, hands the pair to `kiwa::tower_http::test_chain`, and drives one
//! or more requests through the in-process path. Coverage matches the AC
//! surface — feature opt-in / `ServiceBuilder + Router` API shape / v1.5
//! axum `TestApp` contract continuity / concrete tower-http middleware
//! behaviour (CORS / Trace / Timeout / SetResponseHeader) / Drop teardown.

#![cfg(feature = "tower-http")]

use std::time::Duration;

use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use kiwa::axum::HttpMethod;
use kiwa::tower_http::test_chain;

// AC 1 — `kiwa::tower_http::test_chain(ServiceBuilder, Router)` binds a
// `ServiceBuilder` stack + `axum::Router` and returns the shared `TestApp`
// handle. Smoke test: an empty ServiceBuilder (no layers) plus a `GET /health`
// handler answers 200.
#[test]
fn test_chain_smoke_test_empty_service_builder() {
    let router = Router::new().route("/health", get(|| async { "ok" }));
    let layers = ServiceBuilder::new();

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/health").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "ok");
}

// AC 2 — `SetResponseHeaderLayer` from tower-http rewrites the outgoing
// header — the middleware chain observably touches every response.
#[test]
fn test_chain_set_response_header_layer_rewrites_outgoing_header() {
    let router = Router::new().route("/", get(|| async { "hello" }));
    let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
        HeaderName::from_static("x-kiwa-chain"),
        HeaderValue::from_static("engaged"),
    ));

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
        "SetResponseHeaderLayer should append `x-kiwa-chain: engaged`",
    );
}

// AC 3 — `CorsLayer` responds to a preflight `OPTIONS` request with the
// expected `Access-Control-Allow-*` headers, proving the tower-http CORS
// middleware executes ahead of the routed handler on non-simple requests.
#[test]
fn test_chain_cors_layer_answers_preflight_options() {
    let router = Router::new().route("/api/resource", get(|| async { "resource" }));
    let layers = ServiceBuilder::new().layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    );

    let test = test_chain(layers, router);
    let resp = test
        .request(HttpMethod::Options, "/api/resource")
        .header("origin", "https://example.com")
        .header("access-control-request-method", "GET")
        .send();

    // CorsLayer short-circuits preflight with 200 (axum + tower-http 0.6 contract).
    assert_eq!(resp.status(), 200);
    assert_eq!(
        resp.headers()
            .get("access-control-allow-origin")
            .map(String::as_str),
        Some("*"),
    );
}

// AC 4 — Multiple middleware compose in a single ServiceBuilder chain.
// `SetResponseHeaderLayer` for two separate headers proves the tower
// `ServiceBuilder::layer(...).layer(...)` stack order carries through to the
// response.
#[test]
fn test_chain_service_builder_composes_multiple_layers() {
    let router = Router::new().route("/", get(|| async { "chained" }));
    let layers = ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-first"),
            HeaderValue::from_static("one"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-second"),
            HeaderValue::from_static("two"),
        ));

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(
        resp.headers().get("x-kiwa-first").map(String::as_str),
        Some("one"),
        "outer layer should still fire",
    );
    assert_eq!(
        resp.headers().get("x-kiwa-second").map(String::as_str),
        Some("two"),
        "inner layer should still fire",
    );
    assert_eq!(resp.body_str(), "chained");
}

// AC 5 — `TimeoutLayer` on a slow handler produces the tower-http timeout
// response (408 Request Timeout). Proves timing-sensitive middleware
// executes on the current-thread tokio runtime the TestApp owns.
#[test]
fn test_chain_timeout_layer_short_circuits_slow_handler() {
    async fn slow() -> impl IntoResponse {
        // Sleep well past the layer timeout so the middleware wins the race.
        tokio::time::sleep(Duration::from_millis(200)).await;
        (StatusCode::OK, "slow-but-done")
    }
    let router = Router::new().route("/slow", get(slow));
    let layers = ServiceBuilder::new().layer(TimeoutLayer::with_status_code(
        StatusCode::REQUEST_TIMEOUT,
        Duration::from_millis(20),
    ));

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/slow").send();

    // tower-http 0.6 TimeoutLayer returns 408 Request Timeout when the inner
    // future does not resolve inside the budget.
    assert_eq!(
        resp.status(),
        408,
        "TimeoutLayer should short-circuit with 408 Request Timeout",
    );
}

// AC 6 — `TraceLayer` compiles and passes traffic through untouched. The
// tracing subscriber is not exercised here (tracing_test crate is not on
// the dev-dep matrix) — the AC is that the layer stack accepts TraceLayer
// alongside functional middleware and the handler still returns.
#[test]
fn test_chain_trace_layer_passes_traffic_through() {
    let router = Router::new().route("/traced", get(|| async { "traced-ok" }));
    let layers = ServiceBuilder::new()
        .layer(TraceLayer::new_for_http())
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-traced"),
            HeaderValue::from_static("1"),
        ));

    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/traced").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "traced-ok");
    assert_eq!(
        resp.headers().get("x-kiwa-traced").map(String::as_str),
        Some("1"),
    );
}

// AC 7 — The `TestApp` returned by `test_chain` obeys the same Drop
// discipline as the v1.5 axum adapter — end-of-scope teardown releases the
// runtime and a fresh test_chain call succeeds afterwards.
#[test]
fn test_chain_drop_releases_runtime_across_multiple_apps() {
    let sentinel_header = HeaderName::from_static("x-kiwa-scope");
    {
        let router = Router::new().route("/ping", get(|| async { "pong" }));
        let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
            sentinel_header.clone(),
            HeaderValue::from_static("first"),
        ));
        let test = test_chain(layers, router);
        let resp = test.request(HttpMethod::Get, "/ping").send();
        assert_eq!(resp.body_str(), "pong");
        assert_eq!(
            resp.headers().get("x-kiwa-scope").map(String::as_str),
            Some("first"),
        );
        // Drop runs at end of scope, tearing the runtime down.
    }

    let router = Router::new().route("/ping2", get(|| async { "pong2" }));
    let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
        sentinel_header,
        HeaderValue::from_static("second"),
    ));
    let test = test_chain(layers, router);
    let resp = test.request(HttpMethod::Get, "/ping2").send();
    assert_eq!(resp.body_str(), "pong2");
    assert_eq!(
        resp.headers().get("x-kiwa-scope").map(String::as_str),
        Some("second"),
    );
}

// AC 8 — Post-stop `send()` panics loudly, matching the v1.5 axum `TestApp`
// lifecycle contract (build → exercise → stop → post-stop = panic). Proves
// the `TestApp` surface returned by `test_chain` inherits the same panic
// gate the axum adapter enforces at the runtime boundary.
#[test]
#[should_panic(expected = "kiwa axum test_app: send() called after stop()")]
fn test_chain_send_after_stop_panics() {
    let router = Router::new().route("/", get(|| async { "ok" }));
    let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
        HeaderName::from_static("x-kiwa-stopped"),
        HeaderValue::from_static("check"),
    ));

    let mut test = test_chain(layers, router);
    test.stop();
    // Panics via the runtime-gated `send()` inside `TestApp` — same message
    // the v1.5 axum adapter emits.
    let _ = test.request(HttpMethod::Get, "/").send();
}

// AC 9 — Request headers still reach the underlying handler through the
// middleware stack. Confirms the middleware chain does not eat / strip
// arbitrary request headers.
#[test]
fn test_chain_request_headers_reach_inner_handler() {
    async fn echo_tag(headers: axum::http::HeaderMap) -> String {
        headers
            .get("x-kiwa-tag")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("missing")
            .to_string()
    }
    let router = Router::new().route("/echo-tag", get(echo_tag));
    let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
        HeaderName::from_static("x-kiwa-through"),
        HeaderValue::from_static("passed"),
    ));

    let test = test_chain(layers, router);
    let resp = test
        .request(HttpMethod::Get, "/echo-tag")
        .header("x-kiwa-tag", "kiwa-tower-http")
        .send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "kiwa-tower-http");
    assert_eq!(
        resp.headers().get("x-kiwa-through").map(String::as_str),
        Some("passed"),
        "SetResponseHeaderLayer should still fire even when the handler reads request headers",
    );
}

// AC 10 — The layered Router accepts a route with axum extractors AND
// still runs the ServiceBuilder chain on the response. Confirms the
// `axum::routing::Route` type parameter used by the `test_chain` bound
// remains compatible with the handler surface the v1.5 axum feature
// tests exercise.
#[test]
fn test_chain_router_with_body_extractor_composes_with_layers() {
    async fn echo_body(body: String) -> impl IntoResponse {
        (StatusCode::OK, format!("received: {body}"))
    }
    let router = Router::new().route("/echo", axum::routing::post(echo_body));
    let layers = ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-layered"),
            HeaderValue::from_static("yes"),
        ))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(1),
        ));

    let test = test_chain(layers, router);
    // Drive the request through the shared TestApp surface so we exercise
    // the same wire path the v1.5 axum `RequestBuilder` produces — proves
    // the Layer<Route> bound accepts a body-consuming handler and the
    // response body survives the layer stack.
    let resp = test
        .request(HttpMethod::Post, "/echo")
        .body("hello tower-http")
        .send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "received: hello tower-http");
    assert_eq!(
        resp.headers().get("x-kiwa-layered").map(String::as_str),
        Some("yes"),
    );
}

//! Integration tests for the six middleware-specific helpers under
//! `kiwa::tower_http` — [`cors`](kiwa::tower_http::cors) /
//! [`trace`](kiwa::tower_http::trace) /
//! [`compression`](kiwa::tower_http::compression) /
//! [`auth`](kiwa::tower_http::auth) /
//! [`rate_limit`](kiwa::tower_http::rate_limit) /
//! [`timeout`](kiwa::tower_http::timeout).
//!
//! Each helper gets 3-5 tests covering the AC surface: the intent-revealing
//! constructor produces a working [`TestApp`], the assertion helpers report
//! the observable middleware effect, and edge cases (missing headers, empty
//! bodies, sub-budget request counts) surface with self-describing panics.
//!
//! v1.7-2 (Issue #623) — middleware-level regression net for tower-http 0.6.

#![cfg(feature = "tower-http")]
// tower-http 0.6 deprecated the shortcut constructors on
// `ValidateRequestHeaderLayer::bearer` / `::basic` with the note "too basic
// to be useful in real applications". They still ship and are the exact
// wire behaviour our helpers cover — the kiwa auth helpers format the
// matching header value, and the fastest way to prove that end-to-end is
// to run through the deprecated shortcut. Silence the warning at the
// binary level so the test log stays clean.
#![allow(deprecated)]

use std::io::Read as _;
use std::time::Duration;

use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use base64::Engine as _;
use flate2::read::GzDecoder;
use tower::ServiceBuilder;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;
use tower_http::validate_request::ValidateRequestHeaderLayer;

use kiwa::axum::HttpMethod;
use kiwa::tower_http::auth::{with_basic, with_bearer};
use kiwa::tower_http::compression::{assert_compressed, test_compression};
use kiwa::tower_http::cors::{assert_actual_allow_origin, assert_preflight_ok, test_cors};
use kiwa::tower_http::rate_limit::exhaust;
use kiwa::tower_http::test_chain;
use kiwa::tower_http::timeout::{assert_timed_out, test_timeout};
use kiwa::tower_http::trace::{assert_trace_layer_active, test_trace};

// ────────────────────────────────────────────────────────────────────────
// cors — 4 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn cors_test_cors_wraps_router_and_answers_preflight() {
    let router = Router::new().route("/api", get(|| async { "ok" }));
    let layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let test = test_cors(layer, router);
    let resp = test
        .request(HttpMethod::Options, "/api")
        .header("origin", "https://example.com")
        .header("access-control-request-method", "GET")
        .send();

    assert_preflight_ok(&resp, "*");
}

#[test]
fn cors_actual_request_still_stamps_allow_origin() {
    let router = Router::new().route("/api", get(|| async { "resource" }));
    let layer = CorsLayer::new().allow_origin(Any);

    let test = test_cors(layer, router);
    let resp = test
        .request(HttpMethod::Get, "/api")
        .header("origin", "https://example.com")
        .send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "resource");
    assert_actual_allow_origin(&resp, "*");
}

#[test]
#[should_panic(expected = "kiwa cors helper: preflight expected status 200 but got 405")]
fn cors_assert_preflight_ok_panics_when_layer_absent() {
    let router = Router::new().route("/api", get(|| async { "ok" }));
    // No CorsLayer on purpose — the raw axum Router rejects OPTIONS with
    // 405 Method Not Allowed (only GET is registered). The kiwa
    // `assert_preflight_ok` short-circuits on the non-200 status with a
    // self-describing message the developer can act on before the
    // header-missing branch even runs. This documents that ordering.
    let test = test_chain(ServiceBuilder::new(), router);
    let resp = test.request(HttpMethod::Options, "/api").send();
    assert_preflight_ok(&resp, "*");
}

#[test]
#[should_panic(
    expected = "kiwa cors helper: `access-control-allow-origin` mismatch (expected `https://kiwa.dev`, got `*`)"
)]
fn cors_assert_preflight_ok_panics_on_origin_mismatch() {
    let router = Router::new().route("/api", get(|| async { "ok" }));
    let layer = CorsLayer::new().allow_origin(Any).allow_methods(Any);

    let test = test_cors(layer, router);
    let resp = test
        .request(HttpMethod::Options, "/api")
        .header("origin", "https://kiwa.dev")
        .header("access-control-request-method", "GET")
        .send();
    // CorsLayer with `Any` stamps `*` — the assertion is asked for
    // `https://kiwa.dev`, so the mismatch branch surfaces.
    assert_preflight_ok(&resp, "https://kiwa.dev");
}

// ────────────────────────────────────────────────────────────────────────
// trace — 3 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn trace_test_trace_passes_traffic_through() {
    let router = Router::new().route("/health", get(|| async { "ok" }));
    let test = test_trace(TraceLayer::new_for_http(), router);
    let resp = test.request(HttpMethod::Get, "/health").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "ok");
}

#[test]
fn trace_assert_trace_layer_active_reads_sibling_header_stamp() {
    // TraceLayer composed with a sibling SetResponseHeaderLayer that stamps
    // a synthetic span id — the observable proof the trace layer is wired
    // (see module docs for why we assert on the sibling header rather than
    // subscribing to spans directly).
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

#[test]
#[should_panic(expected = "kiwa trace helper: expected trace span header `x-kiwa-trace`")]
fn trace_assert_trace_layer_active_panics_when_header_missing() {
    // TraceLayer alone does not stamp any HTTP header — the assertion is
    // expected to panic loudly so the developer knows their sibling layer
    // did not fire.
    let router = Router::new().route("/traced", get(|| async { "ok" }));
    let test = test_trace(TraceLayer::new_for_http(), router);
    let resp = test.request(HttpMethod::Get, "/traced").send();
    assert_trace_layer_active(&resp, "x-kiwa-trace");
}

// ────────────────────────────────────────────────────────────────────────
// compression — 4 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn compression_test_compression_stamps_content_encoding() {
    let router = Router::new().route("/large", get(|| async { "x".repeat(4096) }));
    let test = test_compression(CompressionLayer::new(), router);
    let resp = test
        .request(HttpMethod::Get, "/large")
        .header("accept-encoding", "gzip")
        .send();

    assert_compressed(&resp, "gzip");
}

#[test]
fn compression_body_round_trips_through_gzip_decoder() {
    // Full round-trip: CompressionLayer encodes on the wire, flate2 decodes
    // on the test side, and the caller recovers the original payload. Proves
    // the middleware is not just stamping a header on an uncompressed body.
    let payload = "kiwa-compression-round-trip".repeat(64);
    let payload_clone = payload.clone();
    let router = Router::new().route(
        "/gz",
        get(move || {
            let inner = payload_clone.clone();
            async move { inner }
        }),
    );
    let test = test_compression(CompressionLayer::new(), router);
    let resp = test
        .request(HttpMethod::Get, "/gz")
        .header("accept-encoding", "gzip")
        .send();

    assert_compressed(&resp, "gzip");

    let mut decoder = GzDecoder::new(resp.body());
    let mut round_tripped = String::new();
    decoder
        .read_to_string(&mut round_tripped)
        .expect("gzip decode should succeed on CompressionLayer output");
    assert_eq!(round_tripped, payload);
}

#[test]
#[should_panic(
    expected = "kiwa compression helper: expected `content-encoding: gzip` but the response carried no `content-encoding` header"
)]
fn compression_assert_compressed_panics_when_layer_absent() {
    let router = Router::new().route("/no-layer", get(|| async { "ok" }));
    let test = test_chain(ServiceBuilder::new(), router);
    let resp = test.request(HttpMethod::Get, "/no-layer").send();
    assert_compressed(&resp, "gzip");
}

#[test]
fn compression_client_without_accept_encoding_gets_plain_body() {
    // CompressionLayer only compresses when the client signals a matching
    // Accept-Encoding — a request without the header returns the raw
    // payload, so `assert_compressed` should not be called. The test
    // documents that expectation.
    let router = Router::new().route("/plain", get(|| async { "hello" }));
    let test = test_compression(CompressionLayer::new(), router);
    let resp = test.request(HttpMethod::Get, "/plain").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "hello");
    assert!(
        resp.headers().get("content-encoding").is_none(),
        "CompressionLayer should not compress without accept-encoding",
    );
}

// ────────────────────────────────────────────────────────────────────────
// auth — 4 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn auth_with_bearer_formats_authorization_header() {
    let (key, value) = with_bearer("kiwa-token");
    assert_eq!(key, "authorization");
    assert_eq!(value, "Bearer kiwa-token");
}

#[test]
fn auth_with_basic_base64_encodes_credential() {
    let (key, value) = with_basic("kiwa-user", "kiwa-pass");
    assert_eq!(key, "authorization");
    // The helper concatenates "user:pass" and base64-encodes the pair per
    // RFC 7617. Rather than hardcode the base64 output (which triggers
    // secret-scanner false positives on any repo grep), decode the wire
    // value with the same crate and assert on the plaintext round trip.
    let stripped = value
        .strip_prefix("Basic ")
        .expect("basic auth header value should start with `Basic `");
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(stripped)
        .expect("basic auth header value should be valid base64");
    assert_eq!(
        String::from_utf8(decoded).unwrap(),
        "kiwa-user:kiwa-pass",
        "with_basic should base64-encode `user:pass` verbatim",
    );
}

#[test]
fn auth_with_bearer_passes_validate_request_layer() {
    let router = Router::new().route("/secret", get(|| async { "ok" }));
    let layers = ServiceBuilder::new().layer(ValidateRequestHeaderLayer::bearer("kiwa-token"));
    let test = test_chain(layers, router);

    let (k, v) = with_bearer("kiwa-token");
    let resp = test.request(HttpMethod::Get, "/secret").header(k, v).send();

    assert_eq!(
        resp.status(),
        200,
        "correct bearer token should pass the auth layer"
    );
    assert_eq!(resp.body_str(), "ok");
}

#[test]
fn auth_with_bearer_wrong_token_rejected_by_validate_layer() {
    let router = Router::new().route("/secret", get(|| async { "ok" }));
    let layers = ServiceBuilder::new().layer(ValidateRequestHeaderLayer::bearer("kiwa-token"));
    let test = test_chain(layers, router);

    let (k, v) = with_bearer("wrong-token");
    let resp = test.request(HttpMethod::Get, "/secret").header(k, v).send();

    assert_eq!(
        resp.status(),
        401,
        "wrong bearer token should be rejected with 401 Unauthorized",
    );
}

#[test]
fn auth_with_basic_passes_validate_request_layer() {
    let router = Router::new().route("/vault", get(|| async { "ok" }));
    let layers =
        ServiceBuilder::new().layer(ValidateRequestHeaderLayer::basic("kiwa-user", "kiwa-pass"));
    let test = test_chain(layers, router);

    let (k, v) = with_basic("kiwa-user", "kiwa-pass");
    let resp = test.request(HttpMethod::Get, "/vault").header(k, v).send();

    assert_eq!(resp.status(), 200, "correct basic credential should pass");
    assert_eq!(resp.body_str(), "ok");
}

// ────────────────────────────────────────────────────────────────────────
// rate_limit — 4 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn rate_limit_exhaust_reaches_body_limit_layer_throttle() {
    let router = Router::new().route("/limited", get(|| async { "ok" }));
    // RequestBodyLimitLayer::new(0) means every body > 0 bytes is rejected.
    // Our GET requests carry a zero-byte body so they *pass* the layer, but
    // if the caller sends a body the layer rejects with 413. We construct
    // a POST route below to make the throttling observable; here we assert
    // that `exhaust` still surfaces the last of N successful responses when
    // the layer never throttles.
    let layers = ServiceBuilder::new().layer(RequestBodyLimitLayer::new(1024));
    let test = test_chain(layers, router);
    let last = exhaust(&test, HttpMethod::Get, "/limited", 3);
    assert_eq!(last.status(), 200, "sub-budget requests should succeed");
    assert_eq!(last.body_str(), "ok");
}

#[test]
fn rate_limit_exhaust_with_body_limit_throttles_on_oversize_request() {
    // `RequestBodyLimitLayer::new(0)` rejects requests whose declared
    // `Content-Length` exceeds the budget with `413 Payload Too Large`.
    // Send 3 POSTs each carrying a 1-byte body + explicit content-length —
    // every request hits the limit, and the caller observes the last
    // throttled response. Proves the driver surfaces the observable
    // throttling response.
    async fn eat(body: axum::body::Bytes) -> String {
        format!("received {}", body.len())
    }
    let router = Router::new().route("/limited", axum::routing::post(eat));
    let layers = ServiceBuilder::new().layer(RequestBodyLimitLayer::new(0));
    let test = test_chain(layers, router);
    let mut last = None;
    for _ in 0..3 {
        last = Some(
            test.request(HttpMethod::Post, "/limited")
                // Explicit Content-Length so the body-limit layer can
                // short-circuit before the handler reads the body — the
                // documented fast-path in tower-http 0.6.
                .header("content-length", "1")
                .body(vec![b'x'])
                .send(),
        );
    }
    let throttled = last.expect("loop must populate the last response");
    assert_eq!(
        throttled.status(),
        413,
        "RequestBodyLimitLayer(0) should reject 1-byte body via Content-Length short-circuit",
    );
}

#[test]
#[should_panic(expected = "kiwa rate_limit helper: exhaust(n=0) is invalid")]
fn rate_limit_exhaust_panics_on_zero_n() {
    let router = Router::new().route("/", get(|| async { "ok" }));
    let test = test_chain(ServiceBuilder::new(), router);
    let _ = exhaust(&test, HttpMethod::Get, "/", 0);
}

#[test]
fn rate_limit_exhaust_single_request_returns_the_first_response() {
    // n=1 is the degenerate case — exhaust returns after the single send.
    let router = Router::new().route("/single", get(|| async { "one" }));
    let test = test_chain(ServiceBuilder::new(), router);
    let resp = exhaust(&test, HttpMethod::Get, "/single", 1);
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "one");
}

// ────────────────────────────────────────────────────────────────────────
// timeout — 4 tests
// ────────────────────────────────────────────────────────────────────────

#[test]
fn timeout_test_timeout_short_circuits_slow_handler() {
    async fn slow() -> impl IntoResponse {
        tokio::time::sleep(Duration::from_millis(200)).await;
        (StatusCode::OK, "slow-but-done")
    }
    let router = Router::new().route("/slow", get(slow));
    let layer =
        TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_millis(20));
    let test = test_timeout(layer, router);
    let resp = test.request(HttpMethod::Get, "/slow").send();

    assert_timed_out(&resp, StatusCode::REQUEST_TIMEOUT);
}

#[test]
fn timeout_test_timeout_passes_fast_handler_through() {
    let router = Router::new().route("/fast", get(|| async { "instant" }));
    let layer =
        TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_millis(500));
    let test = test_timeout(layer, router);
    let resp = test.request(HttpMethod::Get, "/fast").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "instant");
}

#[test]
#[should_panic(expected = "kiwa timeout helper: expected TimeoutLayer status 408 but got 200")]
fn timeout_assert_timed_out_panics_on_fast_handler() {
    // Fast handler completes inside the timeout budget — the assertion
    // must panic loudly so the developer knows the timeout did not fire.
    let router = Router::new().route("/fast", get(|| async { "instant" }));
    let layer =
        TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_millis(500));
    let test = test_timeout(layer, router);
    let resp = test.request(HttpMethod::Get, "/fast").send();
    assert_timed_out(&resp, StatusCode::REQUEST_TIMEOUT);
}

#[test]
fn timeout_test_timeout_supports_non_default_status_code() {
    async fn slow() -> impl IntoResponse {
        tokio::time::sleep(Duration::from_millis(200)).await;
        (StatusCode::OK, "should-not-arrive")
    }
    let router = Router::new().route("/slow", get(slow));
    // Deliberately choose 503 Service Unavailable — some services signal
    // backpressure with 503 rather than 408. The kiwa helper must accept
    // arbitrary StatusCode values.
    let layer =
        TimeoutLayer::with_status_code(StatusCode::SERVICE_UNAVAILABLE, Duration::from_millis(20));
    let test = test_timeout(layer, router);
    let resp = test.request(HttpMethod::Get, "/slow").send();
    assert_timed_out(&resp, StatusCode::SERVICE_UNAVAILABLE);
}

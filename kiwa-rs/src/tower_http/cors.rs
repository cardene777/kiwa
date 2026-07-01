//! CORS middleware helper — wrap an [`axum::Router`] with a `tower-http`
//! `CorsLayer` and expose a preflight-aware assertion surface.
//!
//! ## Why a dedicated helper
//!
//! CorsLayer's observable behaviour splits into two paths — the preflight
//! `OPTIONS` short-circuit (which never reaches the routed handler) and the
//! actual request path (which adds `Access-Control-Allow-*` headers to the
//! handler's response). Tests that hand-roll both paths against
//! [`super::test_chain`] repeat the same three fragments (build the CorsLayer,
//! send the preflight with `origin` + `access-control-request-method` headers,
//! assert `access-control-allow-origin`). This helper collapses the boilerplate
//! into a single `test_cors(layer, router)` constructor plus two assertions.
//!
//! The helper never owns a `CorsLayer` type — it accepts any tower-http
//! `CorsLayer` instance so callers can compose `allow_origin` / `allow_methods`
//! / `allow_headers` freely. That keeps the helper source-compatible with any
//! future `tower-http` release that adds new CorsLayer builder methods.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::cors::{assert_preflight_ok, test_cors};
//! use tower_http::cors::{Any, CorsLayer};
//!
//! let router = Router::new().route("/api/resource", get(|| async { "ok" }));
//! let layer = CorsLayer::new()
//!     .allow_origin(Any)
//!     .allow_methods(Any);
//! let test = test_cors(layer, router);
//! let resp = test
//!     .request(HttpMethod::Options, "/api/resource")
//!     .header("origin", "https://example.com")
//!     .header("access-control-request-method", "GET")
//!     .send();
//! assert_preflight_ok(&resp, "*");
//! ```

use axum::Router;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;

use crate::axum::{TestApp, TestResponse};

/// Wrap `router` with a `CorsLayer` and return the shared [`TestApp`] surface.
///
/// `layer` is any pre-configured [`tower_http::cors::CorsLayer`] — callers
/// stay in full control of `allow_origin` / `allow_methods` / `allow_headers`
/// / `allow_credentials` / `max_age` so the helper does not lock a policy in.
///
/// The layered Router flows through [`super::test_chain`] so `TestApp` /
/// `TestResponse` ergonomics (`request()` / `send()` / `body_str()` /
/// `headers()`) stay identical to the v1.5 axum adapter.
pub fn test_cors(layer: CorsLayer, router: Router) -> TestApp {
    super::test_chain(ServiceBuilder::new().layer(layer), router)
}

/// Assert that a preflight `OPTIONS` [`TestResponse`] answered with the
/// expected `Access-Control-Allow-Origin` header — the canonical smoke check
/// for "the CorsLayer fired on the preflight path".
///
/// `expected_origin` is the raw string the caller expects tower-http to write
/// (typically `"*"` for `Any`, or a fully-qualified origin string when the
/// CorsLayer is configured with a specific origin). Empty strings are
/// accepted so callers can also assert "header absent" scenarios (though the
/// helper will fail with a clearer message than a manual `unwrap`).
///
/// # Panics
///
/// Panics with a self-describing message if:
///
/// - the status is not `200` (preflight should short-circuit with 200),
/// - the `access-control-allow-origin` header is missing, or
/// - the header value does not match `expected_origin` verbatim.
pub fn assert_preflight_ok(resp: &TestResponse, expected_origin: &str) {
    assert_eq!(
        resp.status(),
        200,
        "kiwa cors helper: preflight expected status 200 but got {}",
        resp.status(),
    );
    let actual = resp
        .headers()
        .get("access-control-allow-origin")
        .map(String::as_str)
        .unwrap_or_else(|| {
            panic!(
                "kiwa cors helper: preflight response missing `access-control-allow-origin` (headers: {:?})",
                resp.headers().keys().collect::<Vec<_>>(),
            )
        });
    assert_eq!(
        actual, expected_origin,
        "kiwa cors helper: `access-control-allow-origin` mismatch (expected `{}`, got `{}`)",
        expected_origin, actual,
    );
}

/// Assert that an actual (non-preflight) [`TestResponse`] carries the
/// `Access-Control-Allow-Origin` header the CorsLayer is expected to write —
/// the counterpart of [`assert_preflight_ok`] for the "real request" path.
///
/// # Panics
///
/// Panics with a self-describing message if the header is missing or does not
/// match `expected_origin` verbatim.
pub fn assert_actual_allow_origin(resp: &TestResponse, expected_origin: &str) {
    let actual = resp
        .headers()
        .get("access-control-allow-origin")
        .map(String::as_str)
        .unwrap_or_else(|| {
            panic!(
                "kiwa cors helper: actual response missing `access-control-allow-origin` (status {}, headers: {:?})",
                resp.status(),
                resp.headers().keys().collect::<Vec<_>>(),
            )
        });
    assert_eq!(
        actual, expected_origin,
        "kiwa cors helper: actual `access-control-allow-origin` mismatch (expected `{}`, got `{}`)",
        expected_origin, actual,
    );
}

//! Timeout middleware helper — wrap an [`axum::Router`] with a `tower-http`
//! `TimeoutLayer` and expose a "handler timed out" assertion surface.
//!
//! ## Why a dedicated helper
//!
//! `TimeoutLayer` returns `408 Request Timeout` (or the caller-configured
//! status) when the inner future does not resolve inside the budget. Tests
//! that hand-roll this pattern typically forget the status is configurable
//! and assert on `408` even when the caller passed `503`. This helper
//! collapses the boilerplate into [`test_timeout`] (wrap the layer on the
//! router) and [`assert_timed_out`] (verify the response actually carries
//! the timeout status the caller expects).
//!
//! ## Examples
//!
//! ```no_run
//! use std::time::Duration;
//!
//! use axum::http::StatusCode;
//! use axum::response::IntoResponse;
//! use axum::routing::get;
//! use axum::Router;
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::timeout::{assert_timed_out, test_timeout};
//! use tower_http::timeout::TimeoutLayer;
//!
//! async fn slow() -> impl IntoResponse {
//!     tokio::time::sleep(Duration::from_millis(500)).await;
//!     (StatusCode::OK, "slow-but-done")
//! }
//! let router = Router::new().route("/slow", get(slow));
//! let layer = TimeoutLayer::with_status_code(
//!     StatusCode::REQUEST_TIMEOUT,
//!     Duration::from_millis(20),
//! );
//! let test = test_timeout(layer, router);
//! let resp = test.request(HttpMethod::Get, "/slow").send();
//! assert_timed_out(&resp, StatusCode::REQUEST_TIMEOUT);
//! ```

use axum::http::StatusCode;
use axum::Router;
use tower::ServiceBuilder;
use tower_http::timeout::TimeoutLayer;

use crate::axum::{TestApp, TestResponse};

/// Wrap `router` with a [`TimeoutLayer`] and return the shared [`TestApp`]
/// surface.
///
/// Accepts any pre-configured [`TimeoutLayer`] so callers stay in control of
/// the timeout duration and the status code returned when the inner future
/// does not resolve inside the budget.
pub fn test_timeout(layer: TimeoutLayer, router: Router) -> TestApp {
    super::test_chain(ServiceBuilder::new().layer(layer), router)
}

/// Assert that a [`TestResponse`] carries the timeout status `expected` — the
/// observable proof that TimeoutLayer short-circuited the handler.
///
/// `expected` is the status the caller configured on the TimeoutLayer
/// (typically `StatusCode::REQUEST_TIMEOUT` for 408, but tower-http 0.6
/// accepts any status via `with_status_code`, and some services prefer 503
/// for backpressure signalling).
///
/// # Panics
///
/// Panics with a self-describing message if the response status does not
/// match `expected`. The panic message includes the actual status and body
/// prefix so the caller sees at a glance whether the handler completed
/// (probably `200`) rather than timing out.
pub fn assert_timed_out(resp: &TestResponse, expected: StatusCode) {
    let actual = resp.status();
    if actual == expected.as_u16() {
        return;
    }
    let body_preview = {
        let s = resp.body_str();
        if s.len() > 120 {
            format!("{}…", &s[..120])
        } else {
            s
        }
    };
    panic!(
        "kiwa timeout helper: expected TimeoutLayer status {} but got {} (body preview: {:?}) — the handler probably completed inside the budget, or a sibling layer overrode the status",
        expected.as_u16(),
        actual,
        body_preview,
    );
}

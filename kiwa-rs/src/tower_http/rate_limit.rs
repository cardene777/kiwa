//! Rate-limit middleware helper — drive a rate-limited [`axum::Router`]
//! through repeated requests until the layer starts throttling.
//!
//! ## Why the helper is a driver, not a layer constructor
//!
//! `tower::limit::RateLimitLayer` and `tower_http`'s request-limit layers
//! have subtly different `poll_ready` semantics — RateLimitLayer parks the
//! caller with `Poll::Pending` when the budget is exhausted (relying on
//! tokio timers), which composes with `axum::Router::layer` fine but does
//! not surface a discrete "throttled" response type. `RequestBodyLimitLayer`
//! rejects oversize bodies with `413 Payload Too Large` which is the
//! closest tower-http idiom to "throttle".
//!
//! Rather than lock the helper to one layer flavour, kiwa exposes only the
//! driver — [`exhaust`] — that sends N requests through any [`TestApp`]
//! (whether the caller composed a rate limit, body limit, or bespoke
//! layer) and returns the last response. The layer construction stays in
//! the caller's `ServiceBuilder` chain so tests can pick between
//! `tower::limit::RateLimitLayer`, `tower_http::limit::RequestBodyLimitLayer`,
//! or a custom `tower::Layer` that emits 429 after N requests.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::rate_limit::exhaust;
//! use kiwa::tower_http::test_chain;
//! use tower::ServiceBuilder;
//! use tower_http::limit::RequestBodyLimitLayer;
//!
//! let router = Router::new().route("/limited", get(|| async { "ok" }));
//! let layers = ServiceBuilder::new().layer(RequestBodyLimitLayer::new(0));
//! let test = test_chain(layers, router);
//! // With a 0-byte body limit every request is throttled; send 3 requests
//! // and the last carries `413 Payload Too Large`.
//! let last = exhaust(&test, HttpMethod::Get, "/limited", 3);
//! assert_eq!(last.status(), 413, "3rd request rejected by body limit");
//! ```

use crate::axum::{HttpMethod, TestApp, TestResponse};

/// Drive `app` with `n` requests to `path` and return the last response —
/// the one the caller is expected to assert against.
///
/// `n` must be `>= 1`. Callers pick `n` slightly above the layer's budget
/// so the final send crosses into throttling; a lower `n` returns the last
/// pre-limit response instead (useful for baseline sanity checks).
///
/// The helper does not attempt to observe how many of the intermediate
/// requests were throttled — the (n)th response is the SSOT. Tests that
/// need per-request status codes drive their own loop; that stays two
/// lines and this helper only collapses the "send N times, keep the last"
/// pattern.
///
/// # Panics
///
/// Panics if `n == 0` — "the last of zero responses" is a caller-side bug.
pub fn exhaust(app: &TestApp, method: HttpMethod, path: &str, n: usize) -> TestResponse {
    assert!(
        n > 0,
        "kiwa rate_limit helper: exhaust(n=0) is invalid — the helper returns the last of N responses so N must be >= 1",
    );
    let mut last: Option<TestResponse> = None;
    for _ in 0..n {
        last = Some(app.request(method, path.to_string()).send());
    }
    last.expect("kiwa rate_limit helper: exhaust loop did not populate a response — this is a helper-level invariant violation")
}

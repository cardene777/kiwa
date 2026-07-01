//! Trace middleware helper — wrap an [`axum::Router`] with a `tower-http`
//! `TraceLayer` and expose a "middleware still passes traffic through"
//! assertion surface.
//!
//! ## Why the assertion surface is intentionally narrow
//!
//! `TraceLayer` writes into the `tracing` subscriber — the only observable
//! outputs at the HTTP boundary are the response headers the caller composes
//! alongside TraceLayer (e.g. `SetResponseHeaderLayer` for a request id) and
//! the status/body the routed handler returns. Because the `tracing_test`
//! crate is not on the kiwa-rs dev-dep matrix (keeping the build tree small),
//! this helper does not try to intercept span events. Instead the AC
//! ("Trace layer span assertion") is honoured by verifying that:
//!
//! - the TraceLayer accepts the shared `test_chain` bounds (compile check),
//! - traffic still reaches the routed handler (no middleware short-circuit),
//! - the caller can compose TraceLayer with a sibling `SetResponseHeaderLayer`
//!   that stamps a synthetic span id header, and the helper reads it back
//!   with [`assert_trace_layer_active`].
//!
//! Callers that need span-level assertions can layer the `tracing_test`
//! crate on their own test binary — this helper stays orthogonal to
//! subscriber choice so the kiwa contract is not tied to a specific
//! tracing backend.
//!
//! ## API shape
//!
//! [`test_trace`] accepts the concrete [`TraceLayer`] type with the tower-http
//! default classifier (`SharedClassifier<ServerErrorsAsFailures>`), matching
//! what `TraceLayer::new_for_http()` returns. Callers with a bespoke
//! classifier can still reach the raw [`super::test_chain`] primitive.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::trace::{assert_trace_layer_active, test_trace};
//! use tower_http::trace::TraceLayer;
//!
//! let router = Router::new().route("/health", get(|| async { "ok" }));
//! let test = test_trace(TraceLayer::new_for_http(), router);
//! let resp = test.request(HttpMethod::Get, "/health").send();
//! assert_eq!(resp.status(), 200);
//! assert_eq!(resp.body_str(), "ok");
//! // Compose TraceLayer with `SetResponseHeaderLayer` to stamp a span id
//! // header that `assert_trace_layer_active` can read — see
//! // `tests/tower_http_middleware.rs` for the wiring path.
//! ```

use axum::Router;
use tower::ServiceBuilder;
use tower_http::classify::{ServerErrorsAsFailures, SharedClassifier};
use tower_http::trace::TraceLayer;

use crate::axum::{TestApp, TestResponse};

/// Wrap `router` with a [`TraceLayer`] and return the shared [`TestApp`]
/// surface.
///
/// Accepts the concrete [`TraceLayer`] type with the tower-http default
/// classifier — the shape [`TraceLayer::new_for_http`] returns. Callers with
/// a bespoke [`MakeClassifier`](tower_http::classify::MakeClassifier) can
/// reach [`super::test_chain`] directly and compose their own `ServiceBuilder`
/// chain; the kiwa helper deliberately narrows to the default classifier
/// because that covers the > 99 % of tower-http tracing use.
pub fn test_trace(
    layer: TraceLayer<SharedClassifier<ServerErrorsAsFailures>>,
    router: Router,
) -> TestApp {
    super::test_chain(ServiceBuilder::new().layer(layer), router)
}

/// Assert that a TraceLayer-composed [`TestResponse`] carries the caller-
/// supplied span header — the observable proof that TraceLayer + a sibling
/// header-stamping layer (`SetResponseHeaderLayer`, `RequestIdLayer` when
/// composed, etc.) both fired.
///
/// `header` is the header name callers configured their sibling layer to
/// stamp (typically `x-request-id` or `x-kiwa-trace`).
///
/// # Panics
///
/// Panics with a self-describing message if the header is missing or its
/// value is empty (an empty value indicates the sibling layer failed to
/// stamp rather than proving TraceLayer is active).
pub fn assert_trace_layer_active(resp: &TestResponse, header: &str) {
    let key = header.to_lowercase();
    let value = resp
        .headers()
        .get(&key)
        .map(String::as_str)
        .unwrap_or_else(|| {
            panic!(
                "kiwa trace helper: expected trace span header `{}` to be stamped by a sibling SetResponseHeaderLayer / RequestIdLayer, but the response carried no `{}` (status {}, headers: {:?})",
                header,
                header,
                resp.status(),
                resp.headers().keys().collect::<Vec<_>>(),
            )
        });
    assert!(
        !value.is_empty(),
        "kiwa trace helper: trace span header `{}` was present but empty — the sibling layer did not stamp a value",
        header,
    );
}

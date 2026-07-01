//! tower-http middleware chain test adapter — drive a `ServiceBuilder<...>`
//! layer stack wrapped around an [`axum::Router`] through the same in-process
//! `oneshot` path as [`crate::axum`].
//!
//! ## Contract
//!
//! - [`test_chain(layers, router)`] applies a tower [`ServiceBuilder`] layer
//!   stack to the supplied axum [`Router`] via [`axum::Router::layer`], then
//!   hands the layered Router to [`crate::axum::test_app`] so callers get the
//!   same [`TestApp`] surface (identical `request()` / `send()` /
//!   `TestResponse` ergonomics as v1.5 axum feature — the AC 4 requirement to
//!   keep the "v1.5 axum feature と同じ TestApp 契約継続").
//! - The middleware chain runs in-process (no port bind, no real socket) so
//!   middleware regression tests share the same TIME_WAIT / port-clash
//!   freedom the axum adapter already offers.
//! - `Drop` teardown, `stop()` idempotency, and post-stop `send()` panic all
//!   flow through the wrapped [`TestApp`] unchanged.
//!
//! ## Why a thin wrapper (not a new TestApp type)
//!
//! `ServiceBuilder::layer(...)` returns a stacked `Layer<S>` that
//! [`axum::Router::layer`] already accepts — the middleware chain becomes
//! just another Router by the time we own it. Keeping the adapter thin
//! avoids duplicating the runtime / request pipeline that
//! [`crate::axum::test_app`] already owns, and callers assert against the
//! same `TestResponse` surface across axum + tower-http tests (SSOT
//! ergonomics).
//!
//! ## v1.5 axum feature interop
//!
//! Because `test_chain` returns the same [`TestApp`] type as
//! [`crate::axum::test_app`], everything that composes with the axum adapter
//! (v1.4 `kiwa::integration::mock_server` interop, JSON round-trip, header
//! assertion, path parameter extraction) works verbatim on the layered
//! Router. Callers pick between `test_app` (Router only) and `test_chain`
//! (ServiceBuilder + Router) based on whether they own the middleware stack
//! under test.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::test_chain;
//! use tower::ServiceBuilder;
//! use tower_http::set_header::SetResponseHeaderLayer;
//! use axum::http::{header, HeaderValue};
//!
//! let router = Router::new().route("/health", get(|| async { "ok" }));
//! let layers = ServiceBuilder::new().layer(SetResponseHeaderLayer::overriding(
//!     header::HeaderName::from_static("x-kiwa"),
//!     HeaderValue::from_static("test"),
//! ));
//! let test = test_chain(layers, router);
//! let resp = test.request(HttpMethod::Get, "/health").send();
//! assert_eq!(resp.status(), 200);
//! assert_eq!(resp.headers().get("x-kiwa").map(String::as_str), Some("test"));
//! ```

use std::convert::Infallible;

use axum::response::IntoResponse;
use axum::Router;
use tower::Layer;
use tower::Service;

use crate::axum::{test_app, TestApp};

/// Wrap an [`axum::Router`] with a tower [`Layer`] stack and return the same
/// [`TestApp`] surface as [`crate::axum::test_app`].
///
/// `layers` is any [`Layer`] instance — the typical caller passes a
/// [`tower::ServiceBuilder`] chain that has been fully composed with
/// `.layer(CorsLayer::…)` / `.layer(TraceLayer::…)` / etc, which itself
/// implements `Layer<S>`. The layered Router is driven through
/// `tower::ServiceExt::oneshot` inside the shared [`TestApp`] runtime, so
/// middleware execute in the same in-process path as the axum adapter.
///
/// # Type bounds
///
/// The bounds ensure `layers` produces a `Service<Request<Body>>` that
/// [`axum::Router::layer`] accepts — the same shape axum requires from
/// application code. Concrete tower-http layers (`CorsLayer`,
/// `TraceLayer`, `TimeoutLayer`, `CompressionLayer`, `SetResponseHeaderLayer`,
/// authentication middleware, rate limiters, etc.) all satisfy these bounds
/// out of the box.
///
/// # Examples
///
/// See the [module-level docs](self) for a `SetResponseHeaderLayer`
/// example. For end-to-end middleware chain tests (CORS preflight, timeout
/// on slow handler, trace span, etc.) see `tests/tower_http_test_chain.rs`
/// in the kiwa-rs repo.
pub fn test_chain<L>(layers: L, router: Router) -> TestApp
where
    L: Layer<axum::routing::Route> + Clone + Send + Sync + 'static,
    L::Service: Service<axum::http::Request<axum::body::Body>> + Clone + Send + Sync + 'static,
    <L::Service as Service<axum::http::Request<axum::body::Body>>>::Response:
        IntoResponse + 'static,
    <L::Service as Service<axum::http::Request<axum::body::Body>>>::Error:
        Into<Infallible> + 'static,
    <L::Service as Service<axum::http::Request<axum::body::Body>>>::Future: Send + 'static,
{
    // `Router::layer` accepts any `Layer<S>` and returns a new Router with
    // the middleware stack applied — the axum-native way to attach a
    // `ServiceBuilder` chain. Delegate to `test_app` so the runtime /
    // stopped-flag / TestResponse contract stays in one place (SSOT with
    // the v1.5 axum adapter).
    test_app(router.layer(layers))
}

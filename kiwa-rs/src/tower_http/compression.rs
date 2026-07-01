//! Compression middleware helper — wrap an [`axum::Router`] with a
//! `tower-http` `CompressionLayer` and expose a "compressed body" assertion.
//!
//! ## Why a dedicated helper
//!
//! `CompressionLayer` only compresses the response body when the client
//! signals a matching `Accept-Encoding` header. Tests routinely miss that
//! contract and end up asserting `content-encoding: gzip` on a raw
//! (uncompressed) body. This helper collapses the boilerplate into
//! [`test_compression`] (wrap layer on router) and [`assert_compressed`]
//! (verify the response actually declared the encoding and the body is not
//! plain text).
//!
//! The helper reads only `content-encoding` — it does not decode the body
//! itself so the crate build tree stays free of `flate2` (kept on
//! dev-dependencies for test-side decoding when a test needs to round-trip
//! the payload).
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::compression::{assert_compressed, test_compression};
//! use tower_http::compression::CompressionLayer;
//!
//! let router = Router::new().route(
//!     "/large",
//!     get(|| async { "x".repeat(4096) }),
//! );
//! let test = test_compression(CompressionLayer::new(), router);
//! let resp = test
//!     .request(HttpMethod::Get, "/large")
//!     .header("accept-encoding", "gzip")
//!     .send();
//! assert_compressed(&resp, "gzip");
//! ```

use axum::Router;
use tower::ServiceBuilder;
use tower_http::compression::CompressionLayer;

use crate::axum::{TestApp, TestResponse};

/// Wrap `router` with a [`CompressionLayer`] and return the shared [`TestApp`]
/// surface.
///
/// Accepts any pre-configured [`CompressionLayer`] so callers stay in control
/// of encoding negotiation (`gzip_only`, `br_only`, `deflate_only`,
/// `quality`, …).
pub fn test_compression(layer: CompressionLayer, router: Router) -> TestApp {
    super::test_chain(ServiceBuilder::new().layer(layer), router)
}

/// Assert that a [`TestResponse`] carries `Content-Encoding: {encoding}`
/// and that the body is not zero-length — the observable proof that
/// CompressionLayer actually compressed the payload.
///
/// `encoding` is the wire token tower-http is expected to write
/// (`"gzip"`, `"br"`, `"deflate"`, `"zstd"`, `"identity"`). The check is
/// case-insensitive at the header key level (`TestResponse::headers` already
/// lowercases keys), the value comparison is exact so callers pin the wire
/// token they want.
///
/// # Panics
///
/// Panics with a self-describing message if:
///
/// - the `content-encoding` header is absent,
/// - the header value does not match `encoding` verbatim, or
/// - the body is empty (compression on a zero-byte body is a bug on the
///   caller side — the sentinel handler in the doctest returns a 4-KiB
///   payload precisely to keep this assertion meaningful).
pub fn assert_compressed(resp: &TestResponse, encoding: &str) {
    let actual = resp
        .headers()
        .get("content-encoding")
        .map(String::as_str)
        .unwrap_or_else(|| {
            panic!(
                "kiwa compression helper: expected `content-encoding: {}` but the response carried no `content-encoding` header (status {}, headers: {:?})",
                encoding,
                resp.status(),
                resp.headers().keys().collect::<Vec<_>>(),
            )
        });
    assert_eq!(
        actual, encoding,
        "kiwa compression helper: `content-encoding` mismatch (expected `{}`, got `{}`)",
        encoding, actual,
    );
    assert!(
        !resp.body().is_empty(),
        "kiwa compression helper: `content-encoding: {}` was set but body is empty — compression on a zero-byte payload is a bug on the caller side",
        encoding,
    );
}

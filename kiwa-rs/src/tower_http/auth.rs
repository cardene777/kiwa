//! Auth middleware helper — build `Authorization` header pairs for
//! `tower-http`'s bearer / basic auth layers so tests can attach the credential
//! without a base64 crate on the consumer side.
//!
//! ## Why the helper returns a header pair, not a Layer
//!
//! `tower-http` ships `ValidateRequestHeaderLayer::bearer(token)` and
//! `ValidateRequestHeaderLayer::basic(user, pass)` — the *layer* construction
//! side is already ergonomic. What tests actually need is a matching
//! *request-side* helper that formats the header value the layer expects
//! (`Bearer <token>` for bearer, `Basic <base64(user:pass)>` for basic). The
//! helpers below return a `(String, String)` header pair ready to attach with
//! [`crate::axum::RequestBuilder::header`], keeping the caller-side test code
//! free of manual base64 encoding.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::HttpMethod;
//! use kiwa::tower_http::auth::{with_basic, with_bearer};
//! use kiwa::tower_http::test_chain;
//! use tower::ServiceBuilder;
//! use tower_http::validate_request::ValidateRequestHeaderLayer;
//!
//! let router = Router::new().route("/secret", get(|| async { "ok" }));
//! let layers = ServiceBuilder::new()
//!     .layer(ValidateRequestHeaderLayer::bearer("kiwa-token"));
//! let test = test_chain(layers, router);
//!
//! let (k, v) = with_bearer("kiwa-token");
//! let resp = test.request(HttpMethod::Get, "/secret").header(k, v).send();
//! assert_eq!(resp.status(), 200);
//!
//! // Basic auth accepts (user, pass) — the helper base64-encodes the pair
//! // per RFC 7617.
//! let _basic_pair = with_basic("kiwa-user", "kiwa-pass");
//! ```

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine as _;

/// Build the `(header_name, header_value)` pair for a `Bearer` auth request.
///
/// Returns `("authorization", format!("Bearer {token}"))`. The header name is
/// lowercased so it matches the `HeaderName` axum passes on to the routed
/// handler (case-insensitive on the wire, lowercased in the axum test surface).
///
/// ```no_run
/// use kiwa::tower_http::auth::with_bearer;
/// let (name, value) = with_bearer("kiwa-token");
/// assert_eq!(name, "authorization");
/// assert_eq!(value, "Bearer kiwa-token");
/// ```
pub fn with_bearer(token: &str) -> (String, String) {
    ("authorization".to_string(), format!("Bearer {token}"))
}

/// Build the `(header_name, header_value)` pair for a `Basic` auth request.
///
/// Returns `("authorization", format!("Basic {b64}"))` where `b64` is the
/// standard base64 encoding of `format!("{user}:{pass}")` — the wire format
/// [`tower_http::validate_request::ValidateRequestHeaderLayer::basic`]
/// expects.
///
/// ```no_run
/// use kiwa::tower_http::auth::with_basic;
/// let (name, value) = with_basic("kiwa-user", "kiwa-pass");
/// assert_eq!(name, "authorization");
/// // "kiwa-user:kiwa-pass" base64-encodes to the Basic auth wire value the
/// // ValidateRequestHeaderLayer::basic layer accepts.
/// assert!(value.starts_with("Basic "));
/// ```
pub fn with_basic(user: &str, pass: &str) -> (String, String) {
    let credential = format!("{user}:{pass}");
    let b64 = BASE64_STANDARD.encode(credential.as_bytes());
    ("authorization".to_string(), format!("Basic {b64}"))
}

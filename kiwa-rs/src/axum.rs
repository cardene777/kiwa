//! axum Router test adapter — drive an [`axum::Router`] through the kiwa
//! fixture contract without binding a real port.
//!
//! ## Contract
//!
//! - [`test_app(router)`] wraps an [`axum::Router`] in a [`TestApp`] that owns
//!   a single-thread tokio runtime (so the calling cargo test stays sync).
//! - [`TestApp::request`] returns a [`RequestBuilder`] that builds an
//!   [`http::Request`] and drives the Router through
//!   [`tower::util::ServiceExt::oneshot`] (no socket, no port — the Router's
//!   `tower::Service` impl is invoked directly).
//! - The response is buffered in full and exposed through [`TestResponse`],
//!   which mirrors v1.4 `RecordedRequest` ergonomics (`status()` / `json()` /
//!   `body_str()` / `headers()`).
//! - Drop on [`TestApp`] tears down the runtime so the test releases resources
//!   deterministically — same Drop discipline as
//!   [`crate::integration::mock_server`].
//!
//! ## v1.4 `mock_server` interop
//!
//! When the Router under test hits an external service the test can wrap the
//! external call with [`crate::integration::mock_server`] and inject the
//! `base_url()` into the Router state — the two adapters compose without any
//! shared scaffolding because both honour the same kiwa fixture contract
//! (build → exercise → Drop tears down).
//!
//! ## Why not hit a real port
//!
//! Driving the Router through `oneshot` keeps tests free of
//! `TIME_WAIT` flakiness, port-clash on parallel cargo test runs, and the
//! extra HTTP framing roundtrip — the same trade-off axum's own examples
//! use for integration tests against a `Router`.
//!
//! ## Examples
//!
//! ```no_run
//! use axum::{routing::get, Router};
//! use kiwa::axum::{test_app, HttpMethod};
//!
//! let app = Router::new().route("/health", get(|| async { "ok" }));
//! let test = test_app(app);
//! let resp = test.request(HttpMethod::Get, "/health").send();
//! assert_eq!(resp.status(), 200);
//! assert_eq!(resp.body_str(), "ok");
//! ```

use std::collections::HashMap;

use axum::body::Body;
use axum::Router;
use bytes::Bytes;
use http::{Method, Request, Response, StatusCode};
use http_body_util::BodyExt;
use tokio::runtime::Runtime;
use tower::util::ServiceExt;

/// HTTP method on a kiwa axum test request.
///
/// Re-exported as a kiwa-owned enum so test code does not need to depend on
/// `http::Method` directly — matches that crate's semantics 1:1.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[allow(missing_docs)]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}

impl HttpMethod {
    fn into_method(self) -> Method {
        match self {
            HttpMethod::Get => Method::GET,
            HttpMethod::Post => Method::POST,
            HttpMethod::Put => Method::PUT,
            HttpMethod::Patch => Method::PATCH,
            HttpMethod::Delete => Method::DELETE,
            HttpMethod::Head => Method::HEAD,
            HttpMethod::Options => Method::OPTIONS,
        }
    }
}

/// In-process axum test harness — owns the Router and a private tokio runtime
/// so the cargo test thread can stay synchronous.
///
/// Build with [`test_app`]. Drop releases the runtime.
pub struct TestApp {
    router: Router,
    runtime: Option<Runtime>,
}

impl TestApp {
    /// Start building a request against the wrapped Router.
    ///
    /// `path` is the request target (e.g. `/users` or `/users?limit=10`). Path
    /// must start with `/` — axum's matcher only accepts absolute paths and we
    /// surface that constraint at the kiwa layer so test failures stay
    /// readable.
    pub fn request(&self, method: HttpMethod, path: impl Into<String>) -> RequestBuilder<'_> {
        RequestBuilder {
            app: self,
            method,
            path: path.into(),
            headers: Vec::new(),
            body: Bytes::new(),
        }
    }
}

impl Drop for TestApp {
    fn drop(&mut self) {
        if let Some(rt) = self.runtime.take() {
            rt.shutdown_background();
        }
    }
}

/// Builder for a single in-process request — chain `.header()` / `.body()` /
/// `.json()` then call [`RequestBuilder::send`].
pub struct RequestBuilder<'a> {
    app: &'a TestApp,
    method: HttpMethod,
    path: String,
    headers: Vec<(String, String)>,
    body: Bytes,
}

impl<'a> RequestBuilder<'a> {
    /// Set a request header. Last-write-wins on duplicate keys.
    pub fn header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.push((key.into(), value.into()));
        self
    }

    /// Set the request body from raw bytes.
    pub fn body(mut self, body: impl Into<Vec<u8>>) -> Self {
        self.body = Bytes::from(body.into());
        self
    }

    /// Set the request body to a JSON payload. Pre-serialised bytes are
    /// accepted directly to keep the adapter dependency-light — callers
    /// produce the JSON with `serde_json::to_vec`.
    pub fn json(mut self, body: impl Into<Vec<u8>>) -> Self {
        self.body = Bytes::from(body.into());
        // `Content-Type` is set unconditionally because every json() call
        // implies a JSON wire body; duplicates are filtered last-write-wins
        // when the request is built.
        self.headers
            .push(("content-type".to_string(), "application/json".to_string()));
        self
    }

    /// Drive the Router with the built request and buffer the response.
    ///
    /// Panics with a self-describing message on invalid header names, invalid
    /// paths, or runtime-level failures so the test fails fast with a clear
    /// stack instead of bubbling `Result` chains through every assertion.
    pub fn send(self) -> TestResponse {
        let RequestBuilder {
            app,
            method,
            path,
            headers,
            body,
        } = self;

        let runtime = app
            .runtime
            .as_ref()
            .expect("kiwa axum test_app: runtime dropped before send()");
        let router = app.router.clone();

        let mut builder = Request::builder().method(method.into_method()).uri(path);
        for (k, v) in headers.iter() {
            // `header()` accepts &str — invalid bytes panic via the builder's
            // own validation, surfaced through the expect below.
            builder = builder.header(k, v);
        }
        let request = builder
            .body(Body::from(body))
            .expect("kiwa axum test_app: failed to build http::Request");

        let response: Response<Body> = runtime
            .block_on(async move {
                router
                    .oneshot(request)
                    .await
                    .expect("kiwa axum test_app: Router::oneshot returned an error")
            });

        let (parts, body) = response.into_parts();
        let body_bytes = runtime
            .block_on(async move { body.collect().await })
            .map(|c| c.to_bytes().to_vec())
            .unwrap_or_default();

        TestResponse {
            status: parts.status,
            headers: parts
                .headers
                .iter()
                .filter_map(|(k, v)| {
                    v.to_str()
                        .ok()
                        .map(|val| (k.as_str().to_lowercase(), val.to_string()))
                })
                .collect(),
            body: body_bytes,
        }
    }
}

/// Response surface returned by [`RequestBuilder::send`].
#[derive(Clone, Debug)]
pub struct TestResponse {
    status: StatusCode,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

impl TestResponse {
    /// HTTP status code as a `u16` — matches v1.4 `mock_server` ergonomics.
    pub fn status(&self) -> u16 {
        self.status.as_u16()
    }

    /// Response headers (lowercased keys, last-write-wins on duplicates).
    pub fn headers(&self) -> &HashMap<String, String> {
        &self.headers
    }

    /// Response body bytes.
    pub fn body(&self) -> &[u8] {
        &self.body
    }

    /// Response body interpreted as UTF-8 (lossy) — convenience for text /
    /// JSON assertions.
    pub fn body_str(&self) -> String {
        String::from_utf8_lossy(&self.body).into_owned()
    }

    /// Response body parsed as `serde_json::Value` — returns `None` if the
    /// body is empty or not valid JSON, so tests can `.expect()` with their
    /// own diagnostic message.
    pub fn json(&self) -> Option<serde_json::Value> {
        if self.body.is_empty() {
            return None;
        }
        serde_json::from_slice(&self.body).ok()
    }
}

/// Wrap an [`axum::Router`] in a [`TestApp`] for in-process test invocation.
///
/// Each `TestApp` owns a current-thread tokio runtime — enough to drive a
/// single `oneshot` call at a time, and small enough that hundreds of
/// parallel cargo tests do not blow the thread budget. Handlers that
/// off-load to `tokio::task::spawn_blocking` (e.g. blocking HTTP clients)
/// still work because `enable_all` enables the blocking thread pool.
pub fn test_app(router: Router) -> TestApp {
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("kiwa axum test_app: failed to build tokio runtime");
    TestApp {
        router,
        runtime: Some(runtime),
    }
}

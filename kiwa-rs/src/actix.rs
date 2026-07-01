//! actix-web `App` test adapter — drive an [`actix_web::App`] through the
//! kiwa fixture contract without binding a real port.
//!
//! ## Contract
//!
//! - [`test_app`] takes a factory closure (`Fn() -> App<...>`) because
//!   [`actix_web::App`] is intentionally not `Clone` (it owns the service
//!   chain). The factory is invoked once when `test_app` is called and the
//!   resulting [`TestApp`] owns a single-thread `actix_rt` runtime plus the
//!   initialised service — so the calling cargo test stays sync.
//! - [`TestApp::request`] returns a [`RequestBuilder`] that builds an
//!   [`actix_http::Request`] and drives the App through
//!   [`actix_web::test::call_service`] (no socket, no port — the App's service
//!   chain is invoked directly through `tower::Service`'s actix equivalent).
//! - The response is buffered in full and exposed through [`TestResponse`],
//!   which mirrors the axum adapter's surface (`status()` / `json()` /
//!   `body_str()` / `headers()`) 1:1 so test code can switch between adapters
//!   without rewriting assertions.
//! - Drop on [`TestApp`] tears down the actix-rt runtime so the test releases
//!   resources deterministically — same Drop discipline as
//!   [`crate::axum::test_app`] and [`crate::integration::mock_server`].
//!
//! ## v1.4 `mock_server` interop
//!
//! When the App under test hits an external service the test can wrap the
//! external call with [`crate::integration::mock_server`] and inject the
//! `base_url()` into `App::app_data(web::Data::new(...))` — the two adapters
//! compose without any shared scaffolding because both honour the same kiwa
//! fixture contract (build → exercise → Drop tears down).
//!
//! ## Why a factory closure (not the App directly)
//!
//! `actix_web::App` is constructed lazily through the service chain — it does
//! not implement `Clone`, and once an App is moved into `init_service` the
//! value is consumed. Accepting a factory matches `actix_web::HttpServer::new`,
//! lets the adapter rebuild the App in the runtime's thread context, and keeps
//! the door open for "rebuild per request" if a future feature needs it.
//!
//! ## Why not hit a real port
//!
//! `actix_web::test::call_service` runs the service chain in-process; tests
//! avoid `TIME_WAIT` flakiness, port clashes on parallel cargo test runs, and
//! the extra HTTP framing roundtrip — the same trade-off `actix-web`'s own
//! test guide recommends for integration tests against an `App`.
//!
//! ## Examples
//!
//! ```no_run
//! use actix_web::{get, App, HttpResponse, Responder};
//! use kiwa::actix::{test_app, HttpMethod};
//!
//! #[get("/health")]
//! async fn health() -> impl Responder { HttpResponse::Ok().body("ok") }
//!
//! let test = test_app(|| App::new().service(health));
//! let resp = test.request(HttpMethod::Get, "/health").send();
//! assert_eq!(resp.status(), 200);
//! assert_eq!(resp.body_str(), "ok");
//! ```

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use actix_http::body::MessageBody;
use actix_http::Request;
use actix_web::dev::{Service, ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::test::{call_service, init_service, read_body, TestRequest};
use actix_web::{App, Error};
use bytes::Bytes;

/// HTTP method on a kiwa actix-web test request.
///
/// Re-exported as a kiwa-owned enum so test code does not need to depend on
/// `actix_web::http::Method` directly. Mirrors [`crate::axum::HttpMethod`] 1:1
/// so test code can switch between adapters by changing one `use` line.
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

/// In-process actix-web test harness — owns the initialised service and a
/// private actix-rt runtime so the cargo test thread can stay synchronous.
///
/// # Lifecycle
///
/// The kiwa fixture contract is `build → exercise → stop` (mirrors v1.4
/// [`crate::integration::mock_server`]). Callers may call [`TestApp::stop`]
/// explicitly to release the runtime early; otherwise Drop tears it down at
/// end of scope. `stop` is idempotent (safe to call after Drop-time
/// shutdown), and once `stop` has run subsequent
/// [`RequestBuilder::send`] calls **panic** with a self-describing message
/// so post-Stop traffic surfaces as a loud test failure instead of silently
/// hitting the retired service — matching the v1.4 mock_server contract
/// where post-Stop traffic hits a closed port.
///
/// Build with [`test_app`]. Drop releases the runtime.
///
/// The trait bound (`Service<Request, Response = ServiceResponse<B>, Error = Error>`)
/// is intentionally re-erased onto a single concrete type so the public API
/// surface stays simple — callers do not need to name the concrete service
/// chain that their factory returns.
pub struct TestApp {
    inner: Mutex<Option<TestAppInner>>,
    /// `true` once `stop()` (or Drop-time shutdown) has retired the
    /// runtime. Read on `send()` to panic loudly on post-Stop traffic.
    ///
    /// `AtomicBool` gives interior mutability without `&mut self` on
    /// `request()`/`send()` while keeping the struct `Sync` (matches the
    /// pre-v1.6 `Mutex<Option<TestAppInner>>` surface, which was already
    /// Sync). The actual runtime teardown still runs through the outer
    /// mutex so shutdown ordering is unchanged.
    stopped: AtomicBool,
}

/// Internal handle to the actix-rt runtime + initialised service.
///
/// Split from `TestApp` so we can take ownership in `Drop` without exposing
/// the runtime type in the public surface. The `Mutex` on `TestApp.inner`
/// gives us interior-mutable single-thread access — every kiwa test owns its
/// own `TestApp`, so contention never happens; the mutex is purely a borrow
/// gateway for the Drop path.
struct TestAppInner {
    runtime: actix_web::rt::Runtime,
    /// Boxed service trait object — the concrete service type returned by
    /// `init_service` is parameterised on the App body type, so we erase it
    /// here to keep `TestApp` non-generic.
    service: Box<dyn ErasedService>,
}

/// Trait object surface for `actix_web::dev::Service`. We can't store
/// `Box<dyn Service<Request, Response = ServiceResponse<B>, Error = Error>>`
/// directly because the body type `B` would still leak through; instead the
/// adapter eagerly reads the response body into `Bytes` inside `call_once` so
/// the trait object can hide `B` entirely.
trait ErasedService {
    /// Drive a single request through the wrapped service and return the
    /// fully-buffered response. The signature is sync because the caller
    /// invokes it through `runtime.block_on`.
    fn call_once(
        &self,
        runtime: &actix_web::rt::Runtime,
        request: Request,
    ) -> (
        actix_web::http::StatusCode,
        actix_web::http::header::HeaderMap,
        Bytes,
    );
}

struct ErasedServiceImpl<S, B>
where
    S: Service<Request, Response = ServiceResponse<B>, Error = Error>,
    B: MessageBody,
{
    service: S,
}

impl<S, B> ErasedService for ErasedServiceImpl<S, B>
where
    S: Service<Request, Response = ServiceResponse<B>, Error = Error>,
    B: MessageBody + 'static,
{
    fn call_once(
        &self,
        runtime: &actix_web::rt::Runtime,
        request: Request,
    ) -> (
        actix_web::http::StatusCode,
        actix_web::http::header::HeaderMap,
        Bytes,
    ) {
        runtime.block_on(async {
            let resp: ServiceResponse<B> = call_service(&self.service, request).await;
            let status = resp.status();
            let headers = resp.headers().clone();
            let body = read_body(resp).await;
            (status, headers, body)
        })
    }
}

impl TestApp {
    /// Start building a request against the wrapped App.
    ///
    /// `path` is the request target (e.g. `/users` or `/users?limit=10`). Path
    /// must start with `/` — `actix_web::test::TestRequest::uri` only accepts
    /// absolute paths and we surface that constraint at the kiwa layer so test
    /// failures stay readable.
    pub fn request(&self, method: HttpMethod, path: impl Into<String>) -> RequestBuilder<'_> {
        RequestBuilder {
            app: self,
            method,
            path: path.into(),
            headers: Vec::new(),
            body: Bytes::new(),
        }
    }

    /// Whether [`stop`](Self::stop) (or Drop-time shutdown) has already run.
    ///
    /// Test bodies rarely need to read this — it is exposed so specs that
    /// exercise the lifecycle contract explicitly (`stop` then re-check
    /// invariants) do not have to catch the post-Stop `send` panic to
    /// observe stopped state.
    pub fn is_stopped(&self) -> bool {
        // `Acquire` pairs with the `Release` swap inside `stop()`. The
        // ordering only publishes writes that happen *before* the swap —
        // runtime teardown runs after, so observers cannot assume the
        // runtime is already gone. That is fine here because callers of
        // `is_stopped` (and the panic gate inside `send()`) never touch
        // the runtime once the flag reads true; they just refuse to enter
        // the dispatch path.
        self.stopped.load(Ordering::Acquire)
    }

    /// Retire the harness — drop the actix-rt runtime and mark the app
    /// stopped so subsequent [`RequestBuilder::send`] calls panic.
    ///
    /// Idempotent. Drop calls this too, so an explicit `stop()` followed by
    /// end-of-scope teardown is safe.
    pub fn stop(&mut self) {
        // `swap` returns the previous value — if it was already `true` the
        // runtime is already down, so we bail without touching the mutex
        // guard again.
        if self.stopped.swap(true, Ordering::Release) {
            return;
        }
        if let Ok(mut guard) = self.inner.lock() {
            // Dropping `TestAppInner` first releases the service trait object,
            // then the runtime — the runtime drop joins worker tasks so any
            // spawned futures complete deterministically before the test
            // assertion path returns.
            *guard = None;
        }
    }
}

impl Drop for TestApp {
    fn drop(&mut self) {
        // Route Drop through `stop()` so the stopped flag flips even on
        // implicit end-of-scope teardown and the runtime shutdown lives in
        // one place.
        self.stop();
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

    /// Drive the App with the built request and buffer the response.
    ///
    /// Panics with a self-describing message on invalid header names, invalid
    /// paths, or runtime-level failures so the test fails fast with a clear
    /// stack instead of bubbling `Result` chains through every assertion.
    ///
    /// Also panics if the wrapping [`TestApp`] has already been stopped
    /// (either via [`TestApp::stop`] or implicit Drop) — post-Stop traffic
    /// is a lifecycle violation and surfacing it as a panic matches the
    /// v1.4 mock_server contract where a client hitting a closed port sees
    /// a hard connection failure.
    pub fn send(self) -> TestResponse {
        let RequestBuilder {
            app,
            method,
            path,
            headers,
            body,
        } = self;

        if app.stopped.load(Ordering::Acquire) {
            panic!(
                "kiwa actix test_app: send() called after stop() — lifecycle contract requires build → exercise → stop, post-Stop traffic is a bug (request: {:?} {})",
                method, path,
            );
        }

        let mut builder = match method {
            HttpMethod::Get => TestRequest::get(),
            HttpMethod::Post => TestRequest::post(),
            HttpMethod::Put => TestRequest::put(),
            HttpMethod::Patch => TestRequest::patch(),
            HttpMethod::Delete => TestRequest::delete(),
            HttpMethod::Head => TestRequest::default().method(actix_web::http::Method::HEAD),
            HttpMethod::Options => TestRequest::default().method(actix_web::http::Method::OPTIONS),
        };
        builder = builder.uri(&path);
        for (k, v) in headers.iter() {
            builder = builder.insert_header((k.as_str(), v.as_str()));
        }
        let request = builder.set_payload(body).to_request();

        let mut guard = app
            .inner
            .lock()
            .expect("kiwa actix test_app: inner mutex poisoned");
        let inner = guard
            .as_mut()
            .expect("kiwa actix test_app: runtime dropped before send()");

        let (status, headers, body_bytes) = inner.service.call_once(&inner.runtime, request);

        // Build single-value view (last-write-wins) and multi-value view
        // (every value in wire order) in one pass so multi-value headers
        // like Set-Cookie survive alongside the pre-v1.6 shape.
        let mut headers_map: HashMap<String, String> = HashMap::with_capacity(headers.len());
        let mut headers_all: HashMap<String, Vec<String>> = HashMap::with_capacity(headers.len());
        for (k, v) in headers.iter() {
            if let Ok(val) = v.to_str() {
                let key = k.as_str().to_lowercase();
                headers_map.insert(key.clone(), val.to_string());
                headers_all.entry(key).or_default().push(val.to_string());
            }
        }

        TestResponse {
            status: status.as_u16(),
            headers: headers_map,
            headers_all,
            body: body_bytes.to_vec(),
        }
    }
}

/// Response surface returned by [`RequestBuilder::send`]. Identical shape to
/// [`crate::axum::TestResponse`] so test code can switch between adapters by
/// changing one `use` line.
///
/// Two header views coexist: [`headers`](Self::headers) is a single-value
/// `HashMap<String, String>` (last-write-wins on duplicates) kept for
/// backward compatibility with pre-v1.6 assertions,
/// [`headers_all`](Self::headers_all) is a `HashMap<String, Vec<String>>`
/// that preserves every recorded value in wire order so multi-value headers
/// (`Set-Cookie`, `WWW-Authenticate`, `Vary`, `Link`, …) can be asserted
/// verbatim.
#[derive(Clone, Debug)]
pub struct TestResponse {
    status: u16,
    headers: HashMap<String, String>,
    headers_all: HashMap<String, Vec<String>>,
    body: Vec<u8>,
}

impl TestResponse {
    /// HTTP status code as a `u16` — matches v1.4 `mock_server` ergonomics.
    pub fn status(&self) -> u16 {
        self.status
    }

    /// Response headers (lowercased keys, last-write-wins on duplicates).
    /// Retained for backward compatibility — for multi-value headers reach
    /// for [`headers_all`](Self::headers_all) or
    /// [`headers_all_values`](Self::headers_all_values).
    pub fn headers(&self) -> &HashMap<String, String> {
        &self.headers
    }

    /// Every recorded header value in wire order, keys lowercased. Backs
    /// assertions on `Set-Cookie`, `WWW-Authenticate`, `Vary`, `Link`, …
    /// where a single last-write-wins map would collapse the payload.
    pub fn headers_all(&self) -> &HashMap<String, Vec<String>> {
        &self.headers_all
    }

    /// Every recorded value for `key` (case-insensitive) in wire order.
    /// Returns `None` when the header was not observed so callers can
    /// distinguish "absent" from "present but empty".
    pub fn headers_all_values(&self, key: &str) -> Option<Vec<String>> {
        self.headers_all.get(&key.to_lowercase()).cloned()
    }

    /// Every `Set-Cookie` value on the response, in wire order. Values are
    /// returned as raw strings (unparsed) so callers pick their own cookie
    /// parser (`cookie::Cookie::parse`, `reqwest::cookie`, …) — kiwa stays
    /// dependency-light. Returns an empty `Vec` if no cookies were set so
    /// callers can `iter()` without a `None` check.
    pub fn cookies(&self) -> Vec<String> {
        self.headers_all
            .get("set-cookie")
            .cloned()
            .unwrap_or_default()
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

/// Wrap an [`actix_web::App`] factory in a [`TestApp`] for in-process test
/// invocation.
///
/// `factory` is invoked once inside the adapter's actix-rt runtime so the
/// resulting `App` is initialised in the same async context that will drive
/// requests later. The factory pattern mirrors [`actix_web::HttpServer::new`]
/// because `App` is intentionally non-`Clone` — handing in a closure is the
/// idiomatic way to hand actix-web a buildable service chain.
///
/// Each `TestApp` owns a single-thread actix-rt runtime — enough to drive a
/// `call_service` invocation at a time, and small enough that hundreds of
/// parallel cargo tests do not blow the thread budget. Handlers that off-load
/// to `actix_web::rt::task::spawn_blocking` (e.g. blocking HTTP clients) still
/// work because the runtime enables the blocking thread pool by default.
pub fn test_app<F, T, B>(factory: F) -> TestApp
where
    F: FnOnce() -> App<T> + 'static,
    T: ServiceFactory<
            ServiceRequest,
            Config = (),
            Response = ServiceResponse<B>,
            Error = Error,
            InitError = (),
        > + 'static,
    B: MessageBody + 'static,
{
    let runtime = actix_web::rt::Runtime::new()
        .expect("kiwa actix test_app: failed to build actix-rt runtime");

    let service = runtime.block_on(async move {
        let app = factory();
        init_service(app).await
    });

    let erased: Box<dyn ErasedService> = Box::new(ErasedServiceImpl { service });

    TestApp {
        inner: Mutex::new(Some(TestAppInner {
            runtime,
            service: erased,
        })),
        stopped: AtomicBool::new(false),
    }
}

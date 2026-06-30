//! Integration test helpers — hyper-based mock server + request recorder.
//!
//! This module wraps [`hyper`] behind a synchronous, kiwa-flavoured API so a
//! cargo test can spin up an HTTP endpoint, point a `reqwest` / `hyper` client
//! at it, and assert on the recorded requests — without leaking ports, without
//! a tokio runtime in the test, and without forgetting cleanup.
//!
//! ## Contract
//!
//! - [`mock_server`] returns a [`MockServer`] that owns a background tokio
//!   runtime and a single-thread server task. The runtime + task are torn down
//!   in [`Drop`], so each test releases its port deterministically.
//! - [`MockServerOpts`] is the input: optional fixed port (defaults to an
//!   OS-assigned ephemeral port), optional response timeout, and a list of
//!   [`Route`] handlers matched in registration order.
//! - [`Route`] couples (method, path) to a closure `Fn(&RecordedRequest) -> MockResponse`.
//!   Path matching is exact for v0.1 (no glob / regex); the response body is
//!   `Vec<u8>` so JSON / binary fixtures share one code path.
//! - Every incoming request is appended to a recorder regardless of whether a
//!   route matched. [`MockServer::recorded_requests`] returns a snapshot the
//!   test can iterate without touching internal locks.
//! - If no route matches the recorder still captures the request and the
//!   server replies with `404 Not Found`, so unexpected client behaviour
//!   surfaces as a test failure rather than a hang.
//!
//! ## Differentiation vs `httpmock` / `wiremock-rs`
//!
//! `kiwa::integration::mock_server` is intentionally minimal: same fixture
//! contract as the rest of kiwa (`setup_env` + Drop cleanup), exact path match,
//! sync handlers. For richer matchers (regex / JSON-path / response sequence),
//! reach for [`httpmock`] or [`wiremock`] — they coexist with kiwa fixtures.
//! See the crate README for the full comparison table.

use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use bytes::Bytes;
use http::{Method, StatusCode};
use http_body_util::{BodyExt, Full};
use hyper::body::Incoming;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use tokio::runtime::Runtime;
use tokio::sync::oneshot;
use tokio::task::JoinHandle;

/// HTTP method on a [`Route`].
///
/// Re-exported as a kiwa-owned enum so test code does not need to depend on
/// `http::Method` directly — but matches that crate's semantics 1:1.
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
    fn matches(self, m: &Method) -> bool {
        match self {
            HttpMethod::Get => m == Method::GET,
            HttpMethod::Post => m == Method::POST,
            HttpMethod::Put => m == Method::PUT,
            HttpMethod::Patch => m == Method::PATCH,
            HttpMethod::Delete => m == Method::DELETE,
            HttpMethod::Head => m == Method::HEAD,
            HttpMethod::Options => m == Method::OPTIONS,
        }
    }
}

/// Snapshot of an HTTP request received by the mock server.
///
/// The recorder stores a `Vec<RecordedRequest>` and hands the test a clone so
/// assertions cannot race with the server task.
#[derive(Clone, Debug)]
pub struct RecordedRequest {
    /// Request method (`GET` / `POST` / …).
    pub method: String,
    /// Request path including query (e.g. `/users?id=1`).
    pub path: String,
    /// Request headers (lowercased keys, last-write-wins on duplicates).
    pub headers: HashMap<String, String>,
    /// Request body bytes (empty `Vec` if the client sent no body).
    pub body: Vec<u8>,
}

impl RecordedRequest {
    /// Convenience — returns the body interpreted as UTF-8 (lossy).
    pub fn body_str(&self) -> String {
        String::from_utf8_lossy(&self.body).into_owned()
    }
}

/// Response a [`Route`] handler returns.
#[derive(Clone, Debug)]
pub struct MockResponse {
    /// HTTP status code (defaults to `200`).
    pub status: u16,
    /// Response headers.
    pub headers: HashMap<String, String>,
    /// Response body bytes.
    pub body: Vec<u8>,
}

impl Default for MockResponse {
    fn default() -> Self {
        MockResponse {
            status: 200,
            headers: HashMap::new(),
            body: Vec::new(),
        }
    }
}

impl MockResponse {
    /// Build a `200 OK` response with the given body.
    pub fn ok(body: impl Into<Vec<u8>>) -> Self {
        MockResponse {
            status: 200,
            headers: HashMap::new(),
            body: body.into(),
        }
    }

    /// Build a `200 OK` JSON response. The caller serialises the value; we
    /// merely set `Content-Type: application/json`.
    pub fn json(body: impl Into<Vec<u8>>) -> Self {
        let mut headers = HashMap::new();
        headers.insert("content-type".into(), "application/json".into());
        MockResponse {
            status: 200,
            headers,
            body: body.into(),
        }
    }

    /// Override the status code.
    pub fn with_status(mut self, status: u16) -> Self {
        self.status = status;
        self
    }

    /// Insert a response header.
    pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into().to_lowercase(), value.into());
        self
    }
}

/// Route handler — `(method, path)` mapped to a closure that produces a
/// [`MockResponse`].
///
/// Handlers are `Fn` (not `FnMut`) so they can run on the server task without
/// `&mut` aliasing; capture `Arc<Mutex<…>>` for stateful behaviour.
pub struct Route {
    method: HttpMethod,
    path: String,
    handler: Arc<dyn Fn(&RecordedRequest) -> MockResponse + Send + Sync + 'static>,
}

impl Route {
    /// Build a route from `(method, path)` and a handler closure.
    pub fn new<F>(method: HttpMethod, path: impl Into<String>, handler: F) -> Self
    where
        F: Fn(&RecordedRequest) -> MockResponse + Send + Sync + 'static,
    {
        Route {
            method,
            path: path.into(),
            handler: Arc::new(handler),
        }
    }
}

/// Options passed to [`mock_server`].
#[derive(Default)]
pub struct MockServerOpts {
    /// Optional fixed port — defaults to an OS-assigned ephemeral port so
    /// parallel tests do not clash.
    pub port: Option<u16>,
    /// Route table evaluated in registration order; first match wins.
    pub routes: Vec<Route>,
    /// Optional per-request timeout. `None` means hyper's default (no timeout).
    pub timeout: Option<Duration>,
}

impl MockServerOpts {
    /// Add a route — chainable builder helper.
    pub fn with_route(mut self, route: Route) -> Self {
        self.routes.push(route);
        self
    }

    /// Bind to a fixed port — chainable builder helper.
    pub fn with_port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }
}

/// Running mock server handle returned by [`mock_server`].
///
/// The server runs on a dedicated tokio multi-thread runtime (2 worker threads)
/// owned by the handle. The test thread stays sync — reqwest's blocking client
/// drives the wire — and dropping this handle shuts the runtime down so the
/// port is released deterministically.
pub struct MockServer {
    base_url: String,
    addr: SocketAddr,
    recorder: Arc<Mutex<Vec<RecordedRequest>>>,
    shutdown_tx: Option<oneshot::Sender<()>>,
    server_task: Option<JoinHandle<()>>,
    // Runtime must be dropped LAST — declared last so Drop order honours that.
    runtime: Option<Runtime>,
}

impl MockServer {
    /// Base URL clients should target (e.g. `http://127.0.0.1:54812`).
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// Bound socket address (host + port).
    pub fn addr(&self) -> SocketAddr {
        self.addr
    }

    /// Bound port.
    pub fn port(&self) -> u16 {
        self.addr.port()
    }

    /// Snapshot of every request the server has received so far.
    pub fn recorded_requests(&self) -> Vec<RecordedRequest> {
        self.recorder
            .lock()
            .expect("kiwa mock_server recorder mutex poisoned")
            .clone()
    }

    /// Number of requests received so far.
    pub fn request_count(&self) -> usize {
        self.recorder
            .lock()
            .expect("kiwa mock_server recorder mutex poisoned")
            .len()
    }

    /// Stop the server explicitly. Idempotent — `Drop` calls this too.
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            // Receiver may already be gone if Drop fired between these calls;
            // ignore the error in that case.
            let _ = tx.send(());
        }
        if let (Some(task), Some(rt)) = (self.server_task.take(), self.runtime.as_ref()) {
            // Wait briefly for the task to drain; if it does not exit, abort.
            let _ = rt.block_on(async move {
                tokio::select! {
                    res = task => res.map(|_| ()).map_err(|e| e.to_string()),
                    _ = tokio::time::sleep(Duration::from_millis(500)) => Err("timeout".into()),
                }
            });
        }
    }
}

impl Drop for MockServer {
    fn drop(&mut self) {
        self.stop();
        // Drop the runtime explicitly here to release the port deterministically.
        // (Otherwise the field-order Drop would still run it, but doing it here
        // keeps the contract obvious.)
        if let Some(rt) = self.runtime.take() {
            rt.shutdown_background();
        }
    }
}

/// Spin up a hyper-based mock server on a background tokio runtime.
///
/// Blocks the calling thread until the server has bound a port, then returns a
/// [`MockServer`] handle. Tests drive the server with any sync HTTP client
/// (e.g. `reqwest::blocking::Client`) pointed at [`MockServer::base_url`] and
/// inspect [`MockServer::recorded_requests`] afterwards.
///
/// # Examples
///
/// ```no_run
/// use kiwa::integration::{mock_server, HttpMethod, MockResponse, MockServerOpts, Route};
///
/// let server = mock_server(MockServerOpts::default().with_route(Route::new(
///     HttpMethod::Get,
///     "/users",
///     |_req| MockResponse::json(b"[]".to_vec()),
/// )));
/// // … point a reqwest client at server.base_url(), then …
/// assert_eq!(server.request_count(), 0);
/// ```
pub fn mock_server(opts: MockServerOpts) -> MockServer {
    // Each server owns a dedicated multi-thread runtime so the test thread
    // can stay sync (reqwest::blocking spins its own runtime) without having
    // to drive ours. Two worker threads is enough for one mock endpoint and
    // keeps memory pressure low when many tests run in parallel.
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .enable_all()
        .build()
        .expect("kiwa mock_server failed to build tokio runtime");

    let recorder: Arc<Mutex<Vec<RecordedRequest>>> = Arc::new(Mutex::new(Vec::new()));
    let routes = Arc::new(opts.routes);
    let timeout = opts.timeout;

    // Bind synchronously so callers see a ready server (port known) on return.
    let bind_addr: SocketAddr = if let Some(port) = opts.port {
        ([127, 0, 0, 1], port).into()
    } else {
        ([127, 0, 0, 1], 0).into()
    };

    let (listener, addr) = runtime
        .block_on(async move {
            let listener = TcpListener::bind(bind_addr).await?;
            let addr = listener.local_addr()?;
            Ok::<_, std::io::Error>((listener, addr))
        })
        .expect("kiwa mock_server failed to bind TCP listener");

    let base_url = format!("http://{}", addr);

    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    let recorder_for_task = Arc::clone(&recorder);
    let server_task = runtime.spawn(async move {
        loop {
            tokio::select! {
                _ = &mut shutdown_rx => break,
                accept = listener.accept() => {
                    let (stream, _peer) = match accept {
                        Ok(pair) => pair,
                        Err(_) => continue,
                    };
                    let io = TokioIo::new(stream);
                    let recorder_for_conn = Arc::clone(&recorder_for_task);
                    let routes_for_conn = Arc::clone(&routes);
                    let timeout_for_conn = timeout;
                    tokio::spawn(async move {
                        let service = service_fn(move |req: Request<Incoming>| {
                            let recorder = Arc::clone(&recorder_for_conn);
                            let routes = Arc::clone(&routes_for_conn);
                            async move {
                                let response = handle_request(req, recorder, routes, timeout_for_conn).await;
                                Ok::<_, Infallible>(response)
                            }
                        });
                        let _ = http1::Builder::new().serve_connection(io, service).await;
                    });
                }
            }
        }
    });

    MockServer {
        base_url,
        addr,
        recorder,
        shutdown_tx: Some(shutdown_tx),
        server_task: Some(server_task),
        runtime: Some(runtime),
    }
}

async fn handle_request(
    req: Request<Incoming>,
    recorder: Arc<Mutex<Vec<RecordedRequest>>>,
    routes: Arc<Vec<Route>>,
    request_timeout: Option<Duration>,
) -> Response<Full<Bytes>> {
    let method = req.method().clone();
    let path_and_query = req
        .uri()
        .path_and_query()
        .map(|pq| pq.as_str().to_string())
        .unwrap_or_else(|| req.uri().path().to_string());
    let path_only = req.uri().path().to_string();

    let mut headers = HashMap::with_capacity(req.headers().len());
    for (name, value) in req.headers().iter() {
        if let Ok(v) = value.to_str() {
            headers.insert(name.as_str().to_lowercase(), v.to_string());
        }
    }

    // Collect the request body (with optional timeout) so the recorder sees the
    // full payload before we hand it to the route handler.
    let body_bytes = if let Some(t) = request_timeout {
        match tokio::time::timeout(t, req.into_body().collect()).await {
            Ok(Ok(c)) => c.to_bytes().to_vec(),
            Ok(Err(_)) | Err(_) => Vec::new(),
        }
    } else {
        match req.into_body().collect().await {
            Ok(c) => c.to_bytes().to_vec(),
            Err(_) => Vec::new(),
        }
    };

    let recorded = RecordedRequest {
        method: method.as_str().to_string(),
        path: path_and_query,
        headers,
        body: body_bytes,
    };
    {
        let mut guard = recorder
            .lock()
            .expect("kiwa mock_server recorder mutex poisoned");
        guard.push(recorded.clone());
    }

    for route in routes.iter() {
        if route.method.matches(&method) && route.path == path_only {
            let mock_resp = (route.handler)(&recorded);
            return build_response(mock_resp);
        }
    }

    // No route matched — surface a 404 with a kiwa-flavoured body so tests
    // notice rogue requests.
    let body = format!(
        "kiwa mock_server: no route matched {} {}",
        method.as_str(),
        path_only,
    );
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .header("content-type", "text/plain; charset=utf-8")
        .body(Full::new(Bytes::from(body)))
        .expect("kiwa mock_server failed to build 404 response")
}

fn build_response(resp: MockResponse) -> Response<Full<Bytes>> {
    let status = StatusCode::from_u16(resp.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    let mut builder = Response::builder().status(status);
    for (k, v) in resp.headers.iter() {
        builder = builder.header(k, v);
    }
    builder
        .body(Full::new(Bytes::from(resp.body)))
        .unwrap_or_else(|_| {
            Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Full::new(Bytes::from_static(
                    b"kiwa mock_server response build failed",
                )))
                .expect("kiwa mock_server fallback response build failed")
        })
}

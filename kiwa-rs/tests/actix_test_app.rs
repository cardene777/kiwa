//! Integration tests for `kiwa::actix::test_app`.
//!
//! Each test builds an [`actix_web::App`] through a factory closure, wraps it
//! in a kiwa `TestApp`, and drives one or more requests through the in-process
//! `call_service` path. We cover the AC surface (method coverage, body /
//! header round-trip, JSON handlers, 404 fallback, Drop cleanup) plus the v1.4
//! `mock_server` interop case — the same App exercises a kiwa hyper mock
//! server hidden behind shared `web::Data`.

#![cfg(feature = "actix-web")]

use std::sync::{Arc, Mutex};

use actix_web::http::StatusCode;
use actix_web::web::{Bytes as WebBytes, Data, Json, Path, Query};
use actix_web::{web, App, HttpRequest, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use kiwa::actix::{test_app, HttpMethod};

// AC 1 — `kiwa::actix::test_app(factory)` binds an actix-web `App` and returns
// the TestApp handle. Smoke test: a `GET /health` handler should answer with
// the registered body and 200 status.
#[test]
fn test_app_drives_get_handler_in_process() {
    async fn health() -> impl Responder {
        HttpResponse::Ok().body("ok")
    }
    let test = test_app(|| App::new().route("/health", web::get().to(health)));

    let resp = test.request(HttpMethod::Get, "/health").send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "ok");
}

// AC 2 — HTTP method coverage. All 7 kiwa::actix::HttpMethod variants must
// reach the corresponding actix-web handler.
#[test]
fn test_app_covers_all_http_methods() {
    let test = test_app(|| {
        App::new()
            .route("/m", web::get().to(|| async { "g" }))
            .route("/m", web::post().to(|| async { "p" }))
            .route("/m", web::put().to(|| async { "u" }))
            .route("/m", web::patch().to(|| async { "ptch" }))
            .route("/m", web::delete().to(|| async { "d" }))
            .route(
                "/m",
                web::method(actix_web::http::Method::HEAD)
                    .to(|| async { HttpResponse::Ok().finish() }),
            )
            .route(
                "/m",
                web::method(actix_web::http::Method::OPTIONS).to(|| async { "o" }),
            )
    });

    assert_eq!(test.request(HttpMethod::Get, "/m").send().body_str(), "g");
    assert_eq!(test.request(HttpMethod::Post, "/m").send().body_str(), "p");
    assert_eq!(test.request(HttpMethod::Put, "/m").send().body_str(), "u");
    assert_eq!(
        test.request(HttpMethod::Patch, "/m").send().body_str(),
        "ptch"
    );
    assert_eq!(
        test.request(HttpMethod::Delete, "/m").send().body_str(),
        "d"
    );
    // HEAD returns the same status as the registered handler with an empty body.
    assert_eq!(test.request(HttpMethod::Head, "/m").send().status(), 200);
    assert_eq!(
        test.request(HttpMethod::Options, "/m").send().body_str(),
        "o"
    );
}

// AC 3 — request headers reach the handler verbatim. actix-web exposes the
// header through `HttpRequest::headers()` and the handler echoes it.
#[test]
fn test_app_request_headers_reach_handler() {
    async fn echo_tag(req: HttpRequest) -> String {
        req.headers()
            .get("x-test-tag")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("missing")
            .to_string()
    }
    let test = test_app(|| App::new().route("/echo-tag", web::get().to(echo_tag)));

    let resp = test
        .request(HttpMethod::Get, "/echo-tag")
        .header("x-test-tag", "kiwa-actix")
        .send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "kiwa-actix");
}

// AC 4 — request body round-trips through the handler.
#[test]
fn test_app_post_body_reaches_handler() {
    async fn echo_body(body: WebBytes) -> String {
        let s = String::from_utf8_lossy(&body).into_owned();
        format!("echoed: {s}")
    }
    let test = test_app(|| App::new().route("/echo", web::post().to(echo_body)));

    let resp = test
        .request(HttpMethod::Post, "/echo")
        .body("hello kiwa actix")
        .send();

    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "echoed: hello kiwa actix");
}

// AC 5 — JSON body round-trip + `TestResponse::json()` parse helper.
#[derive(Deserialize, Serialize, PartialEq, Debug)]
struct CreateUser {
    name: String,
}

#[derive(Deserialize, Serialize, PartialEq, Debug)]
struct CreatedUser {
    id: u64,
    name: String,
}

#[test]
fn test_app_json_round_trip() {
    async fn create_user(Json(req): Json<CreateUser>) -> impl Responder {
        HttpResponse::Created().json(CreatedUser {
            id: 42,
            name: req.name,
        })
    }
    let test = test_app(|| App::new().route("/users", web::post().to(create_user)));

    let body = serde_json::to_vec(&CreateUser {
        name: "sora".into(),
    })
    .expect("serialize CreateUser");
    let resp = test.request(HttpMethod::Post, "/users").json(body).send();

    assert_eq!(resp.status(), 201);
    let parsed: CreatedUser = serde_json::from_slice(resp.body()).expect("parse CreatedUser");
    assert_eq!(
        parsed,
        CreatedUser {
            id: 42,
            name: "sora".into()
        }
    );

    // `TestResponse::json()` shortcut returns a `serde_json::Value` snapshot.
    let json = resp.json().expect("response body should parse as JSON");
    assert_eq!(json["id"], 42);
    assert_eq!(json["name"], "sora");

    // content-type header should be propagated by actix-web.
    let ct = resp
        .headers()
        .get("content-type")
        .cloned()
        .expect("content-type header should be present");
    assert!(
        ct.starts_with("application/json"),
        "expected JSON content-type, got {ct}",
    );
}

// AC 6 — unknown route returns 404 (actix-web default behaviour) and the test
// adapter exposes that to assertions without panicking.
#[test]
fn test_app_unknown_path_returns_404() {
    let test = test_app(|| App::new().route("/known", web::get().to(|| async { "ok" })));

    let resp = test.request(HttpMethod::Get, "/unknown").send();
    assert_eq!(resp.status(), 404);
}

// AC 7 — query string is forwarded verbatim to actix-web extractors.
#[derive(Deserialize)]
struct ListOpts {
    limit: u32,
}

#[test]
fn test_app_query_string_reaches_handler() {
    async fn list(Query(opts): Query<ListOpts>) -> String {
        format!("limit={}", opts.limit)
    }
    let test = test_app(|| App::new().route("/users", web::get().to(list)));

    let resp = test.request(HttpMethod::Get, "/users?limit=10").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "limit=10");
}

// AC 8 — Path parameter extraction works (covers the matched-path code path).
#[test]
fn test_app_path_parameter_reaches_handler() {
    async fn show(path: Path<u64>) -> String {
        format!("user-{}", path.into_inner())
    }
    let test = test_app(|| App::new().route("/users/{id}", web::get().to(show)));

    let resp = test.request(HttpMethod::Get, "/users/7").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), "user-7");
}

// AC 9 — multiple requests share the same App state (Data<Arc<Mutex<…>>>) —
// the Drop discipline holds across multiple `send()` calls on a single
// TestApp.
#[test]
fn test_app_state_persists_across_requests() {
    #[derive(Clone)]
    struct Counter(Arc<Mutex<u64>>);

    async fn bump(state: Data<Counter>) -> String {
        let mut guard = state.0.lock().expect("counter mutex poisoned");
        *guard += 1;
        guard.to_string()
    }

    let state = Counter(Arc::new(Mutex::new(0)));
    let state_for_test = state.clone();
    let test = test_app(move || {
        App::new()
            .app_data(Data::new(state_for_test.clone()))
            .route("/bump", web::post().to(bump))
    });

    let r1 = test.request(HttpMethod::Post, "/bump").send();
    let r2 = test.request(HttpMethod::Post, "/bump").send();
    let r3 = test.request(HttpMethod::Post, "/bump").send();

    assert_eq!(r1.body_str(), "1");
    assert_eq!(r2.body_str(), "2");
    assert_eq!(r3.body_str(), "3");
    assert_eq!(*state.0.lock().expect("final counter"), 3);
}

// AC 10 — TestApp Drop releases the actix-rt runtime, and a fresh TestApp can
// be constructed afterwards without resource leak. Mirrors the
// `dropping_server_releases_port` invariant the v1.4 mock_server enforces.
#[test]
fn test_app_drop_does_not_leak_runtime() {
    {
        let test = test_app(|| App::new().route("/ping", web::get().to(|| async { "pong" })));
        let resp = test.request(HttpMethod::Get, "/ping").send();
        assert_eq!(resp.body_str(), "pong");
        // Drop runs at end of scope.
    }
    // Fresh TestApp construction succeeds — runtime budget was released.
    let test2 = test_app(|| App::new().route("/ping2", web::get().to(|| async { "pong2" })));
    let resp2 = test2.request(HttpMethod::Get, "/ping2").send();
    assert_eq!(resp2.body_str(), "pong2");
}

// AC 11 — v1.4 `kiwa::integration::mock_server` interop. The actix App
// proxies to an external HTTP endpoint, and we point that endpoint at the
// kiwa hyper mock server. Both adapters compose end-to-end through their
// shared kiwa fixture contract.
//
// We use the blocking reqwest client on a dedicated actix runtime thread so
// the async handler stays compatible with the "no blocking in async" pattern
// — the handler off-loads sync HTTP work via
// `actix_web::rt::task::spawn_blocking`.
#[cfg(feature = "integration")]
#[test]
fn test_app_composes_with_mock_server_for_external_calls() {
    use kiwa::integration::{
        mock_server, HttpMethod as MockMethod, MockResponse, MockServerOpts, Route as MockRoute,
    };

    // 1. Stand up an upstream kiwa mock server returning a JSON list.
    let upstream = mock_server(MockServerOpts::default().with_route(MockRoute::new(
        MockMethod::Get,
        "/upstream/users",
        |_req| MockResponse::json(br#"[{"id":1,"name":"sora"}]"#.to_vec()),
    )));
    let upstream_base = upstream.base_url().to_string();

    // 2. Build an actix App that proxies `/proxy/users` to the upstream base
    //    URL via `spawn_blocking` — this is how a real handler offloads sync
    //    HTTP work without blocking the runtime.
    #[derive(Clone)]
    struct Upstream(String);

    async fn proxy_users(upstream: Data<Upstream>) -> impl Responder {
        let url = format!("{}/upstream/users", upstream.0);
        let body = actix_web::rt::task::spawn_blocking(move || {
            reqwest::blocking::Client::new()
                .get(&url)
                .send()
                .expect("reqwest send")
                .text()
                .expect("body")
        })
        .await
        .expect("spawn_blocking join");
        HttpResponse::build(StatusCode::OK).body(body)
    }

    let upstream_for_test = Upstream(upstream_base);
    let test = test_app(move || {
        App::new()
            .app_data(Data::new(upstream_for_test.clone()))
            .route("/proxy/users", web::get().to(proxy_users))
    });

    let resp = test.request(HttpMethod::Get, "/proxy/users").send();
    assert_eq!(resp.status(), 200);
    assert_eq!(resp.body_str(), r#"[{"id":1,"name":"sora"}]"#);

    // 3. The upstream recorder should have captured exactly one hit, proving
    //    the two adapters composed correctly.
    let recorded = upstream.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "GET");
    assert_eq!(recorded[0].path, "/upstream/users");
}

// v1.6-1 — TestResponse.headers_all preserves every multi-value response
// header (Set-Cookie / Vary / …) so tests can assert on cookie / negotiation
// payloads that a last-write-wins single-value view would collapse. Backs
// the "全 adapter で test 追加" AC line for Rust actix-web.
#[test]
fn test_response_headers_all_preserves_multi_value_response_headers() {
    async fn set_cookies() -> HttpResponse {
        HttpResponse::Ok()
            .append_header(("Set-Cookie", "sid=abc; Path=/"))
            .append_header(("Set-Cookie", "trace=xyz; Path=/; HttpOnly"))
            .append_header(("Vary", "Accept-Encoding"))
            .append_header(("Vary", "User-Agent"))
            .body("ok")
    }
    let test = test_app(|| App::new().route("/set-cookies", web::get().to(set_cookies)));

    let resp = test.request(HttpMethod::Get, "/set-cookies").send();

    // Backward compat: headers() still exposes a single value per key.
    assert!(resp.headers().get("vary").is_some());

    // headers_all preserves every value in wire order.
    let cookies = resp
        .headers_all_values("Set-Cookie")
        .expect("set-cookie should be present");
    assert_eq!(cookies.len(), 2, "cookies: {:?}", cookies);
    assert_eq!(cookies[0], "sid=abc; Path=/");
    assert_eq!(cookies[1], "trace=xyz; Path=/; HttpOnly");

    let vary = resp
        .headers_all_values("Vary")
        .expect("vary should be present");
    assert_eq!(
        vary,
        vec!["Accept-Encoding".to_string(), "User-Agent".to_string()]
    );

    // Full snapshot via headers_all() contains the same lists.
    let all = resp.headers_all();
    assert_eq!(all.get("set-cookie").map(|v| v.len()), Some(2));
    assert_eq!(all.get("vary").map(|v| v.len()), Some(2));

    // Case-insensitive lookup on the accessor.
    assert_eq!(
        resp.headers_all_values("set-cookie").map(|v| v.len()),
        Some(2)
    );

    // Absent header returns None so callers can distinguish "absent" from
    // "present but empty".
    assert!(resp.headers_all_values("x-absent").is_none());
}

// v1.6-1 — TestResponse.cookies returns the raw Set-Cookie values in wire
// order. kiwa stays dependency-light so downstream tests pick their own
// cookie parser (`cookie::Cookie::parse`, `reqwest::cookie`, …).
#[test]
fn test_response_cookies_returns_raw_set_cookie_values() {
    async fn login() -> HttpResponse {
        HttpResponse::Ok()
            .append_header(("Set-Cookie", "sid=abc; Path=/; HttpOnly"))
            .append_header(("Set-Cookie", "trace=xyz; Path=/api; Max-Age=3600"))
            .body("ok")
    }
    let test = test_app(|| App::new().route("/login", web::get().to(login)));

    let resp = test.request(HttpMethod::Get, "/login").send();
    let cookies = resp.cookies();
    assert_eq!(cookies.len(), 2);
    assert!(cookies[0].starts_with("sid=abc"));
    assert!(cookies[0].contains("HttpOnly"));
    assert!(cookies[1].starts_with("trace=xyz"));
    assert!(cookies[1].contains("Max-Age=3600"));

    // Route with no cookies returns an empty Vec (not None).
    async fn no_cookies() -> &'static str {
        "no cookies here"
    }
    let test = test_app(|| App::new().route("/none", web::get().to(no_cookies)));
    let resp = test.request(HttpMethod::Get, "/none").send();
    assert!(resp.cookies().is_empty());
}

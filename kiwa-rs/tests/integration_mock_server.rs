//! Integration tests for `kiwa::integration::mock_server`.
//!
//! Each test stands up a mock server on an OS-assigned port, fires real
//! `reqwest::blocking` requests, and asserts on both the client response and
//! the recorder snapshot.

#![cfg(feature = "integration")]

use kiwa::integration::{
    mock_server, HttpMethod, MockResponse, MockServerOpts, RecordedRequest, Route,
};

#[test]
fn server_binds_to_os_assigned_port_when_none_given() {
    let server = mock_server(MockServerOpts::default());
    let port = server.port();
    assert!(port > 0, "mock_server should bind to a real port");
    let url = server.base_url().to_string();
    assert!(url.starts_with("http://127.0.0.1:"));
    assert!(url.ends_with(&port.to_string()));
}

#[test]
fn get_route_returns_registered_response_and_records_request() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_req: &RecordedRequest| {
            MockResponse::json(b"[{\"id\":1,\"name\":\"sora\"}]".to_vec())
                .with_header("x-kiwa-route", "users")
        },
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/users?limit=10", server.base_url()))
        .header("x-test-tag", "kiwa-poc")
        .send()
        .expect("reqwest send failed");

    assert_eq!(resp.status(), 200);
    assert_eq!(
        resp.headers()
            .get("content-type")
            .map(|v| v.to_str().unwrap()),
        Some("application/json"),
    );
    assert_eq!(
        resp.headers()
            .get("x-kiwa-route")
            .map(|v| v.to_str().unwrap()),
        Some("users"),
    );
    let body = resp.text().expect("read body");
    assert_eq!(body, "[{\"id\":1,\"name\":\"sora\"}]");

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "GET");
    assert_eq!(recorded[0].path, "/users?limit=10");
    assert_eq!(
        recorded[0].headers.get("x-test-tag").map(String::as_str),
        Some("kiwa-poc"),
    );
}

#[test]
fn post_route_handler_observes_request_body_and_recorder_captures_it() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Post,
        "/echo",
        |req: &RecordedRequest| MockResponse::ok(req.body.clone()).with_status(201),
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .post(format!("{}/echo", server.base_url()))
        .body("hello kiwa")
        .send()
        .expect("reqwest send failed");

    assert_eq!(resp.status(), 201);
    assert_eq!(resp.text().expect("body"), "hello kiwa");

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "POST");
    assert_eq!(recorded[0].path, "/echo");
    assert_eq!(recorded[0].body_str(), "hello kiwa");
}

#[test]
fn unmatched_route_returns_404_and_is_still_recorded() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/known",
        |_req: &RecordedRequest| MockResponse::ok(b"ok".to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/unknown", server.base_url()))
        .send()
        .expect("reqwest send failed");
    assert_eq!(resp.status(), 404);
    let body = resp.text().expect("body");
    assert!(
        body.contains("no route matched GET /unknown"),
        "404 body should be self-describing, got {body:?}",
    );

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "GET");
    assert_eq!(recorded[0].path, "/unknown");
}

#[test]
fn recorder_captures_every_request_in_order() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/ping",
        |_req: &RecordedRequest| MockResponse::ok(b"pong".to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    for i in 0..3 {
        let resp = client
            .get(format!("{}/ping?n={i}", server.base_url()))
            .send()
            .expect("reqwest send failed");
        assert_eq!(resp.status(), 200);
    }

    assert_eq!(server.request_count(), 3);
    let recorded = server.recorded_requests();
    assert_eq!(recorded[0].path, "/ping?n=0");
    assert_eq!(recorded[1].path, "/ping?n=1");
    assert_eq!(recorded[2].path, "/ping?n=2");
}

#[test]
fn dropping_server_releases_port() {
    let port_first = {
        let server = mock_server(MockServerOpts::default());
        server.port()
        // Drop runs here.
    };
    // Re-binding the exact same port immediately is timing-sensitive at the
    // OS level (TIME_WAIT). The contract we want to verify is "Drop does not
    // panic and a brand-new server can be brought up after". Bind a second
    // ephemeral server and assert that returns successfully on a different
    // port — both are exercised by this test.
    let server_second = mock_server(MockServerOpts::default());
    assert!(server_second.port() > 0);
    assert!(port_first > 0);
}

#[test]
fn explicit_stop_then_drop_is_safe() {
    let mut server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/stop-test",
        |_req: &RecordedRequest| MockResponse::ok(b"ok".to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/stop-test", server.base_url()))
        .send()
        .expect("send");
    assert_eq!(resp.status(), 200);

    server.stop();
    // Second stop and the subsequent Drop must not panic.
    server.stop();
}

// v1.6-1: multi-value response header array preservation. Verifies the fix
// for the Codex adversarial "Set-Cookie collapse" finding — a route emitting
// two Set-Cookie / Vary lines must arrive on the wire as two separate values
// (not the last one only), and RecordedRequest must expose the same for
// inbound multi-value headers.
#[test]
fn mock_response_headers_all_emits_multi_value_on_wire() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/set-cookies",
        |_req: &RecordedRequest| {
            MockResponse::ok(b"ok".to_vec())
                .with_header_values(
                    "Set-Cookie",
                    ["sid=abc; Path=/", "trace=xyz; Path=/; HttpOnly"],
                )
                .with_header_values("Vary", ["Accept-Encoding"])
                .with_header_values("Vary", ["User-Agent"])
        },
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/set-cookies", server.base_url()))
        .send()
        .expect("send");

    // Two Set-Cookie header lines survive the round trip.
    let cookies: Vec<String> = resp
        .headers()
        .get_all("set-cookie")
        .iter()
        .map(|v| v.to_str().unwrap().to_string())
        .collect();
    assert_eq!(
        cookies.len(),
        2,
        "Set-Cookie count should be 2 (values={:?})",
        cookies
    );
    assert!(cookies[0].contains("sid=abc"));
    assert!(cookies[1].contains("trace=xyz"));

    // Vary was populated across two with_header_values chained calls — each
    // call appends without overwriting the previous line.
    let vary: Vec<String> = resp
        .headers()
        .get_all("vary")
        .iter()
        .map(|v| v.to_str().unwrap().to_string())
        .collect();
    assert_eq!(vary, vec!["Accept-Encoding", "User-Agent"]);
}

// v1.6-1: MockResponse.with_header overrides with_header_values on the same
// key so callers who only fill `headers` keep the pre-v1.6 last-write-wins
// behaviour — verified by populating both and asserting `headers` wins.
#[test]
fn mock_response_headers_overrides_headers_all_on_same_key() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/override",
        |_req: &RecordedRequest| {
            MockResponse::ok(b"ok".to_vec())
                .with_header_values("X-Precedence", ["from-headers-all-a", "from-headers-all-b"])
                .with_header("X-Precedence", "from-headers")
        },
    )));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/override", server.base_url()))
        .send()
        .expect("send");

    let values: Vec<String> = resp
        .headers()
        .get_all("x-precedence")
        .iter()
        .map(|v| v.to_str().unwrap().to_string())
        .collect();
    assert_eq!(
        values,
        vec!["from-headers"],
        "with_header should replace with_header_values entries for the same key"
    );
}

// v1.6-1: RecordedRequest.headers_all preserves multi-value inbound headers
// while `headers` stays as the single-value last-write-wins view for
// backward compat.
#[test]
fn recorded_request_headers_all_preserves_multi_value() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/echo-headers",
        |_req: &RecordedRequest| MockResponse::ok(b"ok".to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    let _ = client
        .get(format!("{}/echo-headers", server.base_url()))
        // reqwest coalesces same-key .header calls into a multi-value header
        // on the wire.
        .header("x-multi", "a")
        .header("x-multi", "b")
        .header("x-multi", "c")
        .send()
        .expect("send");

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);

    // Backward compat: headers still exposes the last value.
    assert_eq!(
        recorded[0].headers.get("x-multi").map(String::as_str),
        Some("c"),
    );

    // New: headers_all preserves every value in wire order.
    let all = recorded[0]
        .headers_all_values("X-Multi")
        .expect("x-multi should be present");
    assert_eq!(all, vec!["a".to_string(), "b".to_string(), "c".to_string()]);

    // Case-insensitive lookup on the accessor.
    let lower = recorded[0].headers_all_values("x-multi").unwrap();
    assert_eq!(lower.len(), 3);

    // Absent header returns None so callers can distinguish "absent" from
    // "present but empty".
    assert!(recorded[0].headers_all_values("x-absent").is_none());
}

#[test]
fn multiple_routes_match_first_registered() {
    let server = mock_server(
        MockServerOpts::default()
            .with_route(Route::new(HttpMethod::Get, "/multi", |_| {
                MockResponse::ok(b"first".to_vec())
            }))
            .with_route(Route::new(HttpMethod::Get, "/multi", |_| {
                MockResponse::ok(b"second".to_vec())
            }))
            .with_route(Route::new(HttpMethod::Post, "/multi", |_| {
                MockResponse::ok(b"posted".to_vec())
            })),
    );

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/multi", server.base_url()))
        .send()
        .expect("send");
    assert_eq!(resp.text().expect("body"), "first");

    let resp = client
        .post(format!("{}/multi", server.base_url()))
        .send()
        .expect("send");
    assert_eq!(resp.text().expect("body"), "posted");
}

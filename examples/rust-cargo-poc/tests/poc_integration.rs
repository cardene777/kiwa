//! PoC — `kiwa::integration::mock_server` driving a real `reqwest` client
//! through the `rust_cargo_poc::UsersClient` domain wrapper.
//!
//! Each test stands up a fresh mock server, points the domain client at the
//! server's `base_url()`, and asserts on both the parsed response and the
//! recorded requests. This is the integration-test analogue of `tests/poc.rs`
//! (unit + assert macros).

use kiwa::integration::{
    mock_server, HttpMethod, MockResponse, MockServerOpts, RecordedRequest, Route,
};
use rust_cargo_poc::UsersClient;
use serde_json::json;

#[test]
fn list_users_decodes_mocked_json_array() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_req: &RecordedRequest| {
            MockResponse::json(
                serde_json::to_vec(&json!([
                    { "id": 1, "name": "sora" },
                    { "id": 2, "name": "haru" }
                ]))
                .expect("encode response"),
            )
        },
    )));

    let client = UsersClient::new(server.base_url());
    let users = client.list_users().expect("list_users");
    assert_eq!(users.len(), 2);
    assert_eq!(users[0].id, 1);
    assert_eq!(users[0].name, "sora");
    assert_eq!(users[1].id, 2);
    assert_eq!(users[1].name, "haru");

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "GET");
    assert_eq!(recorded[0].path, "/users");
}

#[test]
fn create_user_sends_json_body_and_parses_201_response() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Post,
        "/users",
        |req: &RecordedRequest| {
            // Echo the posted name back with a fake server-assigned id so the
            // domain client has a realistic 201 response shape to parse.
            let parsed: serde_json::Value = serde_json::from_slice(&req.body).unwrap_or(json!({}));
            let name = parsed
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");
            MockResponse::json(
                serde_json::to_vec(&json!({ "id": 42, "name": name })).expect("encode response"),
            )
            .with_status(201)
        },
    )));

    let client = UsersClient::new(server.base_url());
    let id = client.create_user("hina").expect("create_user");
    assert_eq!(id, 42);

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "POST");
    assert_eq!(recorded[0].path, "/users");
    assert_eq!(
        recorded[0].headers.get("content-type").map(String::as_str),
        Some("application/json"),
    );
    let body: serde_json::Value =
        serde_json::from_slice(&recorded[0].body).expect("recorded body json");
    assert_eq!(body, json!({ "name": "hina" }));
}

#[test]
fn list_users_surfaces_non_2xx_as_error() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_req: &RecordedRequest| MockResponse::default().with_status(500),
    )));

    let client = UsersClient::new(server.base_url());
    let err = client
        .list_users()
        .expect_err("list_users should error on 5xx");
    assert!(
        err.contains("non-2xx"),
        "error message should mention non-2xx, got {err:?}",
    );
    // Even the failing request is captured.
    assert_eq!(server.request_count(), 1);
}

#[test]
fn each_test_isolates_its_own_recorder() {
    let server_a = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_| MockResponse::json(b"[]".to_vec()),
    )));
    let server_b = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_| MockResponse::json(b"[]".to_vec()),
    )));

    let client_a = UsersClient::new(server_a.base_url());
    let client_b = UsersClient::new(server_b.base_url());
    let _ = client_a.list_users().expect("a list_users");
    let _ = client_b.list_users().expect("b list_users");

    assert_eq!(server_a.request_count(), 1);
    assert_eq!(server_b.request_count(), 1);
    assert_ne!(server_a.port(), server_b.port());
}

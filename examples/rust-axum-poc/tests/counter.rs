//! End-to-end PoC for the kiwa-test-rs v0.2 axum adapter.
//!
//! Exercises the Counter API defined in `src/lib.rs` through
//! `kiwa::axum::test_app` — no real port bind, no manual runtime, no leaked
//! state across cases (TestApp Drop tears down the per-test tokio runtime).

use kiwa::axum::{test_app, HttpMethod};
use rust_axum_poc::{router, AddRequest, CountResponse, CounterState};

// PoC 1 — `GET /count` returns 0 from a fresh CounterState.
#[test]
fn get_count_starts_at_zero() {
    let state = CounterState::default();
    let test = test_app(router(state));

    let resp = test.request(HttpMethod::Get, "/count").send();

    assert_eq!(resp.status(), 200);
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse CountResponse");
    assert_eq!(body, CountResponse { value: 0 });
}

// PoC 2 — `POST /increment` bumps the counter and returns the new value.
#[test]
fn increment_bumps_counter() {
    let state = CounterState::default();
    let test = test_app(router(state.clone()));

    let resp = test.request(HttpMethod::Post, "/increment").send();

    assert_eq!(resp.status(), 200);
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse CountResponse");
    assert_eq!(body, CountResponse { value: 1 });
    assert_eq!(*state.0.lock().expect("counter snapshot"), 1);
}

// PoC 3 — multiple increments accumulate across requests on the same TestApp.
#[test]
fn multiple_increments_accumulate() {
    let state = CounterState::default();
    let test = test_app(router(state.clone()));

    for _ in 0..5 {
        let resp = test.request(HttpMethod::Post, "/increment").send();
        assert_eq!(resp.status(), 200);
    }

    let resp = test.request(HttpMethod::Get, "/count").send();
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse CountResponse");
    assert_eq!(body, CountResponse { value: 5 });
}

// PoC 4 — `POST /add` accepts a JSON body and adds the delta.
#[test]
fn add_accepts_json_body() {
    let state = CounterState::default();
    let test = test_app(router(state));

    let payload = serde_json::to_vec(&AddRequest { delta: 42 }).expect("serialize AddRequest");
    let resp = test
        .request(HttpMethod::Post, "/add")
        .json(payload)
        .send();

    assert_eq!(resp.status(), 200);
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse CountResponse");
    assert_eq!(body, CountResponse { value: 42 });
    assert_eq!(
        resp.headers().get("content-type").map(String::as_str),
        Some("application/json"),
    );
}

// PoC 5 — `POST /reset` clears the counter back to 0.
#[test]
fn reset_clears_counter() {
    let state = CounterState::default();
    let test = test_app(router(state.clone()));

    // Prime: bump 3 times.
    for _ in 0..3 {
        test.request(HttpMethod::Post, "/increment").send();
    }
    assert_eq!(*state.0.lock().expect("primed"), 3);

    let resp = test.request(HttpMethod::Post, "/reset").send();

    assert_eq!(resp.status(), 200);
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse CountResponse");
    assert_eq!(body, CountResponse { value: 0 });
    assert_eq!(*state.0.lock().expect("after reset"), 0);
}

// PoC 6 — unknown route surfaces axum's default 404 response through the
// kiwa adapter (asserted without panic). Mirrors the v1.4 mock_server
// behaviour where unmatched routes still complete the response cycle.
#[test]
fn unknown_route_returns_404() {
    let state = CounterState::default();
    let test = test_app(router(state));

    let resp = test.request(HttpMethod::Get, "/does-not-exist").send();
    assert_eq!(resp.status(), 404);
}

// PoC 7 — sequential increment + add + reset workflow proves the Drop
// discipline on TestApp does not interfere with state Arc reuse across
// requests.
#[test]
fn workflow_increment_add_reset() {
    let state = CounterState::default();
    let test = test_app(router(state.clone()));

    test.request(HttpMethod::Post, "/increment").send();
    test.request(HttpMethod::Post, "/increment").send();

    let payload = serde_json::to_vec(&AddRequest { delta: 10 }).expect("serialize");
    test.request(HttpMethod::Post, "/add").json(payload).send();

    let resp = test.request(HttpMethod::Get, "/count").send();
    let body: CountResponse = serde_json::from_slice(resp.body()).expect("parse");
    assert_eq!(body, CountResponse { value: 12 });

    test.request(HttpMethod::Post, "/reset").send();
    assert_eq!(*state.0.lock().expect("after reset"), 0);
}

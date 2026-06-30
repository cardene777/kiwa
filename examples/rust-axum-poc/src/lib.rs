//! Toy Counter API used by the kiwa-test-rs v0.2 axum PoC tests.
//!
//! The domain is intentionally minimal — a single shared `u64` counter with
//! 4 routes (`GET /count`, `POST /increment`, `POST /reset`, `POST /add`) —
//! so the value lives in `tests/counter.rs`, which shows how
//! `kiwa::axum::test_app` drives the Router in-process without a real port
//! bind.

use std::sync::{Arc, Mutex};

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

/// Shared counter state — wrapped in `Arc<Mutex<…>>` so the Router can clone
/// the handle into every request and the tests can inspect the final value.
#[derive(Clone, Default)]
pub struct CounterState(pub Arc<Mutex<u64>>);

/// JSON response shape for `GET /count` and the mutate endpoints.
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct CountResponse {
    /// Current counter value after the operation completed.
    pub value: u64,
}

/// JSON request shape for `POST /add`.
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct AddRequest {
    /// Amount to add to the counter (can be 0).
    pub delta: u64,
}

async fn get_count(State(state): State<CounterState>) -> impl IntoResponse {
    let guard = state.0.lock().expect("counter mutex poisoned");
    (StatusCode::OK, Json(CountResponse { value: *guard }))
}

async fn increment(State(state): State<CounterState>) -> impl IntoResponse {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard += 1;
    (StatusCode::OK, Json(CountResponse { value: *guard }))
}

async fn reset(State(state): State<CounterState>) -> impl IntoResponse {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard = 0;
    (StatusCode::OK, Json(CountResponse { value: 0 }))
}

async fn add(
    State(state): State<CounterState>,
    Json(req): Json<AddRequest>,
) -> impl IntoResponse {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard += req.delta;
    (StatusCode::OK, Json(CountResponse { value: *guard }))
}

/// Build the Counter API Router. Tests call this and pass the result to
/// `kiwa::axum::test_app` for in-process invocation.
pub fn router(state: CounterState) -> Router {
    Router::new()
        .route("/count", get(get_count))
        .route("/increment", post(increment))
        .route("/reset", post(reset))
        .route("/add", post(add))
        .with_state(state)
}

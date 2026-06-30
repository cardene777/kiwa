//! Toy Counter API used by the kiwa-test-rs v0.2 actix-web PoC tests.
//!
//! The domain is intentionally minimal — a single shared `u64` counter with
//! 4 routes (`GET /count`, `POST /increment`, `POST /reset`, `POST /add`) —
//! so the value lives in `tests/counter.rs`, which shows how
//! `kiwa::actix::test_app` drives the App in-process without a real port
//! bind. Mirrors `rust-axum-poc` 1:1 so the test contract is comparable side
//! by side.

use std::sync::{Arc, Mutex};

use actix_web::web::{Data, Json};
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

/// Shared counter state — wrapped in `Arc<Mutex<…>>` so the App can clone the
/// handle into every request through `web::Data` and the tests can inspect
/// the final value.
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

async fn get_count(state: Data<CounterState>) -> impl Responder {
    let guard = state.0.lock().expect("counter mutex poisoned");
    HttpResponse::Ok().json(CountResponse { value: *guard })
}

async fn increment(state: Data<CounterState>) -> impl Responder {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard += 1;
    HttpResponse::Ok().json(CountResponse { value: *guard })
}

async fn reset(state: Data<CounterState>) -> impl Responder {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard = 0;
    HttpResponse::Ok().json(CountResponse { value: 0 })
}

async fn add(state: Data<CounterState>, req: Json<AddRequest>) -> impl Responder {
    let mut guard = state.0.lock().expect("counter mutex poisoned");
    *guard += req.delta;
    HttpResponse::Ok().json(CountResponse { value: *guard })
}

/// Configure the Counter API routes on an existing actix-web `App`. Tests
/// build an `App::new().app_data(...).configure(configure)` chain and hand
/// the result to `kiwa::actix::test_app` for in-process invocation. We expose
/// `configure` (instead of returning an `App`) because actix-web's `App`
/// generic type parameter changes with every route added, so the factory
/// closure stays simpler when each test owns the App construction.
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/count", web::get().to(get_count))
        .route("/increment", web::post().to(increment))
        .route("/reset", web::post().to(reset))
        .route("/add", web::post().to(add));
}

//! Realistic mini-API used by the kiwa-test-rs v0.4 tower-http PoC tests.
//!
//! The PoC intentionally chooses a *production-shaped* API surface (not a
//! toy counter) so the composed tower-http chain is testable end-to-end:
//!
//! - `GET  /profile/:id` — JSON `Profile` lookup (auth-gated).
//! - `POST /profile/:id/bio` — JSON body write, echoes the resulting Profile
//!   (auth-gated, hits the body-limit layer).
//! - `GET  /public/manifest` — large JSON payload for CompressionLayer to
//!   encode (no auth).
//! - `GET  /public/slow` — deliberately slow handler for TimeoutLayer.
//! - `GET  /public/health` — cheap liveness probe (no auth, no timeout).
//!
//! The Router is composed with a full six-layer chain matching the
//! `kiwa::tower_http` helper coverage:
//!
//! 1. `CorsLayer` — `/api/*` origin policy.
//! 2. `TraceLayer` — request tracing (no assertion here, but the middleware
//!    is wired to prove it composes cleanly with the others).
//! 3. `CompressionLayer` — gzip when the client signals it.
//! 4. `ValidateRequestHeaderLayer::bearer` — auth on `/profile/*`.
//! 5. `RequestBodyLimitLayer` — 1 KiB body ceiling on writes.
//! 6. `TimeoutLayer` — 100 ms hard timeout on the `slow` handler.
//!
//! Split entry points let the tests wire the chain a la carte:
//! [`router`] returns the plain Router (no middleware), [`profile_chain`]
//! returns a `ServiceBuilder` layer stack pre-configured with the six
//! middleware bundle above. The PoC tests reach for whichever combination
//! matches the middleware they are asserting on.

use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::extract::{Path, State};
use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower::layer::util::{Identity, Stack};
use tower::ServiceBuilder;
use tower_http::classify::{ServerErrorsAsFailures, SharedClassifier};
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;
use tower_http::validate_request::ValidateRequestHeaderLayer;

/// Concrete `ServiceBuilder` layer stack returned by [`profile_chain`].
///
/// Extracted as a type alias so the public signature stays scannable and
/// clippy stops flagging the fully nested `Stack<...>` chain as a
/// `type_complexity` violation. The stack order (innermost → outermost)
/// matches the `ServiceBuilder::layer(...)` call sequence in the
/// [`profile_chain`] body — `SetResponseHeaderLayer` runs first, then
/// `TraceLayer`, then `CompressionLayer`, then `RequestBodyLimitLayer`,
/// then `TimeoutLayer` as the outermost tower-http layer.
pub type ProfileChain = ServiceBuilder<
    Stack<
        TimeoutLayer,
        Stack<
            RequestBodyLimitLayer,
            Stack<
                CompressionLayer,
                Stack<
                    TraceLayer<SharedClassifier<ServerErrorsAsFailures>>,
                    Stack<SetResponseHeaderLayer<HeaderValue>, Identity>,
                >,
            >,
        >,
    >,
>;

/// Bearer token every `/profile/*` request must present.
///
/// Kept as a `pub const` so the PoC tests can build the matching
/// `Authorization` header through `kiwa::tower_http::auth::with_bearer`
/// without duplicating the literal in test code.
pub const PROFILE_TOKEN: &str = "kiwa-poc-token";

/// Shared profile store — a single Mutex-guarded map so the Router can
/// clone the handle into every request and tests can seed data before
/// exercising the API.
#[derive(Clone, Default)]
pub struct ProfileStore {
    inner: Arc<Mutex<Vec<Profile>>>,
}

impl ProfileStore {
    /// Seed the store with `count` profiles. Ids run 1..=count, bios are
    /// generated deterministically so compression tests can assert on the
    /// exact payload shape.
    pub fn seeded(count: u32) -> Self {
        let mut store = Vec::with_capacity(count as usize);
        for id in 1..=count {
            store.push(Profile {
                id,
                name: format!("kiwa-user-{id}"),
                bio: format!("Bio for user {id} — placeholder text for PoC tests."),
            });
        }
        Self {
            inner: Arc::new(Mutex::new(store)),
        }
    }
}

/// JSON response shape for `GET /profile/:id` and the write endpoints.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    /// Deterministic profile id.
    pub id: u32,
    /// Display name.
    pub name: String,
    /// Free-form biography written by `POST /profile/:id/bio`.
    pub bio: String,
}

/// JSON request shape for `POST /profile/:id/bio`.
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct BioUpdate {
    /// New bio text.
    pub bio: String,
}

/// JSON response shape for `GET /public/manifest`.
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct Manifest {
    /// PoC service version.
    pub version: String,
    /// Enumerated feature strings — inflated so CompressionLayer has
    /// something meaningful to encode.
    pub features: Vec<String>,
}

async fn get_profile(
    Path(id): Path<u32>,
    State(state): State<ProfileStore>,
) -> impl IntoResponse {
    let store = state.inner.lock().expect("profile store poisoned");
    match store.iter().find(|p| p.id == id).cloned() {
        Some(profile) => (StatusCode::OK, Json(profile)).into_response(),
        None => (StatusCode::NOT_FOUND, format!("no profile with id {id}")).into_response(),
    }
}

async fn update_bio(
    Path(id): Path<u32>,
    State(state): State<ProfileStore>,
    Json(update): Json<BioUpdate>,
) -> impl IntoResponse {
    let mut store = state.inner.lock().expect("profile store poisoned");
    match store.iter_mut().find(|p| p.id == id) {
        Some(profile) => {
            profile.bio = update.bio;
            (StatusCode::OK, Json(profile.clone())).into_response()
        }
        None => (StatusCode::NOT_FOUND, format!("no profile with id {id}")).into_response(),
    }
}

async fn get_manifest() -> impl IntoResponse {
    // Payload deliberately padded past the ~1 KiB "worth compressing" mark
    // so CompressionLayer's default min-size threshold is comfortably
    // cleared without a special-case Content-Encoding negotiation.
    let features: Vec<String> = (0..64)
        .map(|i| format!("feature-{i:03}-lorem-ipsum-dolor-sit-amet"))
        .collect();
    let body = Manifest {
        version: "0.1.0-poc".into(),
        features,
    };
    (StatusCode::OK, Json(body))
}

async fn slow_handler() -> impl IntoResponse {
    // 300 ms is long enough that a 100 ms TimeoutLayer fires reliably even
    // on a loaded macOS runner; `tokio::time::sleep` is the right primitive
    // because TimeoutLayer relies on tokio's timer wheel for the budget.
    tokio::time::sleep(Duration::from_millis(300)).await;
    (StatusCode::OK, "slow-but-done")
}

async fn health() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

/// Build the plain PoC Router (no middleware). Tests that want to assert
/// against an unlayered baseline call this directly; tests that need the
/// production chain call [`chained_router`] instead.
pub fn router(state: ProfileStore) -> Router {
    Router::new()
        .route("/profile/{id}", get(get_profile))
        .route("/profile/{id}/bio", post(update_bio))
        .route("/public/manifest", get(get_manifest))
        .route("/public/slow", get(slow_handler))
        .route("/public/health", get(health))
        .with_state(state)
}

/// Build the "inner" tower-http chain used across the PoC integration
/// tests — the five middleware layers whose bodies compose cleanly under
/// tower's default `Service` bounds. Kept as a standalone helper so the
/// middleware composition stays a SSOT — the tests never re-invent the
/// order and every layer arrives with the exact configuration the PoC
/// advertises in its module docs.
///
/// Layer order (outermost first, as tower-http executes it):
///
/// 1. `SetResponseHeaderLayer` — stamps `x-kiwa-chain: engaged` on every
///    response so tests can prove the chain fired end-to-end.
/// 2. `TraceLayer::new_for_http()` — subscriber-agnostic wiring.
/// 3. `CompressionLayer::new()` — default encoders (gzip / br / deflate).
/// 4. `RequestBodyLimitLayer::new(1024)` — 1 KiB write ceiling.
/// 5. `TimeoutLayer::with_status_code(408, 100ms)` — hard budget.
///
/// `CorsLayer` is applied separately on the Router in [`chained_router`]
/// because its `Service` bound requires `ResBody: Default`, which the
/// `CompressionBody` output of `CompressionLayer` does not implement.
/// Attaching CORS at the Router level (via `Router::layer` after the chain)
/// keeps the type system happy while preserving the "CORS is the outermost
/// wire-level concern" HTTP semantic — the CorsLayer still sees the same
/// pre-compression body shape axum starts with.
///
/// Auth is applied downstream on the `/profile/*` sub-router (see
/// [`chained_router`]) so `/public/*` routes can stay reachable without a
/// bearer token — matching how real APIs scope auth to sensitive routes.
pub fn profile_chain() -> ProfileChain {
    ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-kiwa-chain"),
            HeaderValue::from_static("engaged"),
        ))
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(RequestBodyLimitLayer::new(1024))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_millis(100),
        ))
}

/// Build the permissive `CorsLayer` the PoC pairs with [`profile_chain`].
///
/// Real deployments would restrict origin / methods; the PoC keeps it wide
/// open so `assert_preflight_ok` sees `*` verbatim and the tests read one
/// intent-revealing constant instead of an inline builder chain.
pub fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
}

/// Build the PoC Router with the full production chain applied — the five
/// tower-http layers from [`profile_chain`], a `ValidateRequestHeaderLayer::bearer`
/// scoped to `/profile/*`, and a permissive [`cors_layer`] as the outermost
/// HTTP wire-level concern (public routes stay open).
///
/// This is what an integration test that wants "the real API" calls: the
/// composed Router carries every middleware effect the PoC advertises,
/// wired the way a small production service would wire it.
///
/// The layer order matters — CORS is applied last so it sits *outside* the
/// compression stack (its `Service` bound requires `ResBody: Default`,
/// which the pre-compression axum `Body` satisfies).
#[allow(deprecated)] // ValidateRequestHeaderLayer::bearer stays the closest
                     // tower-http idiom for the PoC — the deprecation note
                     // ("too basic to be useful in real applications")
                     // acknowledges the shortcut is a demo helper. Our PoC
                     // is a demo helper.
pub fn chained_router(state: ProfileStore) -> Router {
    // Scope auth to the sensitive sub-router — `/public/*` stays reachable
    // without a token, mirroring the "auth-gated resource" pattern.
    let profile_routes = Router::new()
        .route("/profile/{id}", get(get_profile))
        .route("/profile/{id}/bio", post(update_bio))
        .layer(ValidateRequestHeaderLayer::bearer(PROFILE_TOKEN));

    let public_routes = Router::new()
        .route("/public/manifest", get(get_manifest))
        .route("/public/slow", get(slow_handler))
        .route("/public/health", get(health));

    profile_routes
        .merge(public_routes)
        .with_state(state)
        .layer(profile_chain())
        .layer(cors_layer())
}

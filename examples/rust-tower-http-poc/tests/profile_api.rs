//! End-to-end PoC for the kiwa-test-rs v0.4 tower-http adapter.
//!
//! Exercises the profile-api Router defined in `src/lib.rs` through
//! `kiwa::tower_http::test_chain` + the six middleware-specific helpers
//! (`test_cors` / `test_compression` / `test_timeout` / `with_bearer` /
//! `with_basic` / `exhaust`). Each test targets one middleware surface so
//! the PoC doubles as an executable "how do I test X with kiwa?" guide.
//!
//! v1.7-3 (Issue #624) — 10 tests covering the full chain contract:
//!
//! 1. `chained_router_happy_path` — auth + chain header stamp, proves the
//!    whole chain wires.
//! 2. `cors_preflight_answers_star` — CorsLayer end-to-end via
//!    `kiwa::tower_http::cors`.
//! 3. `compression_manifest_round_trip` — CompressionLayer real payload
//!    gzip round-trip.
//! 4. `timeout_slow_handler_short_circuits` — TimeoutLayer 100 ms budget
//!    on the seeded slow handler.
//! 5. `auth_missing_token_returns_401` — ValidateRequestHeader gate rejects
//!    unauthenticated `/profile/*` requests.
//! 6. `auth_correct_bearer_returns_profile` — Positive auth path via
//!    `kiwa::tower_http::auth::with_bearer`.
//! 7. `body_limit_rejects_oversize_bio` — RequestBodyLimitLayer 1 KiB
//!    ceiling via hand-rolled loop mirroring the `exhaust` driver contract.
//! 8. `public_routes_bypass_auth` — `/public/*` reachable without a token,
//!    chain header still stamped.
//! 9. `exhaust_returns_last_success_when_layer_never_throttles` — proves
//!    the `exhaust` driver composes with the full production Router.
//! 10. `with_basic_produces_rfc7617_credential` — Basic auth header builder
//!     contract with base64 round-trip.

use std::io::Read as _;

use axum::http::StatusCode;

use base64::Engine as _;
use flate2::read::GzDecoder;

use kiwa::axum::HttpMethod;
use kiwa::tower_http::auth::{with_basic, with_bearer};
use kiwa::tower_http::compression::{assert_compressed, test_compression};
use kiwa::tower_http::cors::{assert_preflight_ok, test_cors};
use kiwa::tower_http::rate_limit::exhaust;
use kiwa::tower_http::test_chain;
use kiwa::tower_http::timeout::assert_timed_out;
use tower::ServiceBuilder;
use tower_http::compression::CompressionLayer;

use rust_tower_http_poc::{
    chained_router, cors_layer, router, BioUpdate, Manifest, Profile, ProfileStore, PROFILE_TOKEN,
};

// PoC 1 — the full production chain wires correctly. Authenticated GET
// returns the seeded profile, the SetResponseHeaderLayer stamp proves the
// chain executed, and CorsLayer stamps `access-control-allow-origin` on
// the actual response.
#[test]
fn chained_router_happy_path() {
    let state = ProfileStore::seeded(3);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let (auth_k, auth_v) = with_bearer(PROFILE_TOKEN);
    let resp = test
        .request(HttpMethod::Get, "/profile/1")
        .header(auth_k, auth_v)
        .header("origin", "https://kiwa.dev")
        .send();

    assert_eq!(resp.status(), 200, "authenticated GET should return 200");
    let body: Profile = serde_json::from_slice(resp.body()).expect("parse Profile");
    assert_eq!(
        body,
        Profile {
            id: 1,
            name: "kiwa-user-1".into(),
            bio: "Bio for user 1 — placeholder text for PoC tests.".into(),
        }
    );

    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
        "SetResponseHeaderLayer should stamp `x-kiwa-chain: engaged` on every response",
    );
    assert_eq!(
        resp.headers()
            .get("access-control-allow-origin")
            .map(String::as_str),
        Some("*"),
        "CorsLayer should stamp `access-control-allow-origin: *` on actual requests",
    );
}

// PoC 2 — CORS preflight answered by CorsLayer through the kiwa helper.
// Uses `test_cors` directly against a bare Router so the assertion is
// scoped to the cors surface (isolating it from the rest of the chain).
#[test]
fn cors_preflight_answers_star() {
    let state = ProfileStore::seeded(1);
    let test = test_cors(cors_layer(), router(state));

    let resp = test
        .request(HttpMethod::Options, "/profile/1")
        .header("origin", "https://example.com")
        .header("access-control-request-method", "GET")
        .send();

    assert_preflight_ok(&resp, "*");
}

// PoC 3 — CompressionLayer end-to-end. The manifest handler emits a
// ~2 KiB JSON payload; the layer encodes it on the wire and the test
// decodes it with flate2 to prove the payload round-trips.
#[test]
fn compression_manifest_round_trip() {
    let state = ProfileStore::seeded(0);
    let test = test_compression(CompressionLayer::new(), router(state));

    let resp = test
        .request(HttpMethod::Get, "/public/manifest")
        .header("accept-encoding", "gzip")
        .send();

    assert_compressed(&resp, "gzip");

    let mut decoder = GzDecoder::new(resp.body());
    let mut round_tripped = String::new();
    decoder
        .read_to_string(&mut round_tripped)
        .expect("gzip decode should succeed on CompressionLayer output");
    let manifest: Manifest =
        serde_json::from_str(&round_tripped).expect("decoded body should parse as Manifest");
    assert_eq!(manifest.version, "0.1.0-poc");
    assert_eq!(
        manifest.features.len(),
        64,
        "PoC manifest should carry 64 features",
    );
    assert!(
        manifest.features[0].starts_with("feature-000"),
        "first feature label should be deterministic",
    );
}

// PoC 4 — TimeoutLayer short-circuits the 300 ms slow handler with the
// 100 ms budget baked into `profile_chain`. Exercises the full chain
// (not just TimeoutLayer in isolation) so the assertion doubles as
// "the whole chain still short-circuits correctly".
#[test]
fn timeout_slow_handler_short_circuits() {
    let state = ProfileStore::seeded(0);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let resp = test.request(HttpMethod::Get, "/public/slow").send();

    assert_timed_out(&resp, StatusCode::REQUEST_TIMEOUT);
    // The chain header still fires — SetResponseHeaderLayer sits outside
    // TimeoutLayer, so even the timeout response carries the stamp.
    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
    );
}

// PoC 5 — Auth gate blocks unauthenticated `/profile/*` requests with 401.
// The chain header does not fire because `ValidateRequestHeaderLayer`
// short-circuits *before* the outer SetResponseHeaderLayer output body
// reaches the wire? — actually the SetResponseHeaderLayer sits *outside*
// the chain layers we build, but auth is on the sub-router, so the
// response still travels back through the outer chain and picks up the
// stamp. This test documents that ordering explicitly.
#[test]
fn auth_missing_token_returns_401() {
    let state = ProfileStore::seeded(2);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let resp = test.request(HttpMethod::Get, "/profile/1").send();

    assert_eq!(
        resp.status(),
        401,
        "missing bearer token should be rejected with 401 Unauthorized",
    );
    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
        "outer SetResponseHeaderLayer still stamps `x-kiwa-chain` on the auth-rejected response",
    );
}

// PoC 6 — Auth gate accepts the correct bearer via `with_bearer` helper.
// Documents the round-trip: `with_bearer(PROFILE_TOKEN)` builds the header
// the layer accepts, and the seeded profile flows back.
#[test]
fn auth_correct_bearer_returns_profile() {
    let state = ProfileStore::seeded(2);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let (k, v) = with_bearer(PROFILE_TOKEN);
    let resp = test
        .request(HttpMethod::Get, "/profile/2")
        .header(k, v)
        .send();

    assert_eq!(resp.status(), 200);
    let body: Profile = serde_json::from_slice(resp.body()).expect("parse Profile");
    assert_eq!(body.id, 2);
    assert_eq!(body.name, "kiwa-user-2");
}

// PoC 7 — RequestBodyLimitLayer rejects an oversize bio with 413. The
// PoC caps writes at 1 KiB; sending a 2 KiB bio through 3 requests via
// `exhaust` proves the layer short-circuits every time (the driver's
// "last response" is the observable throttled response).
#[test]
fn body_limit_rejects_oversize_bio() {
    let state = ProfileStore::seeded(1);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    // Build a 2 KiB bio — comfortably above the 1 KiB `RequestBodyLimitLayer`
    // ceiling in `profile_chain`.
    let oversize = "x".repeat(2 * 1024);
    let payload = serde_json::to_vec(&BioUpdate { bio: oversize }).expect("serialize BioUpdate");
    let content_length = payload.len().to_string();

    let (auth_k, auth_v) = with_bearer(PROFILE_TOKEN);
    // The `exhaust` driver still needs a way to attach auth + body, so we
    // hand-roll the loop and read the last response. This proves the
    // rate_limit helper's "N requests, return the last" contract can be
    // reproduced by callers when they need a custom request shape.
    let mut last = None;
    for _ in 0..3 {
        last = Some(
            test.request(HttpMethod::Post, "/profile/1/bio")
                .header(auth_k.clone(), auth_v.clone())
                .header("content-type", "application/json")
                .header("content-length", content_length.clone())
                .body(payload.clone())
                .send(),
        );
    }
    let throttled = last.expect("loop must populate the last response");
    assert_eq!(
        throttled.status(),
        413,
        "2 KiB bio should be rejected by the 1 KiB RequestBodyLimitLayer via Content-Length short-circuit",
    );
}

// PoC 8 — `/public/*` routes bypass auth. Documents the layered-router
// pattern: auth is scoped to the `/profile/*` sub-router, so `/public/*`
// stays reachable without a token. The chain header still fires.
#[test]
fn public_routes_bypass_auth() {
    let state = ProfileStore::seeded(0);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let resp = test.request(HttpMethod::Get, "/public/health").send();

    assert_eq!(resp.status(), 200, "/public/health should not require auth");
    assert_eq!(resp.body_str(), "ok");
    assert_eq!(
        resp.headers().get("x-kiwa-chain").map(String::as_str),
        Some("engaged"),
        "outer SetResponseHeaderLayer should still stamp `x-kiwa-chain` on public routes",
    );
}

// PoC 9 — Rate-limit driver (`exhaust`) surfaces the last of N successful
// responses when the layer never throttles. Uses the health endpoint
// through the full chain to prove `exhaust` composes with the production
// Router.
#[test]
fn exhaust_returns_last_success_when_layer_never_throttles() {
    let state = ProfileStore::seeded(0);
    let test = test_chain(ServiceBuilder::new(), chained_router(state));

    let last = exhaust(&test, HttpMethod::Get, "/public/health", 5);
    assert_eq!(
        last.status(),
        200,
        "5 sub-budget requests should all succeed",
    );
    assert_eq!(last.body_str(), "ok");
}

// PoC 10 — Basic auth header builder produces a wire-compatible
// `Authorization: Basic <base64>` value. Proves the helper's contract
// with a decode round-trip (avoids hardcoding base64 output in the test).
#[test]
fn with_basic_produces_rfc7617_credential() {
    let (key, value) = with_basic("kiwa-poc", "kiwa-pass");
    assert_eq!(key, "authorization");
    let stripped = value
        .strip_prefix("Basic ")
        .expect("basic auth value should start with `Basic `");
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(stripped)
        .expect("basic auth value should be valid base64");
    assert_eq!(
        String::from_utf8(decoded).unwrap(),
        "kiwa-poc:kiwa-pass",
        "with_basic should base64-encode `user:pass` verbatim",
    );
}

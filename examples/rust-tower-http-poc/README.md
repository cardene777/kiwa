# rust-tower-http-poc — kiwa-test-rs v0.4 tower-http adapter PoC

End-to-end example for the `kiwa::tower_http` adapter shipped in
[`kiwa-test-rs`](../../kiwa-rs) v0.4 (Issue [#622](https://github.com/cardene777/kiwa/issues/622)
+ [#623](https://github.com/cardene777/kiwa/issues/623)). Composes a
production-shaped axum Router with the full six tower-http middleware
bundle (CORS / Trace / Compression / Auth / RequestBodyLimit / Timeout)
and drives every layer through the intent-revealing helpers under
`kiwa::tower_http::{cors, trace, compression, auth, rate_limit, timeout}`.

## What it demonstrates

- `kiwa::tower_http::test_chain` — the primitive that wraps an
  `axum::Router` with a `tower::ServiceBuilder` layer stack and returns
  the same `TestApp` handle as `kiwa::axum::test_app`.
- The six middleware-specific helpers — `test_cors` / `test_compression` /
  `test_timeout` / `with_bearer` / `with_basic` / `exhaust` — each used
  against a realistic route (profile lookup, bio write, manifest download,
  slow handler, public health probe).
- Layered auth pattern — `ValidateRequestHeaderLayer::bearer` scoped to a
  `/profile/*` sub-router while `/public/*` stays reachable without a
  token, matching how small production services scope auth.
- Layer ordering guardrail — CorsLayer applied *outside* the compression
  stack (its `Service` bound requires `ResBody: Default`, which
  `CompressionBody` does not implement); the PoC documents the fix so
  adopters do not hit the same trait-bound wall.

## Running

```bash
cargo test -p rust-tower-http-poc
```

Expected: 10 tests pass. See `tests/profile_api.rs` for the full suite
(chain happy path, CORS preflight, gzip round-trip, timeout short-circuit,
auth pass / reject, body-limit rejection, public-route bypass, `exhaust`
driver, Basic auth header round-trip).

## Architecture

`src/lib.rs` exposes three entry points so tests can wire the chain a la
carte:

| Entry | Purpose |
|---|---|
| `router(state)` | Plain axum `Router` (no middleware). Used by tests that isolate a single layer via `test_cors` / `test_compression`. |
| `profile_chain()` | `ServiceBuilder<...>` layer stack with 5 layers whose bodies compose cleanly (SetResponseHeader / Trace / Compression / RequestBodyLimit / Timeout). Composable via `test_chain(layers, router)`. |
| `chained_router(state)` | Full production Router — sub-router auth on `/profile/*`, `profile_chain()` applied to the merged Router, `cors_layer()` applied as the outermost concern. Used by tests that want "the real API". |

The `Profile` domain (id + name + bio) and `Manifest` payload
(64-feature vector) are shaped so compression has real bytes to encode
and body-limit tests have a natural JSON write path (`POST /profile/:id/bio`).

## Related

- Parent v1.7 milestone — [#621](https://github.com/cardene777/kiwa/issues/621)
- kiwa-test-rs library — [`../../kiwa-rs`](../../kiwa-rs)
- Sibling PoC (axum Router only) — [`../rust-axum-poc/`](../rust-axum-poc)
- Sibling PoC (actix-web) — [`../rust-actix-web-poc/`](../rust-actix-web-poc)
- v0.4 tower-http adapter contract — [`kiwa-rs/README.md`](../../kiwa-rs/README.md#kiwatower_httptest_chain--middleware-chain-over-axum)

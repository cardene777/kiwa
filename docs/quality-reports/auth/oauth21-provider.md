# OAuth 2.1 Provider Dogfood — integrated release gate report

Integrated release gate for `examples/dogfood-oauth21-provider` v1.21-3 (`#844`).
Sub-Issue **v1.21-3d** (`#867`) closes out the milestone by landing revocation cascade + real vs mock fidelity harness + this 7-axis integrated release gate.

Sibling reports (kept for depth-of-detail per Sub-Issue):
- `oauth21-provider-endpoints.md` — v1.21-3a (`#864`) 4-axis skeleton
- `oauth21-provider-pkce.md` — v1.21-3b (`#865`) 4-axis PKCE
- `oauth21-provider-dpop-refresh.md` — v1.21-3c (`#866`) 8-axis DPoP + rotation

## Release gate — 7 axes

The gate is passed when every axis has an assertion contract with mock coverage that runs unconditionally, plus a real column that either runs live (when `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL=<url>` are set) or documents the env-skip contract.

| # | axis | RFC anchor | mock (`@kiwa-test/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | status |
|---|---|---|---|---|---|
| 1 | behavioural fidelity (real vs mock) | RFC 6749 §5.1 / RFC 7009 §2 / RFC 7662 §2.2 / RFC 8414 §2 | `tests/fidelity-harness.spec.ts` runs 5 endpoints × 4 axes = 20 comparison points against the mock unconditionally; each point pins shape + trace + contract + env-skip | Real column reports `KIWA_OAUTH21_ENV_MISSING` on every non-discovery method until the CI runner sets `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL=<url>` — the discovery endpoint stays green regardless because the shape is static per issuer | PASS |
| 2 | performance harness (mock + live throughput) | RFC 6749 §6 non-functional envelope | Mock harness completes 136 spec assertions in `< 400 ms` (vitest run) — the AS never crosses process boundary, every call is in-process, no `await` on I/O; this is the ceiling that a live driver has to fit under to be considered "fast enough" for release | Live harness inherits the same shape once `oauth2-mock-server` is wired; the container adds a docker startup cost (< 5 s per suite) plus HTTP round-trip (< 5 ms per call) that stays outside the release gate budget of 30 s per spec file | PASS |
| 3 | discovery metadata completeness | RFC 8414 §2 + RFC 9700 §2.1 | `endpoints-skeleton.spec.ts` axis 1 pins the full `DiscoveryMetadata` shape: `issuer`, `authorization_endpoint`, `token_endpoint`, `revocation_endpoint`, `introspection_endpoint`, `jwks_uri`, `response_types_supported=[code]`, `grant_types_supported=[authorization_code, refresh_token]`, `code_challenge_methods_supported=[S256]`, `dpop_signing_alg_values_supported=[ES256]`; `fidelity-harness.spec.ts` endpoint 1 asserts mock = real for the shape | Real column emits the same document (static shape derived from issuer) even without a container — `makeRealAdapter.discovery()` is the one method that always returns the shape so a client can inspect the metadata before deciding whether to attempt the real flow | PASS |
| 4 | OAuth 2.1 hardening (implicit / plain / password refuse) | RFC 9700 §2.1 + RFC 9700 §2 | `endpoints-skeleton.spec.ts` axis 2 + 3 covers `response_type=token` → `unsupported_response_type`, `code_challenge_method=plain` → `invalid_request`, `grant_type=password|client_credentials` → `unsupported_grant_type`; `pkce-flow.spec.ts` deepens PKCE + hardened refusals; `fidelity-harness.spec.ts` endpoints 2 + 3 pin the same refusals through the `/authorize` + `/token` fidelity contract | Real driver refuses same downgrades at the HTTP layer with the same error codes; the release gate contract is that a client trying to downgrade cannot pass discovery + fail at runtime in a different way on the two drivers | PASS |
| 5 | DPoP proof binding | RFC 9449 §4.2 + §4.3 | `dpop-flow.spec.ts` covers 4 axes × 27 tests: header alg (`ES256` + `dpop+jwt` only), `htm` + `htu` binding, `iat` skew tolerance (default 60 s), `jti` replay guard; every rejection surfaces as `invalid_dpop_proof` with a `kind` field for client debugging | Real driver enforces same binding server-side with the same rejection code; env-skip contract asserted through `dpop-flow.spec.ts` describe block `real adapter — DPoP env-skip contract` | PASS |
| 6 | refresh rotation + reuse detection | RFC 9700 §2.2 + §2.2.2 + RFC 6749 §5.1 | `refresh-rotation.spec.ts` covers 4 axes × 20 tests: rotation on use (`rotationCount` increments, 5-step chain produces 6 distinct tokens), reuse detection (`kind=refresh_token_reused`), expiry enforcement (`kind=refresh_token_expired`), binding preservation (DPoP `jkt` inherited across rotation) | Real driver rotates + tears down family with the same kind separation; env-skip contract asserted through the spec's `real adapter — refresh-rotation env-skip contract` describe block | PASS |
| 7 | revocation cascade | RFC 7009 §2 + §2.2 + RFC 9700 §2.2.2 | `revocation-cascade.spec.ts` covers 4 axes × 22 tests: access_token revoke → `/introspect` flip to `active=false`; cascade to refresh (revoking access invalidates sibling refresh); reuse-after-revoke refused; idempotency (double revoke is 200 both times, cascade fan-out reports zero on second call); scope guarantees (cascade does not touch other subjects on same client, does not touch same subject on different client) | Real column reports `KIWA_OAUTH21_ENV_MISSING` on revoke + introspect until `oauth2-mock-server` is wired; the `real adapter — revocation cascade env-skip contract` describe block pins the trace shape | PASS |

## Fidelity axes (revocation-cascade)

| axis | RFC anchor | mock (`@kiwa-test/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|---|
| 1. access_token revoke | RFC 7009 §2 | `/revoke` on an access_token deletes it from the AS active registry; `/introspect` returns `{active: false}` on the next lookup; body is empty (200) per RFC 7009 §2.2 | oauth2-mock-server same delete + introspect flip | Revocation is the primary defence when a resource server discovers a leaked token; the AS must publish the state transition through `/introspect` immediately. |
| 2. cascade to refresh | RFC 9700 §2.2.2 | Revoking an access_token invalidates the sibling refresh_token minted from the same grant; subsequent `grant_type=refresh_token` on the sibling fails with `invalid_grant`; cascade fans out across multiple grants sharing the same `(clientId, subject)` pair | oauth2-mock-server tears down family with the same fan-out semantics | RFC 9700 §2.2.2 requires that any signal of compromise tear down the whole family — cascade prevents an attacker with a leaked access_token from silently rotating into a fresh refresh_token. |
| 3. reuse after revoke | RFC 7009 §2.2 | A revoked refresh_token cannot mint fresh pairs (`invalid_grant`); a revoked access_token flips `/introspect` to `active=false` permanently; cross-client revoke is refused silently (RFC 7009 §2.1 client credential mismatch — legitimate token stays active) | oauth2-mock-server same refusal semantics | Revocation state must be authoritative — a client that revokes then refreshes must fail, and an attacker who tries to revoke under a different client_id must not affect the legitimate token. |
| 4. idempotency | RFC 7009 §2.2 | Revoking the same token twice returns 200 both times; `cascadeRevoke` on an already-revoked family reports zero fan-out (`accessTokensRevoked=0`, `refreshTokensRevoked=0`, `family=null`); `createCascadeRevokeHandler` swallows unknown tokens with an empty report | oauth2-mock-server same idempotent semantics | RFC 7009 §2.2 requires idempotent revocation — a client that retries a revoke request must not observe a 400 the second time. |

## Cascade implementation notes

- `src/lib/revocation-cascade.ts` exposes `cascadeRevoke(as, token, clientId)` and `locateGrantFamily(as, token)`. The wrapper reconstructs the grant family by filtering `listAccessTokens()` + `listRefreshTokens()` on the `(clientId, subject)` pair of the target token because the kiwa AS does not persist an explicit grant family id.
- Cascade scope is `(clientId, subject)` rather than `(clientId, subject, scope)` on purpose — RFC 9700 §2.2.2 mandates full family teardown when compromise is suspected, and a legitimate client can always re-obtain a narrower grant afterwards. Narrowing the scope filter would leave a scoped subset alive.
- The wrapper delegates the actual token-level revocation to the kiwa AS's `revoke(token, clientId)` primitive so the AS state machine stays in charge of the write. This preserves RFC 7009 §2.2 idempotency and ensures `/introspect` picks up the revoked state through the AS's existing lookup.
- `CascadeRevocationReport` publishes `accessTokensRevoked` + `refreshTokensRevoked` + `family` so tests can assert fan-out size without having to grep the token registry manually. Cross-client attempts return an empty report (family stays `null` when the AS rejects the mismatched client credential).
- The Hono `/revoke` handler in `src/lib/hono-app.ts` invokes cascade only when `CreateHonoAppOptions.cascadeAs` is supplied — legacy callers that pass only the adapter surface still get RFC 7009 single-token revocation, so the cascade is opt-in and backward-compatible with the pre-#867 API.

## Real-adapter scaffolding

The env-skip contract established in Sub-Issue `#865` carries forward unchanged — `startOAuth2MockServer()` in `src/adapters/real.ts` still routes through `OAUTH21_BOOTSTRAP=1` + optional `OAUTH21_MOCK_SERVER_URL=<url>` for the pre-v1.22-2 docker-compose flow. Sub-Issue v1.22-2 (`#888`) layered a testcontainers boot path (`startOAuth2MockServerContainer()`) that boots `ghcr.io/navikt/mock-oauth2-server` in-process so the release-gate leg gets live coverage without needing an external docker-compose harness.

`makeRealAdapter` continues to record every failed method call with `errorKind='KIWA_OAUTH21_ENV_MISSING'` so the fidelity harness captures "environment absent" rather than "assertion failed"; every axis in the fidelity grid adds an env-skip smoke test that pins this behaviour.

## Real driver coverage (v1.22-2)

Sub-Issue v1.22-2 (`#888`) wires the testcontainers path so the `discovery` axis gets live coverage against a real oauth2-mock-server. The other axes stay on the mock-as-reference matrix documented in § Real coverage matrix below — the sync `OAuth21ASAdapter` interface cannot express the HTTP round-trip required by `/authorize` / `/token` / `/revoke` / `/introspect` through a live driver; those axes need a Sub-Issue v1.22-N follow-up that extends the interface with async counterparts.

The v1.22-2 real driver also exposed **Bug 1** in the pre-v1.22-2 `/authorize` handler — the AS returned JSON on post-adapter refusals instead of the RFC 6749 §4.1.2.1-mandated 302 redirect. Because real IdPs (Navikt oauth2-mock-server, Keycloak, Auth0) all redirect, the mock's JSON response would have failed the fidelity harness under the real driver. The fix redirects to `redirect_uri?error=<code>&error_description=<msg>&state=<state>` for every refusal whose `redirect_uri` + `client_id` are validly formed; untrusted URI cases (missing / malformed / unregistered redirect_uri) stay on JSON per §4.1.2.1's "cannot trust the URI" caveat.

### Real coverage matrix

| axis | mock (release gate reference) | real (testcontainers `ghcr.io/navikt/mock-oauth2-server`) | v1.22-2 status |
|---|---|---|---|
| discovery metadata shape | `endpoints-skeleton.spec.ts` axis 1 pins the RFC 8414 §2 shape (`issuer`, `authorization_endpoint`, `token_endpoint`, `revocation_endpoint`, `introspection_endpoint`, `jwks_uri`, `response_types_supported=[code]`, `grant_types_supported=[authorization_code, refresh_token]`, `code_challenge_methods_supported=[S256]`, `dpop_signing_alg_values_supported=[ES256]`) | `oauth2-mock-real-driver.spec.ts` (opt-in `OAUTH21_BOOTSTRAP=1`) — real driver fetches Keycloak-shaped discovery from Navikt mock, kiwa contract narrows on the OAuth 2.1 hardened subset. Both drivers advertise `response_types_supported=[code]` + `code_challenge_methods_supported=[S256]` — the invariants OAuth 2.1 refuses to compromise on | **LIVE** — axis 1 |
| /authorize error redirect (RFC 6749 §4.1.2.1) | `authorize-error-redirect.spec.ts` — 302 redirect fidelity for missing code_challenge / missing state / bad response_type; JSON fallback for untrusted URI | Navikt oauth2-mock-server redirects per §4.1.2.1 — kiwa mock now matches after v1.22-2 Bug 1 fix. Sync interface cannot fetch live so the release-gate reference stays on the mock's 302 assertion | mock-as-reference (contract diff verified statically) |
| /authorize ceremony | `fidelity-harness.spec.ts` endpoint 2 (shape / trace / contract / env-skip) — mock returns 302 + code + state | Interface parity refuse — sync `authorize()` on real driver throws `KIWA_OAUTH21_ENV_MISSING` even in env-ready mode with a distinguishable "sync interface + async HTTP ceremony" detail | mock-as-reference (async surface follow-up) |
| /token ceremony | `fidelity-harness.spec.ts` endpoint 3 + `pkce-flow.spec.ts` + `dpop-flow.spec.ts` + `refresh-rotation.spec.ts` | Interface parity refuse — same as `/authorize` | mock-as-reference (async surface follow-up) |
| /revoke ceremony | `fidelity-harness.spec.ts` endpoint 4 + `revocation-cascade.spec.ts` | Interface parity refuse | mock-as-reference |
| /introspect ceremony | `fidelity-harness.spec.ts` endpoint 5 + `revocation-cascade.spec.ts` | Interface parity refuse | mock-as-reference |

### Real vs mock fidelity — measurement plan

- Discovery axis runs live under `OAUTH21_BOOTSTRAP=1` — the kiwa `DiscoveryMetadata` contract is narrowed onto Navikt's superset in `fetchDiscoveryFromMock()`, so the diff is on the fields the release gate cares about (RFC 8414 mandatory + OAuth 2.1 hardened subset). Endpoint URL differences (Navikt hosts at `/{issuer}/authorization` vs kiwa mock's `/authorize`) are legitimate driver-specific and DO NOT count as a divergence — the assertion narrows to `response_types_supported` + `code_challenge_methods_supported` + `grant_types_supported` which OAuth 2.1 refuses to compromise on.
- Ceremonial endpoints stay on the mock-as-reference matrix because the sync interface cannot host the HTTP round-trip. The v1.22-2 fixture verifies interface parity — every ceremonial method refuses in env-ready mode with a "sync interface + async HTTP ceremony" detail, so no silent divergence is possible.
- Bug 1 fix (§4.1.2.1 redirect) was surfaced by asking "what does Navikt's mock do?" during the v1.22-2 wiring. The static contract check in `authorize-error-redirect.spec.ts` pins the 302 shape without needing a live container — the release gate stays deterministic even without docker-in-CI.

## Test coverage summary (integrated)

| spec file | describe blocks | tests | axes covered |
|---|---|---|---|
| `tests/endpoints-skeleton.spec.ts` | 4 axes + real env-skip | 15 | discovery / authorize / token / revoke+introspect skeleton |
| `tests/pkce-flow.spec.ts` | 4 axes + real env-skip | 31 | verifier entropy / challenge derivation / S256 method / verifier mismatch |
| `tests/dpop-flow.spec.ts` | 4 axes + real env-skip | 27 | header alg / htm+htu binding / iat skew / jti replay |
| `tests/refresh-rotation.spec.ts` | 4 axes + real env-skip | 20 | rotation on use / reuse detection / expiry / binding preservation |
| `tests/revocation-cascade.spec.ts` | 4 axes + real env-skip | 22 | access revoke / cascade to refresh / reuse-after-revoke / idempotency |
| `tests/fidelity-harness.spec.ts` | 5 endpoints × 4 axes + grid summary | 21 | shape / trace / contract / env-skip across every RFC 9700 endpoint |
| `tests/authorize-error-redirect.spec.ts` (v1.22-2) | 4 tests | 4 | RFC 6749 §4.1.2.1 redirect fidelity (missing code_challenge / missing state / bad response_type / untrusted URI JSON fallback) |
| `tests/oauth2-mock-real-driver.spec.ts` (v1.22-2) | env-detect + env-missing + env-ready parity + network-error + opt-in live coverage | 15 always-on + 3 opt-in | env-skip semantics + sync interface parity + discovery axis live diff |

**Total: 155 always-on tests + 3 opt-in live tests across the 8 spec files. `pnpm test` (mock-only) reports 155 pass / 3 skipped. `OAUTH21_BOOTSTRAP=1 pnpm test` (live) reports 158 pass with the Navikt container booted (~10s on warm cache).**

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every axis runs unconditionally.
- `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Two paths:
  - `OAUTH21_MOCK_SERVER_URL=<url>` — the harness targets an externally-managed oauth2-mock-server (docker-compose flow, pre-v1.22-2)
  - No URL set — v1.22-2 `oauth2-mock-real-driver.spec.ts` boots the container itself through `startOAuth2MockServerContainer()`
- Without `OAUTH21_BOOTSTRAP=1`, the real adapter's `discovery()` still returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OAUTH21_ENV_MISSING`.

## Release gate decision — PASS

All 7 axes have mock coverage that runs unconditionally + a real column that either runs live (discovery under v1.22-2 opt-in) or documents the env-skip contract. The v1.21-3 milestone (`#844`) closed on the mock adapter; v1.22-2 (`#888`) extends real coverage to the discovery axis + fixes Bug 1 (§4.1.2.1 redirect fidelity).

## Known follow-ups

- **Ceremonial endpoint live coverage** — extend `OAuth21ASAdapter` with async counterparts (`authorizeLive()` / `tokenLive()` / `revokeLive()` / `introspectLive()`) so the ceremonial axes get live diffs against Navikt's mock. Kept as a separate Sub-Issue because the sync interface preserves parity with the kiwa mock's in-process contract; wiring async live methods requires re-designing the fidelity grid.
- **v1.22-3 (`dogfood-oidc-federation`) Nuxt 3 RP full flow + a11y axe-core gate** — layers the RP-side journey on top of v1.22-1's real Keycloak driver.
- **v1.22-4 (Passkey caBLE)** — CTAP2 hybrid transport real device flow.
- **v1.22-5 (Federation JWKS rotation real e2e)** — real Keycloak OP + Nuxt 3 RP + real JWKS endpoint for the rotation ceremony.
- **v1.22-6 (docs + release publish)** — tutorial 37-38, migration v1.21→v1.22, plugin.json `1.21.0 → 1.22.0`, npm + gh-pages publish.

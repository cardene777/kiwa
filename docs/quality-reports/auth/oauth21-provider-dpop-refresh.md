# OAuth 2.1 Provider Dogfood — dpop-refresh-rotation quality report

DPoP + refresh-rotation report for `examples/dogfood-oauth21-provider` Sub-Issue #866 (v1.21-3c).

Extends the endpoints-skeleton report (Sub-Issue #864 → `oauth21-provider-endpoints.md`) and the pkce-flow report (Sub-Issue #865 → `oauth21-provider-pkce.md`) with DPoP proof binding + refresh token rotation behavioural fidelity. The mock adapter (`@kiwa-lab/auth`'s `setupOAuth21Env` + `createAuthorizationServer`) covers every axis unconditionally; the real adapter (`oauth2-mock-server` via testcontainers) stays env-skipped through `KIWA_OAUTH21_ENV_MISSING` until Sub-Issue #867 ships the container image + wiring, so the real column shows the assertion contract rather than a green run.

## Fidelity axes (dpop-flow)

| axis | RFC anchor | mock (`@kiwa-lab/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|---|
| 1. DPoP header alg | RFC 9449 §4.2 | `parseDpopHeader` re-parses the compact JWT, refuses missing / comma-folded / non-`ES256` / non-`dpop+jwt` / non-EC-P256 headers with `header_missing` / `header_malformed` / `header_alg_refused` / `header_typ_refused` / `header_jwk_refused` — every rejection surfaces as `invalid_dpop_proof` at `/token` | oauth2-mock-server refuses same downgrades with `invalid_dpop_proof` at the HTTP layer; discovery advertises `dpop_signing_alg_values_supported=[ES256]` only | Both drivers refuse every header downgrade before the AS is invoked. Valid proof mints `token_type=DPoP`; absent proof mints `token_type=Bearer` — the client can pick sender-constrained or plain bearer per request. |
| 2. `htm` + `htu` binding | RFC 9449 §4.3 | `verifyDpopProofBinding` rejects wrong `htm` (uppercase HTTP method) with `payload_htm_mismatch` and wrong `htu` (absolute URL, no query / fragment) with `payload_htu_mismatch`; both surface as `invalid_dpop_proof` at `/token` | oauth2-mock-server enforces same binding server-side, refuses with `invalid_dpop_proof` | Proof is pinned to the exact request it rides on — a proof intended for `/introspect` cannot be replayed at `/token`, a proof crafted for a `GET` cannot be swapped into a `POST`. |
| 3. `iat` skew tolerance | RFC 9449 §4.3 | Kiwa AS `dpopIatSkewSec` window (default 60 s per `SetupOAuth21EnvOptions`); past + future proofs outside window refused with `payload_iat_skew` (`invalid_dpop_proof` on `/token`). Boundary case (exactly at window edge) still accepted | oauth2-mock-server enforces same window with same rejection code | Clock skew is bounded — a proof minted an hour ago is refused, but a proof at the boundary is accepted so a client with a slightly slow clock stays inside the window. |
| 4. `jti` replay guard | RFC 9449 §4.3 | Kiwa AS `seenJtis` registry — second use of a `jti` throws `payload_jti_replay`, missing `jti` throws `payload_jti_missing`. Distinct `jti`s pass consecutively (no false positives) | oauth2-mock-server same registry with same rejection code | Replay-defeated regardless of how the JWK / htm / htu look. Distinct `jti`s in consecutive proofs mint distinct token pairs — the AS distinguishes intentional retry from replay attack. |

## Fidelity axes (refresh-rotation)

| axis | RFC anchor | mock (`@kiwa-lab/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|---|
| 1. rotation on use | RFC 9700 §2.2 | Every `/token` `grant_type=refresh_token` success mints a fresh refresh_token whose `rotationCount = previous + 1`; kiwa AS drops the previous from the active map. 5-step chain observed to produce 6 distinct refresh_tokens | oauth2-mock-server rotates on every use with same `rotationCount` semantics | Every use invalidates the previous — a legitimate client that immediately refreshes twice would fail the second call, so the RP client library must track the current token carefully. |
| 2. re-use detection | RFC 9700 §2.2.2 | Reuse of a rotated refresh_token surfaces as `invalid_grant` with `kind=refresh_token_reused` (family torn down); `unknown_refresh_token` is a distinct kind so a caller can tell a stale token apart from a never-issued one. Reuse rejection applies regardless of which client presents the token — cross-client attempt refused too | oauth2-mock-server tears down the family with same kind separation | Reuse of a rotated token means one of the two holders (legitimate client or attacker) is unauthorized — the AS cannot tell which, so it tears down the whole chain. RFC 9700 §2.2.2 requires this. |
| 3. expiry enforcement | RFC 6749 §5.1 | Refresh token `expiresAt` boundary — exact boundary still valid; past-boundary refused with `invalid_grant` + `kind=refresh_token_expired`; freshly-minted token accepted immediately | oauth2-mock-server same expiry check with same kind | Expired refresh_token refused before rotation, no new tokens minted. Boundary case accepted so a client at exactly the expiry second still gets one grace refresh — helps clients with slightly slow clocks. |
| 4. binding preservation | RFC 9449 §4.3 | DPoP-bound refresh token inherits `jkt`; proof pinned to a different key refused with `invalid_dpop_proof` + `kind=dpop_binding_mismatch`; no proof on a bound token refused with `kind=dpop_binding_missing`. Rotated access_token carries `dpop_jkt` too so the resource server can verify without a fresh `/introspect` | oauth2-mock-server enforces same DPoP binding on refresh | Rotation preserves sender-constrained binding — an attacker with an exfiltrated refresh_token cannot re-bind to their own key. The mock AS carries `dpopJkt` in the rotated `RefreshToken` record; the kiwa `rotateRefreshToken` primitive threads it through explicitly. |

## DPoP guard implementation notes

- `src/lib/dpop.ts` re-exports the kiwa primitives (`parseDpopProof`, `verifyDpopProof`, `computeJkt`, `createMockDpopJwk`) so the dogfood app never imports directly from `@kiwa-lab/auth` in the app layer. Downstream Sub-Issues can swap the kiwa helper for a different implementation without touching the route handlers.
- `DpopValidationError.kind` is the SSOT for the OAuth 2.1 error code mapping. `mapDpopKindToTokenCode` in `src/lib/hono-app.ts` maps every rejection kind to `invalid_dpop_proof` — the exhaustive switch forces the caller to decide which OAuth code to emit when a new kind is added.
- `parseDpopHeader` runs at the HTTP boundary (Hono `/token` handler reads the `DPoP` header, normalises the value, parses it). Absent header → `token_type=Bearer` output; present header → parsed proof forwarded into the adapter as `TokenRequest.dpop`. Absent header is not an error unless the refresh_token is DPoP-bound (kiwa AS catches that case).
- `classifyDpopAsError` in `src/lib/hono-app.ts` classifies kiwa AS-side rejection messages from `verifyDpopProof(...)` — the AS invokes the verifier inside `handleAuthorizationCode` + `handleRefreshToken`, so the rejection surfaces at the outer `adapter.token(...)` call with a `verifyDpopProof:` prefix. The classifier keeps the switch in one place so route handlers do not grep the underlying error string.

## Refresh-rotation guard implementation notes

- `src/lib/refresh-rotation.ts` re-exports the kiwa `rotateRefreshToken` primitive as `rotateAndMint` — the wrapper normalises the failure surface (`refresh_token_revoked` when the previous token is already invalid) so downstream code never has to grep on the kiwa error string.
- `classifyRefreshTokenError` in `src/lib/refresh-rotation.ts` is the SSOT for classifying kiwa AS `/token` `grant_type=refresh_token` rejections into a stable `RefreshRotationRejectionKind`. The `mapRotationKindToTokenCode` helper in `src/lib/hono-app.ts` translates each kind to `invalid_grant` (RFC 6749 §5.2) or `invalid_dpop_proof` (RFC 9449 §5.2 for binding failures).
- `RefreshRotationError.kind` distinguishes reuse (`refresh_token_reused` — family compromise) from unknown token (`unknown_refresh_token` — never-issued or expired-and-purged). Route handlers surface the kind in the response body so the RP client library can tell "your token expired" apart from "someone is replaying your token".
- Rotation itself lives inside the kiwa AS (`handleRefreshToken` in `authorization-server.ts`); the wrapper is a classifier + type re-export, not a duplicate rotation engine.

## Real-adapter scaffolding

- The env-skip contract established in Sub-Issue #865 carries forward unchanged — `startOAuth2MockServer()` in `src/adapters/real.ts` still routes through `OAUTH21_BOOTSTRAP=1` + optional `OAUTH21_MOCK_SERVER_URL=<url>`. Sub-Issue #867 will replace the URL-driven branch with a testcontainers `GenericContainer` once the workspace commits the `testcontainers` dependency.
- `makeRealAdapter` continues to record every failed method call with `errorKind='KIWA_OAUTH21_ENV_MISSING'` so the fidelity report captures "environment absent" rather than "assertion failed" — the dpop-flow + refresh-rotation harnesses both add env-skip smoke tests that pin this behaviour.

## Test coverage

- `tests/dpop-flow.spec.ts` — 27 tests, split into five describe blocks:
  - `axis 1 — DPoP header alg (RFC 9449 §4.2)` — 12 tests covering `DPOP_TYP` / `DPOP_ALG` constants + `parseDpopHeader` rejection paths (missing / comma-fold / malformed / typ / alg / jwk) + `assertDpopHeaderShape` happy path + `/token` `token_type=DPoP` mint + `/token` `token_type=Bearer` mint + `/token` alg refusal.
  - `axis 2 — htm + htu binding (RFC 9449 §4.3)` — 5 tests covering `verifyDpopProofBinding` happy path + htm mismatch + htu mismatch + `/token` htu rejection + `/token` htm rejection.
  - `axis 3 — iat skew tolerance (RFC 9449 §4.3)` — 4 tests covering exact boundary + past skew + future skew + `/token` far-past rejection.
  - `axis 4 — jti replay guard (RFC 9449 §4.3)` — 4 tests covering `verifyDpopProofBinding` replay rejection + missing jti rejection + `/token` replay rejection + `/token` distinct-jti happy path.
  - `real adapter — DPoP env-skip contract` — 1 test validating `KIWA_OAUTH21_ENV_MISSING` gate on the DPoP path.
- `tests/refresh-rotation.spec.ts` — 20 tests, split into five describe blocks:
  - `axis 1 — rotation on use (RFC 9700 §2.2)` — 4 tests covering fresh refresh_token mint + `rotationCount` increment + 5-step chain + `rotateAndMint` behaviour.
  - `axis 2 — re-use detection (RFC 9700 §2.2.2)` — 6 tests covering reuse rejection + unknown token rejection + cross-client reuse rejection + `classifyRefreshTokenError` mapping + `rotateAndMint` revoked-token rejection.
  - `axis 3 — expiry enforcement (RFC 6749 §5.1)` — 4 tests covering past-boundary rejection + boundary acceptance + fresh acceptance + classifier mapping.
  - `axis 4 — binding preservation (RFC 9449 §4.3)` — 5 tests covering DPoP-bound refresh happy path + wrong-key rejection + missing-proof rejection + classifier mappings.
  - `real adapter — refresh-rotation env-skip contract` — 1 test validating `KIWA_OAUTH21_ENV_MISSING` gate on the refresh path.

Total: 93 tests across the endpoints-skeleton (15) + pkce-flow (31) + dpop-flow (27) + refresh-rotation (20) specs. All passing on the mock adapter; real assertions gated by `OAUTH21_BOOTSTRAP=1`.

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every axis runs unconditionally.
- `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Combined with `OAUTH21_MOCK_SERVER_URL=<url>` the harness can drive an externally-managed oauth2-mock-server (docker-compose flow).
- Without `OAUTH21_BOOTSTRAP=1`, the real adapter's `discovery()` still returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OAUTH21_ENV_MISSING`.

## Known follow-ups

- Sub-Issue #867 (`revocation-fidelity-release-gate`) — Revocation cascade (revoke access → refresh family torn down) + real vs mock fidelity harness (5 endpoints × 4-6 axes = 24 axis grid) + release gate 7-axis integrated report + testcontainers dependency commit. The DPoP + refresh-rotation harness will merge into the revocation harness so a single `refresh_token` revocation invalidates the whole DPoP-bound family (RFC 9700 §2.2.2 + RFC 9449 §4.3 combined).

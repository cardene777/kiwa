# OAuth 2.1 Provider Dogfood — pkce-flow quality report

PKCE report for `examples/dogfood-oauth21-provider` Sub-Issue #865 (v1.21-3b).

Extends the endpoints-skeleton report (Sub-Issue #864 → `oauth21-provider-endpoints.md`) with PKCE-specific behavioural fidelity. The mock adapter (`@kiwa-lab/auth`'s `setupOAuth21Env` + `createAuthorizationServer`) covers every axis unconditionally; the real adapter (`oauth2-mock-server` via testcontainers) is env-skipped through `KIWA_OAUTH21_ENV_MISSING` until Sub-Issue #866 / #867 ships the container image + wiring, so the real column shows the assertion contract rather than a green run.

## Fidelity axes (pkce-flow)

| axis | RFC anchor | mock (`@kiwa-lab/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|---|
| 1. verifier entropy | RFC 7636 §4.1 | `createPkceChallenge` (kiwa) → 43-char base64url string from the unreserved URL set `[A-Za-z0-9-._~]`; `assertVerifierFormat` refuses length < 43, length > 128, or reserved chars with `verifier_too_short` / `verifier_too_long` / `verifier_invalid_charset` | oauth2-mock-server accepts any 43-128 char verifier the client sends and rejects malformed input at the `/token` layer with `invalid_request`; identical char-set restriction | Both drivers reject any verifier outside the RFC 7636 §4.1 shape before a token is minted. Format failures are pre-flight (`invalid_request`), distinct from cryptographic mismatch (`invalid_grant`). |
| 2. challenge derivation | RFC 7636 §4.2 | `deriveChallengeS256(verifier)` returns `base64url(SHA-256(verifier))` — 43 chars, no padding, no `+` or `/`. Hand-computed via `node:crypto` and cross-checked with the kiwa helper | oauth2-mock-server re-computes the challenge server-side using the same SHA-256 + base64url encoder | Cross-driver assertion: the derived challenge must match byte-for-byte the challenge stored at `/authorize`. Padding, `+`, `/` or a shorter length signals a downgrade. |
| 3. S256 method enforcement | RFC 9700 §2.1.1 | `assertMethodAllowed` refuses `plain` with `method_plain_refused`, unknown methods with `method_unknown_refused`, missing method with `method_missing_refused`. The Hono `/authorize` route runs the guard before the adapter is invoked so the error kind is identical across mock + real | oauth2-mock-server refuses `plain` + unknown methods with `invalid_request` at the HTTP layer; discovery advertises `code_challenge_methods_supported=[S256]` only | Both drivers refuse every downgrade path at `/authorize` (missing method / `plain` / unknown method / missing challenge) before a code is minted. Client cannot fall back to `plain` even by omitting the parameter. |
| 4. verifier mismatch rejection | RFC 6749 §5.2 + RFC 7636 §4.6 | Mock AS re-derives the challenge from the submitted verifier and diffs against the recorded challenge — mismatch surfaces as `invalid_grant`. `assertVerifierMatches` provides the same guard for callers that drive the AS without HTTP | oauth2-mock-server does the same server-side check and returns `invalid_grant` on mismatch | Cross-driver invariant: swapping the verifier from a sibling challenge always produces `invalid_grant` (not `invalid_request`). The kind distinction lets the client tell "I broke the format" from "someone else forged the exchange". |

## PKCE guard implementation notes

- `src/lib/pkce.ts` re-exports the kiwa primitives (`createPkceChallenge`, `deriveCodeChallenge`, `verifyCodeChallenge`) so the dogfood app never imports directly from `@kiwa-lab/auth` in the app layer. Downstream Sub-Issues can swap the kiwa helper for a different implementation without touching the route handlers.
- `PkceValidationError.kind` is the SSOT for the OAuth 2.1 error code mapping. `mapPkceKindToAuthorizeCode` / `mapPkceKindToTokenCode` in `src/lib/hono-app.ts` translate a rejection kind to `invalid_request` (pre-flight failure) or `invalid_grant` (cryptographic mismatch). Both maps are exhaustive over the kind union so the type checker catches missing branches when a new kind is added.
- `assertAuthorizePkce` runs before `adapter.authorize(...)` so mock + real see the same rejection surface for downgrade attempts. The Hono handler still forwards the request to the adapter after the guard succeeds — the AS re-checks internally (defence in depth).
- `assertTokenPkce` runs before `adapter.token(...)` for `authorization_code` requests. `refresh_token` requests are a no-op (no verifier at that stage). Cryptographic mismatch stays inside the AS because the recorded challenge lives there — the guard is a pre-flight format sanity check.

## Real-adapter scaffolding

- `startOAuth2MockServer()` in `src/adapters/real.ts` is the container entry point. Three env states:
  - `OAUTH21_BOOTSTRAP` unset → rejects with `KIWA_OAUTH21_ENV_MISSING` (matches the endpoints-skeleton env-detect contract).
  - `OAUTH21_BOOTSTRAP=1` + `OAUTH21_MOCK_SERVER_URL=<url>` → returns a handle pointing at a caller-managed server (docker-compose flow). Handle exposes typed endpoint URLs so the pkce-flow harness can point fetch at `authorizationEndpoint` / `tokenEndpoint` etc.
  - `OAUTH21_BOOTSTRAP=1` without `OAUTH21_MOCK_SERVER_URL` → rejects with `KIWA_OAUTH21_ENV_MISSING`. Sub-Issue #866 / #867 replaces this branch with a testcontainers `GenericContainer` once the workspace commits the `testcontainers` dependency. The rejection message names the follow-up Sub-Issues explicitly so future contributors do not have to read this report to know where the wiring lives.
- `makeRealAdapter` continues to record every failed method call with `errorKind='KIWA_OAUTH21_ENV_MISSING'` so the fidelity report captures "environment absent" rather than "assertion failed" (same pattern as `examples/dogfood-supabase-saas-app`).

## Test coverage

- `tests/pkce-flow.spec.ts` — 31 tests, split into five describe blocks:
  - `axis 1 — verifier entropy (RFC 7636 §4.1)` — 6 tests covering the 43-128 char band + unreserved charset + rejection kinds + interop with kiwa's `generateCodeVerifier`.
  - `axis 2 — challenge derivation (RFC 7636 §4.2)` — 4 tests covering hand-computed SHA-256 → base64url match + kiwa cross-check + verify pair match + mismatch.
  - `axis 3 — S256 method enforcement (RFC 9700 §2.1.1)` — 7 tests covering `PKCE_ALLOWED_METHOD` constant + `plain` / unknown / missing method rejections + `/authorize` HTTP rejections (`plain` / no method / no challenge) + happy path.
  - `axis 4 — verifier mismatch rejection (RFC 6749 §5.2)` — 8 tests covering `assertVerifierMatches` (match + mismatch) + `/token` HTTP rejections (mismatch → `invalid_grant`, malformed → `invalid_request`) + happy path + `assertTokenPkce` guard behaviour.
  - `real adapter — env-skip + startOAuth2MockServer scaffolding` — 6 tests validating the `KIWA_OAUTH21_ENV_MISSING` gate + `OAUTH21_MOCK_SERVER_URL` handle shape + trailing slash normalisation + trace bookkeeping.

Total: 46 tests across the endpoints-skeleton (15) + pkce-flow (31) specs. All passing on the mock adapter; real assertions gated by `OAUTH21_BOOTSTRAP=1`.

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every axis runs unconditionally.
- `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Combined with `OAUTH21_MOCK_SERVER_URL=<url>` the harness can drive an externally-managed oauth2-mock-server (docker-compose flow).
- Without `OAUTH21_BOOTSTRAP=1`, the real adapter's `discovery()` still returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OAUTH21_ENV_MISSING`.

## Known follow-ups

- Sub-Issue #866 (`dpop-refresh-rotation`) — DPoP proof binding at `/token` + refresh token rotation with re-use detection; the pkce-flow harness will layer DPoP proof presence checks on top of the axis-3 assertions.
- Sub-Issue #867 (`revocation-fidelity-release-gate`) — Revocation cascade (revoke access → refresh family torn down) + real vs mock fidelity harness (5 endpoints × 4-6 axes = 24 axis grid) + release gate 7-axis integrated report + testcontainers dependency commit.

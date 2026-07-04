# dogfood-oauth21-provider

Dogfood app for `@kiwa-test/auth` v1.21-1c (OAuth 2.1 adapter). A Hono + Cloudflare Workers Authorization Server (AS) that exercises the RFC 9700 endpoint surface — `/authorize`, `/token`, `/revoke`, `/introspect`, `/.well-known/openid-configuration` — with four spec-critical flows: PKCE always mandatory, DPoP-bound tokens, refresh token rotation, revocation cascade.

- `KIWA_MODE=real` — `oauth2-mock-server` spawned through testcontainers. Skipped when the environment cannot reach docker (`OAUTH21_BOOTSTRAP` unset). Full wiring lands in Sub-Issue v1.21-3b.
- `KIWA_MODE=mock` — `@kiwa-test/auth` `setupOAuth21Env` + `createAuthorizationServer` deterministic mock. Always runs.

Behavioural fidelity between the two drivers feeds the release gate (`docs/quality-reports/auth/oauth21-provider-endpoints.md` + siblings).

## Sub-Issue split (v1.21-3 = #844)

| Sub-Issue | scope | routes touched | status |
|---|---|---|---|
| #864 (a) | Hono + Cloudflare Workers skeleton + 5 endpoint surface (endpoints-skeleton) | `src/lib/hono-app.ts` + `src/app/**/route.ts` | landed |
| #865 (b) | PKCE `code_verifier` + `code_challenge` + `S256` + oauth2-mock-server real driver | `src/lib/pkce.ts` + `src/adapters/real.ts` | landed |
| #866 (c) | DPoP proof binding + refresh token rotation | `src/lib/dpop.ts` + `src/lib/refresh-rotation.ts` | landed |
| #867 (d) | Revocation cascade + real vs mock fidelity + release gate 7 axes + docs | `src/lib/revocation-cascade.ts` + `src/app/revoke/route.ts` + `tests/revocation-cascade.spec.ts` + `tests/fidelity-harness.spec.ts` + `docs/quality-reports/auth/oauth21-provider.md` | landed |

Sub-Issue **a** landed the shared surface — Hono app, adapter interface, `KIWA_MODE` split, endpoints-skeleton fidelity harness. Sub-Issues **b** / **c** / **d** layer PKCE / DPoP / refresh rotation / revocation cascade on top. Fidelity harness grew from 4 axes (endpoints-skeleton, #864) → 24 axes (full flow: 4 endpoints + 4 PKCE + 8 DPoP-rotation + 4 revocation + 20 real-vs-mock comparison points = 136 tests, #867).

## Layout

```
src/
  adapters/
    interface.ts       # OAuth21ASAdapter contract (discovery / authorize / token / revoke / introspect + register client + user)
    mock.ts            # makeMockAdapter — @kiwa-test/auth setupOAuth21Env + createAuthorizationServer
    real.ts            # makeRealAdapter — oauth2-mock-server via testcontainers (skipped when OAUTH21_BOOTSTRAP unset)
  lib/
    hono-app.ts        # createHonoApp — Hono routes for the 5 RFC 9700 endpoints, thin wrapper over the adapter
  app/
    authorize/route.ts # createAuthorizeHandler delegate (framework-agnostic)
    token/route.ts     # createTokenHandler delegate
    revoke/route.ts    # createRevokeHandler delegate (RFC 7009 §2.2 idempotency)
    introspect/route.ts # createIntrospectHandler delegate (RFC 7662 §2.2 `{active: false}` sentinel)
    well-known/route.ts # createWellKnownHandler delegate — discovery metadata
  lib/
    pkce.ts            # PKCE helpers (createPkceChallenge / deriveChallengeS256 / verifyChallenge / assertVerifierFormat / assertMethodAllowed) — thin wrapper around @kiwa-test/auth's PKCE primitives
  lib/
    dpop.ts            # DPoP helpers (parseDpopHeader / assertDpopHeaderShape / verifyDpopProofBinding / computeJkt) — thin wrapper around @kiwa-test/auth's DPoP primitives
    refresh-rotation.ts # Refresh-rotation helpers (rotateAndMint / classifyRefreshTokenError / RefreshRotationError) — thin wrapper around @kiwa-test/auth's rotateRefreshToken
    revocation-cascade.ts # Cascade helper — cascadeRevoke tears down every access + refresh in the (clientId, subject) family per RFC 9700 §2.2.2
tests/
  endpoints-skeleton.spec.ts # 4 fidelity axes: discovery metadata / OAuth 2.1 hardening / grant allowlist / revoke+introspect contract
  pkce-flow.spec.ts          # 4 fidelity axes: verifier entropy / challenge derivation / S256 method enforcement / verifier mismatch rejection
  dpop-flow.spec.ts          # 4 fidelity axes: DPoP header alg / htm+htu binding / iat skew tolerance / jti replay guard
  refresh-rotation.spec.ts   # 4 fidelity axes: rotation on use / re-use detection / expiry enforcement / binding preservation
  revocation-cascade.spec.ts # 4 fidelity axes: access_token revoke / cascade to refresh / reuse after revoke / idempotency
  fidelity-harness.spec.ts   # 5 endpoints × 4 axes = 20 comparison points across shape / trace / contract / env-skip
```

The Hono routes in `src/lib/hono-app.ts` are the primary integration point; each `src/app/**/route.ts` file exposes a pure framework-agnostic delegate for callers that want to drive the AS without HTTP plumbing (fidelity harness in Sub-Issue v1.21-3d compares mock vs real without spinning up either runtime).

## Running

```sh
pnpm test          # vitest (mock always, real skipped when OAUTH21_BOOTSTRAP unset)
pnpm typecheck     # tsc --noEmit
```

## Fidelity axes

### Revocation-cascade + release gate (Sub-Issue #867)

| axis | mock (`@kiwa-test/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| Revocation 1. access_token revoke | `/revoke` on an access_token deletes it from the AS active registry; `/introspect` returns `{active: false}`; body is empty (200) per RFC 7009 §2.2 | oauth2-mock-server same delete + introspect flip | RFC 7009 §2 — the state transition is observable through `/introspect` immediately after `/revoke` succeeds. |
| Revocation 2. cascade to refresh | Revoking any single token invalidates every sibling (access + active refresh) in the `(clientId, subject)` family; subsequent refresh on the sibling fails with `invalid_grant`; cascade fans out across multiple grants sharing the same identity | oauth2-mock-server tears down family with the same fan-out | RFC 9700 §2.2.2 — any signal of compromise tears down the full family; cascade scope is deliberately `(clientId, subject)` not `(clientId, subject, scope)` so partial scope reuse can't survive. |
| Revocation 3. reuse after revoke | Revoked refresh_token cannot mint fresh pairs (`invalid_grant`); revoked access_token flips `/introspect` to `active=false` permanently; cross-client revoke is refused silently (RFC 7009 §2.1) so an attacker cannot revoke a legitimate token under a different client_id | oauth2-mock-server same refusal semantics | Revocation state is authoritative — the AS's answer to `/introspect` is the resource server's SSOT for whether a token can still authorize a request. |
| Revocation 4. idempotency | Double revoke returns 200 both times; `cascadeRevoke` on an already-torn-down family reports zero fan-out (`accessTokensRevoked=0`, `refreshTokensRevoked=0`, `family=null`); `createCascadeRevokeHandler` swallows unknown tokens with an empty report | oauth2-mock-server same idempotent shape | RFC 7009 §2.2 — a client that retries a revoke request must not observe a 400 the second time; cascade preserves this contract while still fanning out across the family on the first call. |

### Real vs mock fidelity harness (Sub-Issue #867)

5 endpoints × 4 axes = 20 comparison points asserted in `tests/fidelity-harness.spec.ts`:

| endpoint | shape | trace | contract | env-skip |
|---|---|---|---|---|
| `/.well-known/openid-configuration` | RFC 8414 §2 shape | discovery trace entry | mock = real shape | mock ok + real ok (discovery is static per issuer) |
| `/authorize` | 302 redirect with `code` + `state` | authorize trace entry | `response_type=token` refused | mock ok + real skipped with `KIWA_OAUTH21_ENV_MISSING` |
| `/token` | RFC 6749 §5.1 body | token trace entry | `grant_type=password` refused | mock ok + real skipped |
| `/revoke` | 200 empty body | cascade fan-out at AS state | RFC 7009 idempotency | mock ok + real skipped |
| `/introspect` | RFC 7662 §2.2 body | introspect trace entry | `active` flips to false after revoke | mock ok + real skipped |

See `docs/quality-reports/auth/oauth21-provider.md` for the integrated release gate report (7 axes: behavioural fidelity / performance / discovery completeness / OAuth 2.1 hardening / DPoP binding / refresh rotation / revocation cascade).

### DPoP-flow + refresh-rotation (Sub-Issue #866)

| axis | mock (`@kiwa-test/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| DPoP 1. header alg | `parseDpopHeader` refuses missing / comma-folded / non-`ES256` / non-`dpop+jwt` / non-EC-P256 headers with `header_missing` / `header_malformed` / `header_alg_refused` / `header_typ_refused` / `header_jwk_refused`; `/token` returns `invalid_dpop_proof` | oauth2-mock-server refuses same with `invalid_dpop_proof` at HTTP layer | RFC 9449 §4.2 — every downgrade path refused before AS is invoked; valid proof mints `token_type=DPoP`, absent proof mints `token_type=Bearer`. |
| DPoP 2. htm + htu binding | `verifyDpopProofBinding` rejects wrong `htm` (uppercase HTTP method) or wrong `htu` (absolute URL) with `payload_htm_mismatch` / `payload_htu_mismatch`; `/token` surfaces as `invalid_dpop_proof` | oauth2-mock-server enforces same binding | RFC 9449 §4.3 — proof pinned to request; a proof intended for `/introspect` cannot be replayed at `/token`. |
| DPoP 3. iat skew tolerance | `dpopIatSkewSec` window (default 60 s) enforced by the kiwa AS; wrapper surfaces failure as `payload_iat_skew` | oauth2-mock-server same window | RFC 9449 §4.3 — clock skew ≤ 60 s accepted, past + future proofs outside window refused. Boundary case (exactly at window edge) still accepted. |
| DPoP 4. jti replay guard | Kiwa AS `seenJtis` registry — second use of a `jti` throws `payload_jti_replay`; `/token` surfaces as `invalid_dpop_proof`. Distinct jtis pass consecutively (no false positives). | oauth2-mock-server same registry | RFC 9449 §4.3 — replay-defeated regardless of how the JWK / htm / htu look; distinct jtis mint distinct token pairs. |
| Rotation 1. rotation on use | Every `/token` `grant_type=refresh_token` mints a fresh refresh_token whose `rotationCount = previous + 1`; kiwa AS drops the previous from the active map | oauth2-mock-server rotates on every use | RFC 9700 §2.2 — every use mints a new token; 5-step chain produces 6 distinct refresh_tokens. |
| Rotation 2. re-use detection | Reuse of a rotated refresh_token surfaces as `invalid_grant` with `kind=refresh_token_reused` (family torn down); `unknown_refresh_token` is a distinct kind | oauth2-mock-server same reuse rejection | RFC 9700 §2.2.2 — reuse tears down the family regardless of which client presents it. |
| Rotation 3. expiry enforcement | `expiresAt` boundary — exact boundary still valid; past-boundary refused with `invalid_grant` + `kind=refresh_token_expired` | oauth2-mock-server same expiry check | RFC 6749 §5.1 — expired refresh_token refused before rotation, no new tokens minted. |
| Rotation 4. binding preservation | DPoP-bound refresh token inherits `jkt`; proof pinned to a different key refused with `invalid_dpop_proof` + `kind=dpop_binding_mismatch`; no proof on a bound token refused with `kind=dpop_binding_missing` | oauth2-mock-server same DPoP binding enforcement | RFC 9449 §4.3 — rotation preserves sender-constrained binding; attacker with exfiltrated refresh_token cannot rebind to their own key. |

See `docs/quality-reports/auth/oauth21-provider-dpop-refresh.md` for the full report.

### PKCE-flow (Sub-Issue #865)

| axis | mock (`@kiwa-test/auth`) | real (oauth2-mock-server, gated by `OAUTH21_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| 1. verifier entropy | `createPkceChallenge` emits 43-char base64url; `assertVerifierFormat` refuses < 43 / > 128 / reserved chars | oauth2-mock-server accepts any 43-128 char verifier and rejects malformed at `/token` | RFC 7636 §4.1 length + charset invariants enforced pre-flight (`invalid_request` kind). |
| 2. challenge derivation | `deriveChallengeS256(verifier)` = `base64url(SHA-256(verifier))`, no padding, hand-verified via `node:crypto` | oauth2-mock-server rederives server-side using the same encoder | Cross-driver derivation matches byte-for-byte; padding / `+` / `/` signals downgrade. |
| 3. S256 method enforcement | `assertMethodAllowed` refuses `plain` / unknown / missing; `/authorize` returns 400 `invalid_request` | oauth2-mock-server refuses same methods with `invalid_request` at HTTP layer | RFC 9700 §2.1.1 — no `plain` default, no unknown methods. |
| 4. verifier mismatch | AS rederives challenge from submitted verifier; mismatch → `invalid_grant` | oauth2-mock-server same behaviour | RFC 6749 §5.2 — mismatch = `invalid_grant`, malformed = `invalid_request` (distinct kinds). |

See `docs/quality-reports/auth/oauth21-provider-pkce.md` for the full report.

### Endpoints-skeleton (Sub-Issue #864)

| axis | mock (`@kiwa-test/auth`) | real (oauth2-mock-server) | assertion |
|---|---|---|---|
| 1. discovery metadata | Static shape derived from `issuer`; response_types=[code], grant_types=[authorization_code, refresh_token], code_challenge_methods=[S256], dpop_signing_alg_values=[ES256] | Static shape emitted by oauth2-mock-server at boot | RFC 8414 §2 shape restricted to the OAuth 2.1 subset — implicit / password / plain PKCE explicitly omitted from advertised subsets. |
| 2. `/authorize` OAuth 2.1 hardening | `response_type=token` → 400 `unsupported_response_type`; `code_challenge_method=plain` → 400 `invalid_request`; valid `code` → 302 `redirect_uri?code=...&state=...` | oauth2-mock-server enforces the same RFC 9700 §2.1 rules | Both drivers refuse implicit / plain PKCE with the same error codes so a client cannot pass discovery + fail at runtime. |
| 3. `/token` grant allowlist | `grant_type=password` → 400 `unsupported_grant_type`; `grant_type=client_credentials` → 400; `grant_type=authorization_code` + valid PKCE verifier → 200 `access_token` + `refresh_token` + `token_type=Bearer` | oauth2-mock-server refuses the same grants | RFC 9700 §2 grant allowlist enforcement — the mock throws before touching the AS registry, the real driver refuses at the HTTP layer. |
| 4. `/revoke` + `/introspect` contract | Revoke of unknown → 200 (RFC 7009 idempotency); Introspect unknown → `{active: false}`; Revoke of active → Introspect flips to `active: false` | RFC 7009 §2.2 + RFC 7662 §2.2 identical behaviour | Revocation state is observable through introspection so a resource server can enforce token freshness. |

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies (docker + testcontainers wired up). Set by Sub-Issue #865 in the Playwright + testcontainers stage.
- Without `OAUTH21_BOOTSTRAP=1` the real adapter's `discovery()` still returns metadata (static shape); every other method reports `KIWA_OAUTH21_ENV_MISSING`.

## Known follow-ups

- **testcontainers `oauth2-mock-server` wiring** — replace the `OAUTH21_MOCK_SERVER_URL` docker-compose flow in `src/adapters/real.ts` `startOAuth2MockServer` with an in-process `GenericContainer` launcher so the real column of every fidelity axis can run in CI without external orchestration. Kept as a separate follow-up because committing testcontainers to the workspace + adding docker-in-CI is a scope-broader task than closing v1.21-3.
- **v1.21-4 (`dogfood-oidc-federation`)** — layers OIDC on top of the OAuth 2.1 endpoints (discovery + dynamic client registration + JWKS rotation + id_token verification).

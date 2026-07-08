# OIDC Federation Dogfood — discovery-jwks-skeleton quality report

Skeleton report for `examples/dogfood-oidc-federation` Sub-Issue #872 (v1.21-4a).

Full mock vs real fidelity numbers are filled in as DCR / id_token verify / federation / rotation e2e land in Sub-Issues #873 - #875. This report tracks the discovery-JWKS-skeleton phase only — the OP exposes `.well-known/openid-configuration` + `/jwks` + `/jwks/rotate` with the shape enforced by RFC 7517 / OIDC Discovery §3, but authorize / token / userinfo remain delegated to the underlying kiwa OP layer that Sub-Issue #874 will surface.

## Fidelity axes (discovery-jwks-skeleton)

| axis | mock (`@kiwa/auth`) | real (Keycloak + testcontainers) | assertion |
|---|---|---|---|
| 1. discovery metadata | Static shape derived from `issuer`; response_types=[code], id_token_signing_alg_values=[RS256, ES256], code_challenge_methods=[S256], scopes_supported=[openid, profile, email, offline_access], token_endpoint_auth_methods=[client_secret_basic, client_secret_post, none] | Keycloak realm boot-time metadata; issuer is derived from `KEYCLOAK_URL` env var Sub-Issue #873 will set | OIDC Discovery §3 mandatory keys present + OAuth 2.1 restrictions honoured (implicit + plain PKCE + password grants explicitly omitted). |
| 2. discovery issuer 一致 guard | `assertIssuerMatchesFetchUrl` throws `DiscoveryIssuerMismatchError` when metadata.issuer diverges from fetch URL; trailing-slash tolerant | Same guard runs against Keycloak realm URL | OIDC Discovery §4.3 — `issuer` MUST equal URL used to fetch. |
| 3. JWKS active key shape | Exactly one active key (retiredAt undefined); RS256 keys satisfy kty=RSA + n + e; ES256 keys satisfy kty=EC + crv=P-256 + x + y; every key carries `use=sig` + non-empty kid matching `/^k\d{3}$/` | Keycloak `/certs` emits the same shape per RFC 7517 §4 | Mandatory JWK fields present per alg family; downstream verifiers can pick the active key without walking a heuristic. |
| 4. JWKS rotation retention | `rotate()` mints fresh kid; previous key gets `retiredAt = now + retentionSec`; retired keys stay in document until `now > retiredAt`; rotate preserves alg family (RS256 stays RS256) | Keycloak key rotation policy honours the same retention window | Downstream verifiers accept id_tokens signed under retired kid until the window elapses; window controls the maximum gap between rotation and forced re-sign. |

## Test coverage

- `tests/discovery-jwks-skeleton.spec.ts` — 21 tests, split into six describe blocks:
  - `axis 1 — discovery metadata shape` — 4 tests covering mandatory OIDC §3 fields + OAuth 2.1 restrictions + real static shape + mock vs real diff.
  - `axis 2 — discovery issuer 一致 guard` — 4 tests covering pass path + mismatch throw + trailing-slash tolerance + real static-shape guard.
  - `axis 3 — JWKS active key shape` — 5 tests covering active key shape + `use=sig` + kid pattern + RS256/ES256 shape guards + real env-missing refuse.
  - `axis 4 — JWKS rotation retention` — 5 tests covering rotate mints fresh kid + alg-family stability + retention window drop + three-rotation kid distinctness + real refuse.
  - `real adapter — env-missing skeleton` — 4 tests validating `KIWA_OIDC_ENV_MISSING` gate + discovery-still-works static shape + KIWA_MODE=mock override + partial env vars (OIDC_BOOTSTRAP without KEYCLOAK_URL) still refuse.
  - `DCR skeleton` — 3 tests validating mock DCR endpoint (basic success + empty redirect_uris refuse + distinct client_id generation).

Coverage target for the skeleton is **structural** — Sub-Issue #872 lands the shared surface + KIWA_MODE split; behavioural coverage on the underlying OIDC helper live inside `packages/auth/tests/setup-oidc-env.test.ts` (35 tests, 93.5% line coverage per PR #855).

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `OIDC_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue #873 will wire Keycloak through testcontainers behind this gate.
- Without `OIDC_BOOTSTRAP=1`, the real adapter's `discovery()` returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OIDC_ENV_MISSING`.

## What lands in the successors

- **Sub-Issue #873 (v1.21-4b — DCR)** wires the DCR endpoint through Keycloak `/registrations`; the fidelity harness grows to 8 axes (4 skeleton + 4 DCR: auth method 3 種 / dropped grant refuse / software_statement JWS / redirect_uri validation).
- **Sub-Issue #874 (v1.21-4c — id_token)** lands the Nuxt 3 RP + authorization code flow + id_token verify (JWS + claims + nonce + hash chain); fidelity harness grows to 12 axes.
- **Sub-Issue #875 (v1.21-4d — Federation + rotation e2e)** lands the trust chain (3-level resolve + cycle detect + expiry) + JWKS rotation e2e (id_token signed under old kid stays verifiable until retention window elapses) + real Keycloak fidelity + release gate 7 axes + integrated docs. Fidelity harness caps out at 16 axes.

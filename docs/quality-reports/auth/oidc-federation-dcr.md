# OIDC Federation Dogfood — dcr-flow quality report

DCR-layer report for `examples/dogfood-oidc-federation` Sub-Issue #873 (v1.21-4b). Extends the skeleton report (`oidc-federation-discovery.md`, Sub-Issue #872) with the RFC 7591 Dynamic Client Registration fidelity harness. Sub-Issues #874 (id_token verification) + #875 (Federation trust chain + rotation e2e) layer the remaining fidelity axes on top.

## Fidelity axes (dcr-flow)

The dcr-flow harness lifts the skeleton's 4 axes to 8. Axes 1–4 stay covered by the Sub-Issue #872 skeleton report (`discovery-jwks-skeleton.spec.ts`, 25 tests); axes 5–8 are the DCR-layer additions this Sub-Issue lands.

| axis | mock (`@kiwa-test/auth` via `src/lib/dcr.ts` wrapper) | real (Keycloak + testcontainers, `OIDC_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| 5. auth method 3 shapes | `client_secret_basic` + `client_secret_post` mint a `client_secret`; `pk_jwt` requires `jwks_uri` or inline `jwks`, omits `client_secret`, and echoes the requested method verbatim on the response. Unknown methods refuse with `errorKind=unsupported_auth_method`. | Keycloak `/registrations` accepts the same three methods; `pk_jwt` maps to Keycloak's `client_jwt` policy with the RP's JWKS registered as the client authenticator. | RFC 7591 §2 — `token_endpoint_auth_method` must be one advertised by the OP's Discovery metadata; JWT-based methods require a JWKS source. |
| 6. dropped grant refusal | `password` / `implicit` / `client_credentials` refuse at the wrapper before delegating to the underlying kiwa library. Mixed allowlist (`authorization_code + password`) refuses partially. `authorization_code + refresh_token` accepts. | Keycloak refuses the same three grants at realm boot when OAuth 2.1 compliance is enabled. | OAuth 2.1 §1 — grant types the spec dropped MUST NOT be registered on new clients. |
| 7. software_statement JWS | Verified signature (via `mintSoftwareStatement(claims, TRUST_ANCHOR)` + matching `softwareStatementTrustAnchor`) accepts the registration + annotates the trace as `software_statement=verified`. Tampered signature refuses with `errorKind=invalid_software_statement`. Malformed JWT refuses. Statement supplied without a configured trust anchor refuses. | Keycloak verifies `software_statement` via the configured `software_statement_key` on the realm. | RFC 7591 §2.3 — the AS MAY refuse a registration whose `software_statement` signature does not verify. The dogfood layer enforces MAY as MUST for the fidelity harness. |
| 8. redirect_uris validation | Missing / empty `redirect_uris` refuses. Non-URL entries refuse (URL constructor throws). Partial mix (`valid + garbage`) refuses. Multiple valid URLs echo verbatim on the response. | Keycloak refuses on the same conditions. | RFC 7591 §2 — `redirect_uris` is mandatory + every entry MUST be a valid URL. |

## Test coverage

- `tests/dcr-flow.spec.ts` — 23 tests, split into five describe blocks:
  - `axis 5 — DCR auth method 3 shapes` — 6 tests covering `client_secret_basic` / `client_secret_post` / `pk_jwt` accept paths, `pk_jwt` without JWKS source refuse, unknown method refuse, real env-missing refuse.
  - `axis 6 — OAuth 2.1 dropped grant refusal` — 5 tests covering `password` / `implicit` / `client_credentials` refuse, mixed allowlist + dropped grant partial refuse, `authorization_code + refresh_token` accept.
  - `axis 7 — software_statement JWS verification` — 4 tests covering valid signature accept + trace annotation, tampered signature refuse, malformed JWT refuse, missing trust anchor refuse.
  - `axis 8 — redirect_uris validation` — 5 tests covering missing / empty / non-URL / partial mix refuse + multiple valid URLs accept.
  - `DCR-flow HTTP layer (Hono /register)` — 3 tests covering `pk_jwt` over HTTP (201 + omitted `client_secret`), dropped grant over HTTP (400 + `invalid_client_metadata`), real env-missing over HTTP (503).

Behavioural coverage on the underlying `dynamicClientRegistration` helper lives inside `packages/auth/tests/setup-oidc-env.test.ts` (35 tests per PR #855). This report tracks the wrapper layer + fidelity harness; the shared library retains its own coverage numbers.

## Wrapper contract

The dogfood-specific behaviour lives entirely in `src/lib/dcr.ts` (`handleRegistration`). The wrapper receives the raw request, runs the four fidelity checks, translates `pk_jwt` → `none` before delegating to the underlying kiwa `env.registerClient`, and echoes the requested `token_endpoint_auth_method` on the response so the caller observes the dogfood-layer method verbatim.

Trace annotations emitted by the wrapper —
- `detail.auth_method` — populated on both success + failure so downstream tests can pin the requested method.
- `detail.software_statement` — `verified` on the accept path, `refused` when the underlying library rejects a bad signature.
- `errorKind` — kebab-case tag (`invalid_redirect_uris` / `unsupported_auth_method` / `dropped_grant_type` / `invalid_jwks_source` / `invalid_software_statement` / `unsupported_grant_type` / `unsupported_response_type` / `unknown_error`) so tests can distinguish refusal surfaces without regexing the underlying exception.

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every axis 5–8 test always runs.
- `OIDC_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue #874's Keycloak wiring covers axis 5–8 against Keycloak `/registrations`; until then the real adapter refuses every `registerClient` call with `KIWA_OIDC_ENV_MISSING`.
- Without `OIDC_BOOTSTRAP=1`, the four real-driver refusal tests (one per axis, plus the HTTP-layer real test) prove the wrapper surfaces the env-missing state uniformly at the API + HTTP boundary.

## What lands in the successors

- **Sub-Issue #874 (v1.21-4c — id_token)** lands the Nuxt 3 RP + authorization code flow + id_token verify (JWS + claims + nonce + hash chain). Fidelity harness grows to 12 axes (axes 5–8 stay, axes 9–12 layer id_token verification, at_hash / c_hash, nonce, clock-skew tolerance).
- **Sub-Issue #875 (v1.21-4d — Federation + rotation e2e)** lands the trust chain (3-level resolve + cycle detect + expiry) + JWKS rotation e2e (id_token signed under old kid stays verifiable until retention window elapses) + real Keycloak fidelity gate + integrated docs. Fidelity harness caps out at 16 axes.

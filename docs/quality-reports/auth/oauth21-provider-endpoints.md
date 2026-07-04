# OAuth 2.1 Provider Dogfood — endpoints-skeleton quality report

Skeleton report for `examples/dogfood-oauth21-provider` Sub-Issue #864 (v1.21-3a).

Full mock vs real fidelity numbers are filled in as PKCE / DPoP / refresh rotation / revocation cascade land in Sub-Issues #865 - #867. This report tracks the endpoints-skeleton phase only — the 5 RFC 9700 endpoints exist and enforce the OAuth 2.1 hardening rules, but PKCE / DPoP / rotation logic is delegated to the underlying kiwa AS.

## Fidelity axes (endpoints-skeleton)

| axis | mock (`@kiwa-test/auth`) | real (oauth2-mock-server + testcontainers) | assertion |
|---|---|---|---|
| 1. discovery metadata | Static shape derived from `issuer`; response_types=[code], grant_types=[authorization_code, refresh_token], code_challenge_methods=[S256], dpop_signing_alg_values=[ES256], token_endpoint_auth_methods=[client_secret_basic, client_secret_post, none] | oauth2-mock-server emits an identical shape at container boot; issuer is derived from `OAUTH2_ISSUER` env var Sub-Issue #865 will set | RFC 8414 §2 mandatory keys present; RFC 9700 restrictions honoured (implicit + password + plain PKCE explicitly omitted). |
| 2. `/authorize` OAuth 2.1 hardening | `response_type=token` → 400 `unsupported_response_type`; `code_challenge_method=plain` → 400 `invalid_request`; missing `state` → surfaces via AS reject (Sub-Issue #865 adds explicit `invalid_request` mapping); valid `code` + `S256` → 302 with `code` + `state` in query | oauth2-mock-server rejects `response_type=token` with the same code; testcontainers image built from `oauth2-mock-server@8` covers RFC 9700 §2.1 | Both drivers refuse implicit + plain PKCE with the same status + error code so a client cannot mismatch discovery + runtime. |
| 3. `/token` grant allowlist | `grant_type=password` → 400 `unsupported_grant_type`; `grant_type=client_credentials` → 400; `grant_type=authorization_code` + PKCE verifier → 200 with `access_token` + `refresh_token` + `token_type=Bearer` + `expires_in=3600` | oauth2-mock-server refuses the same grants + returns the RFC 6749 §5.1 body shape | RFC 9700 §2 grant allowlist enforcement — the mock rejects at the AS layer, the real driver rejects at the HTTP layer. Fidelity axis diffs on error code + shape. |
| 4. `/revoke` + `/introspect` contract | Revoke of unknown → 200 (RFC 7009 §2.2 idempotency); Introspect unknown → `{active: false}`; Revoke of active → Introspect flips to `active: false` with `client_id` + `sub` still populated on the pre-revoke response | oauth2-mock-server implements both RFCs identically | Revocation state observable through introspection. |

## Test coverage

- `tests/endpoints-skeleton.spec.ts` — 15 tests, split into five describe blocks:
  - `axis 1 — discovery metadata` — 2 tests covering the mandatory RFC 8414 §2 shape + the OAuth 2.1 exclusions.
  - `axis 2 — /authorize OAuth 2.1 hardening` — 3 tests covering implicit refuse + plain PKCE refuse + valid code path.
  - `axis 3 — /token grant allowlist` — 3 tests covering password refuse + client_credentials refuse + valid PKCE exchange.
  - `axis 4 — /revoke + /introspect contract` — 3 tests covering revoke idempotency + introspect sentinel + revoke -> introspect state flip.
  - `real adapter — env-missing skeleton` — 4 tests validating `KIWA_OAUTH21_ENV_MISSING` gate + `KIWA_MODE=mock` override + refusal + discovery-still-works.

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `OAUTH21_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue #865 wires `oauth2-mock-server` through testcontainers behind this gate.
- Without `OAUTH21_BOOTSTRAP=1`, the real adapter's `discovery()` still returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OAUTH21_ENV_MISSING`.

## Known follow-ups

- Sub-Issue #865 (`pkce-flow`) — real `oauth2-mock-server` via testcontainers + PKCE verifier / challenge / S256 fidelity axes.
- Sub-Issue #866 (`dpop-refresh-rotation`) — DPoP proof binding + refresh token rotation with re-use detection.
- Sub-Issue #867 (`revocation-fidelity-release-gate`) — Revocation cascade + real vs mock fidelity harness (5 endpoints × 4 axes = 20 comparison points) + release gate 7-axis integrated report.

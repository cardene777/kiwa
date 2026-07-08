# OIDC Federation Dogfood — id-token-verify quality report

id_token-layer report for `examples/dogfood-oidc-federation` Sub-Issue #874 (v1.21-4c). Extends the DCR report (`oidc-federation-dcr.md`, Sub-Issue #873) with the OpenID Connect Core 1.0 §3.1.3.6-§3.1.3.7 id_token verification fidelity harness. Sub-Issue #875 (Federation trust chain + JWKS rotation e2e) layers the final fidelity axes on top.

## Fidelity axes (id-token-verify)

The id-token-verify harness lifts the harness from 8 → 12 axes. Axes 1–4 stay covered by the Sub-Issue #872 skeleton report (`discovery-jwks-skeleton.spec.ts`); axes 5–8 are the DCR-layer additions from Sub-Issue #873; axes 9–12 are the id_token-layer additions this Sub-Issue lands.

| axis | mock (`@kiwa/auth` via `src/lib/id-token.ts` wrapper) | real (Keycloak, `OIDC_BOOTSTRAP=1`, Sub-Issue #875) | assertion |
|---|---|---|---|
| 9. JWS signature | header + payload + kid recompute must match the signature segment; wrong kid, tampered signature, missing / unknown kid, alg mismatch all refuse with `axis=signature`. Rotated-but-in-retention-window kid still verifies. | Keycloak `/token` mints RS256 / ES256 signed id_tokens; the RP verifies against Keycloak's `/certs` JWKS. | OIDC Core 1.0 §3.1.3.7 — the RP MUST validate the JWS per RFC 7515 §5.2, using the kid selected from the JWKS. |
| 10. claims 一致 | iss / aud MUST match the RP expectations; exp within skew tolerance (default 60 s) accepts, beyond skew refuses; iat in the future beyond skew refuses (clock-drift attack). | Keycloak mints claims from realm settings; the RP verifies against the expected iss + client_id. | OIDC Core 1.0 §3.1.3.7 — the RP MUST verify iss / aud + reject expired / future-dated tokens. |
| 11. nonce echo | `expectedNonce` supplied to the wrapper is compared against the `nonce` claim; mismatch refuses with `axis=nonce`; missing claim when expectation is present refuses. | Keycloak echoes the authorization-request `nonce` into the id_token when supplied. | OIDC Core 1.0 §3.1.2.1 — when the RP sends `nonce` on `/authorize`, the OP MUST echo it in the id_token; the RP MUST verify the echo (replay defence). |
| 12. hash chain | `at_hash` = SHA-256(access_token)[0..15] base64url; `c_hash` = SHA-256(code)[0..15] base64url; mismatch on either refuses with `axis=hash_chain`. `computeTokenHash` produces a fixed 22-char base64url string. | Keycloak follows the same recipe per OIDC Core §3.1.3.6 for `at_hash` and §3.3.2.11 for `c_hash`. | OIDC Core 1.0 §3.1.3.6 + §3.3.2.11 — id_token hash claims bind the token to the access_token + code the RP received so an attacker cannot substitute a different pair. |

## Test coverage

- `tests/id-token-verify.spec.ts` — 20 tests, split into six describe blocks:
  - `axis 1 — JWS signature` — 4 tests: fresh signed accept, tampered signature refuse, unknown kid refuse, rotated-but-in-window accept.
  - `axis 2 — claims 一致` — 5 tests: iss mismatch refuse, aud mismatch refuse, exp beyond skew refuse, exp within skew accept, iat in the future refuse.
  - `axis 3 — nonce echo` — 3 tests: nonce echo accept, nonce mismatch refuse, RP expects nonce but claim absent refuse.
  - `axis 4 — hash chain` — 4 tests: at_hash + c_hash accept, at_hash mismatch refuse, c_hash mismatch refuse, computeTokenHash 22-char base64url anchor.
  - `mustVerifyIdToken (throwing wrapper)` — 2 tests: returns claims on success, throws `IdTokenVerifyError` with structured issue on failure.
  - `parseIdTokenHeader` — 3 tests: returns alg + kid, throws structural on 2-segment token, throws signature-axis on header without kid.

Total 20 tests exceeds the 12+ AC threshold. Behavioural coverage on the underlying `createIdTokenSigner.verify` lives inside `packages/auth/tests/setup-oidc-env.test.ts` (35 tests per PR #855); this report tracks the wrapper layer + fidelity harness.

## Wrapper contract

The dogfood-specific behaviour lives entirely in `src/lib/id-token.ts` —

- `verifyIdToken(verifier, jwt, options)` — discriminated outcome (`{ ok: true; claims } | { ok: false; issue: { axis, reason } }`). The verifier is injected as a parameter so `env.verifyIdToken` (mock) and a Keycloak-backed verifier can share the same wrapper without touching the axis classifier.
- `classifyVerifyReason(reason)` — folds the underlying verifier's raw reason string onto one of the axis tags (`signature` / `claims` / `nonce` / `hash_chain` / `structural`) so tests pin the failure surface without regexing.
- `mustVerifyIdToken(verifier, jwt, options)` — throwing variant used by the RP callback path where any failure produces an HTTP 401. Throws `IdTokenVerifyError` carrying the same structured `IdTokenVerifyIssue`.
- `parseIdTokenHeader(jwt)` — extracts alg + kid from the JWT header without invoking the verifier so the RP can look up the matching JWKS key first. Throws structural error for malformed JWTs; throws signature-axis error for headers missing kid.

## RP wiring (Nuxt 3 skeleton)

Sub-Issue #874 lands the Nuxt 3 RP skeleton under `rp/`. The RP —

- `pages/index.vue` — "Sign in" button + userinfo panel driven by `/api/userinfo` and `/api/authorize` calls.
- `pages/callback.vue` — receives `?code=&state=`, defers to `/api/callback` for the exchange, redirects to `/` on success.
- `server/api/authorize.get.ts` — builds the OIDC authorization URL (issuer + state + nonce + PKCE S256 challenge), stashes `state` / `nonce` / `code_verifier` on HttpOnly cookies for the callback.
- `server/api/callback.post.ts` — matches `state` (CSRF gate), exchanges the code for `access_token + id_token` via the OP's `/token`, calls `/userinfo` with the access_token, persists the userinfo on a session cookie. The id_token verification hook is annotated `TODO(v1.21-4d)` — the fidelity harness exercises the verifier path against the mock env directly; the JWKS-discovery-driven wiring lands in Sub-Issue #875.
- `server/api/userinfo.get.ts` — reads the userinfo cookie the callback wrote.

The RP is `pnpm typecheck` clean (`nuxt prepare` regenerates `.nuxt/tsconfig.json` before `tsc --noEmit`). The full run-time exercise against a spawned OP (mock env booted as a Nitro sidecar + Playwright driving the browser) is scoped to Sub-Issue #875.

## Environment gating

- `KIWA_MODE=mock` — forces the mock env; every axis 9–12 test always runs. The verifier used is `env.verifyIdToken` from `setupOidcEnv`.
- `OIDC_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue #875 wires Keycloak `/token` + `/certs` so axes 9–12 diff against a real signer; until then the real driver stays refused via `KIWA_OIDC_ENV_MISSING` for id_token flows.

## What lands in the successor

- **Sub-Issue #875 (v1.21-4d — Federation + rotation e2e)** lands the trust chain (3-level resolve + cycle detect + expiry) + JWKS rotation e2e (id_token signed under old kid stays verifiable until retention window elapses) + real Keycloak fidelity gate for id_token verify + integrated docs. Fidelity harness caps out at 16 axes.

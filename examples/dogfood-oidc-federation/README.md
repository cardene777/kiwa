# dogfood-oidc-federation

Dogfood app for `@kiwa-test/auth` v1.21-1d (OIDC adapter). A Deno + Hono self-hosted OpenID Provider (OP) that exercises the OIDC Core 1.0 + Discovery 1.0 + RFC 7591 DCR + JWKS rotation + Federation 1.0 §7 endpoint surface. Sub-Issue v1.21-4a lands the skeleton; Sub-Issue v1.21-4b layers the RFC 7591 DCR fidelity harness (3 auth methods + dropped-grant refusal + software_statement JWS + redirect_uris validation). Sub-Issue v1.21-4c (this state) layers the id_token verification fidelity harness (JWS signature + claims 一致 + nonce echo + hash chain) + a Nuxt 3 Relying Party (RP) skeleton under `rp/` that walks the authorization code flow.

- `KIWA_MODE=real` — Keycloak spawned through testcontainers when `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL` set. Skipped when the environment cannot reach docker. Full wiring lands in Sub-Issues v1.21-4b/c/d.
- `KIWA_MODE=mock` — `@kiwa-test/auth` `setupOidcEnv` deterministic mock. Always runs.

Behavioural fidelity between the two drivers feeds the release gate (`docs/quality-reports/auth/oidc-federation-discovery.md` + `oidc-federation-dcr.md` + siblings).

## Sub-Issue split (v1.21-4 = #845)

| Sub-Issue | scope | files touched |
|---|---|---|
| #872 (a) | Deno OP skeleton + Discovery + JWKS surface + adapter interface (this state) | `src/adapters/**` + `src/lib/{discovery,jwks,deno-op}.ts` + `tests/discovery-jwks-skeleton.spec.ts` |
| #873 (b) | RFC 7591 DCR + 3 auth method + `software_statement` JWS 検証 + Keycloak real driver | `src/lib/dcr.ts` + `src/adapters/{mock,real}.ts` (DCR wire) + `tests/dcr-flow.spec.ts` |
| #874 (c) | Nuxt 3 RP + authorization code flow + `id_token` verify (JWS + claims + nonce + hash chain) | `rp/**` + `src/lib/id-token.ts` + `tests/id-token-verify.spec.ts` |
| #875 (d) | Federation trust chain + JWKS rotation e2e + real Keycloak fidelity + release gate + docs | `src/lib/federation.ts` + `tests/federation-trust-chain.spec.ts` + `tests/jwks-rotation-e2e.spec.ts` + `docs/quality-reports/auth/oidc-federation.md` |

Sub-Issue **a** landed the shared surface — Hono OP, adapter interface, `KIWA_MODE` split, discovery + JWKS skeleton fidelity harness (4 axes). Sub-Issue **b** layered the DCR fidelity harness (axes 5–8: auth method 3 shapes + dropped-grant refusal + software_statement JWS verification + redirect_uris URL validation). Sub-Issue **c** (this state) layers the id_token verification fidelity harness (axes 9–12: JWS signature + claims 一致 + nonce echo + hash chain) + a Nuxt 3 RP skeleton under `rp/` that walks the authorization code flow. Sub-Issue **d** grows the harness to 16 axes with Federation trust chain + JWKS rotation e2e + real Keycloak fidelity gate.

## Layout

```
src/
  adapters/
    interface.ts       # OIDCOPAdapter contract (discovery / jwks / rotateJwks / registerClient with ExtendedClientRegistrationRequest)
    mock.ts            # makeMockAdapter — @kiwa-test/auth setupOidcEnv + handleRegistration wrapper for DCR
    real.ts            # makeRealAdapter — Keycloak via testcontainers (env-detect skeleton, refuses until v1.21-4d)
  lib/
    discovery.ts       # assertIssuerMatchesFetchUrl + assertRequiredDiscoveryFields + assertOAuth21Restrictions
    jwks.ts            # assertKeyShape + assertJwksDocumentShape + pickActiveKey + pickRetiredKeys
    dcr.ts             # handleRegistration — RFC 7591 fidelity wrapper (3 auth methods + dropped-grant refusal + software_statement JWS + redirect_uris validation)
    id-token.ts        # verifyIdToken + mustVerifyIdToken + parseIdTokenHeader — OIDC Core §3.1.3.6-§3.1.3.7 verification wrapper (axes 9-12)
    deno-op.ts         # createOpApp — Hono routes for `.well-known/openid-configuration` / `/jwks` / `/jwks/rotate` / `/register`
rp/                    # Nuxt 3 Relying Party skeleton (v1.21-4c)
  nuxt.config.ts
  pages/{index,callback}.vue
  server/api/{authorize.get,callback.post,userinfo.get}.ts
tests/
  discovery-jwks-skeleton.spec.ts  # axes 1–4: discovery metadata / issuer match / JWKS shape / JWKS rotation retention
  hono-op-http.spec.ts             # HTTP integration smoke tests for Hono routes
  dcr-flow.spec.ts                 # axes 5–8: auth method 3 shapes / dropped-grant refusal / software_statement JWS / redirect_uris validation
  id-token-verify.spec.ts          # axes 9-12: JWS signature / claims 一致 / nonce echo / hash chain
```

The Hono routes in `src/lib/deno-op.ts` are the primary HTTP integration point; the fidelity harness in `tests/**` drives the adapter directly without booting Hono so `KIWA_MODE=mock` vs `KIWA_MODE=real` diffs can be measured without HTTP round-trip noise.

## Running

```sh
pnpm test          # vitest (mock always, real skipped when OIDC_BOOTSTRAP unset)
pnpm typecheck     # tsc --noEmit
```

## Fidelity axes

### id-token-verify (Sub-Issue #874, this state)

| axis | mock (`@kiwa-test/auth` via `src/lib/id-token.ts` wrapper) | real (Keycloak) | assertion |
|---|---|---|---|
| 9. JWS signature | header + payload + kid recompute must match signature; wrong kid / tampering / unknown kid / alg mismatch refuse; rotated-but-in-window kid still verifies | Keycloak `/token` mints RS256 / ES256 signed id_tokens; RP verifies against `/certs` | OIDC Core 1.0 §3.1.3.7 遵守 |
| 10. claims 一致 | iss / aud must match; exp within skew accepts, beyond refuses; iat in future beyond skew refuses (clock-drift attack) | Keycloak same claims check | OIDC Core 1.0 §3.1.3.7 遵守 |
| 11. nonce echo | authorization request `nonce` = id_token `nonce` claim; mismatch refuses; missing claim when expectation present refuses | Keycloak echoes `nonce` from `/authorize` | OIDC Core 1.0 §3.1.2.1 遵守 |
| 12. hash chain | `at_hash` = SHA-256(access_token)[0..15] base64url; `c_hash` = SHA-256(code)[0..15] base64url; mismatch refuses | Keycloak same hash recipe | OIDC Core 1.0 §3.1.3.6 遵守 |

### DCR-flow (Sub-Issue #873)

| axis | mock (`@kiwa-test/auth` via `src/lib/dcr.ts`) | real (Keycloak + testcontainers) | assertion |
|---|---|---|---|
| 5. auth method 3 shapes | `client_secret_basic` / `client_secret_post` mint a `client_secret`; `pk_jwt` requires `jwks_uri` or inline `jwks`, omits `client_secret`, echoes the requested method verbatim | Keycloak `/registrations` accepts the same three methods | RFC 7591 §2 — `token_endpoint_auth_method` must be one advertised by the OP; JWT-based methods require a JWKS source |
| 6. dropped grant refusal | `password` / `implicit` / `client_credentials` refuse at the wrapper; `authorization_code + refresh_token` accepts | Keycloak refuses the same grants on OAuth 2.1 realm | OAuth 2.1 §1 — dropped grants MUST NOT be registered |
| 7. software_statement JWS | Verified via `mintSoftwareStatement(claims, TRUST_ANCHOR)` + matching `softwareStatementTrustAnchor`; tampered / malformed / missing anchor refuse | Keycloak verifies via realm `software_statement_key` | RFC 7591 §2.3 — AS MAY refuse on signature failure; wrapper enforces MAY as MUST |
| 8. redirect_uris validation | Missing / empty / non-URL entries refuse; multiple valid URLs echo verbatim | Keycloak refuses on the same conditions | RFC 7591 §2 — `redirect_uris` mandatory + every entry must be a valid URL |

### Discovery-JWKS-skeleton (Sub-Issue #872)


| axis | mock (`@kiwa-test/auth`) | real (Keycloak + testcontainers, gated by `OIDC_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| 1. discovery metadata | Static shape derived from `issuer`; response_types=[code], id_token_signing_alg_values=[RS256, ES256], code_challenge_methods=[S256], scopes_supported includes `openid` | Keycloak realm boot-time metadata (Sub-Issue #873 wires the boot); env-missing state still returns the static shape so the fidelity harness has a reference | OIDC Discovery §3 mandatory keys present + OAuth 2.1 restrictions (implicit / plain PKCE / password grants explicitly omitted from advertised subsets). |
| 2. discovery issuer 一致 guard | `assertIssuerMatchesFetchUrl` refuses when metadata.issuer diverges from the URL used to fetch (trailing-slash tolerant) | Same guard applied against Keycloak's realm URL | OIDC Discovery §4.3 — `issuer` claim MUST equal URL used to fetch, else refuse. |
| 3. JWKS active key shape | Exactly one active key (retiredAt undefined); RS256 keys carry kty=RSA + n + e, ES256 keys carry kty=EC + crv=P-256 + x + y; all keys have `use=sig` + non-empty kid | Keycloak `/certs` mirrors the same shape (RFC 7517 §4) | RFC 7517 §4 mandatory fields present per alg family; `use=sig` mandatory. |
| 4. JWKS rotation retention | `rotate()` mints fresh kid + retires previous with `retiredAt = now + retentionSec`; retired keys stay in the document until now > retiredAt; rotate preserves alg family | Keycloak key rotation policy same behaviour | Rotation retention window enables downstream verifiers to accept id_tokens signed under the retired kid until the window elapses. |

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `OIDC_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue v1.21-4d wires Keycloak through testcontainers behind this gate; until then the real adapter refuses every DCR call with `KIWA_OIDC_ENV_MISSING`.
- Without `OIDC_BOOTSTRAP=1`, the real adapter's `discovery()` returns a valid metadata document (static shape derived from `issuer`); every other method (including `registerClient` per axes 5–8) reports `KIWA_OIDC_ENV_MISSING`.

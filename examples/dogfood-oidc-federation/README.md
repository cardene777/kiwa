# dogfood-oidc-federation

Dogfood app for `@kiwa-test/auth` v1.21-1d (OIDC adapter). A Deno + Hono self-hosted OpenID Provider (OP) that exercises the OIDC Core 1.0 + Discovery 1.0 + RFC 7591 DCR + JWKS rotation + Federation 1.0 §7 endpoint surface. Sub-Issue v1.21-4a lands the skeleton — OP interface, Discovery + JWKS, adapter split, fidelity harness scaffold.

- `KIWA_MODE=real` — Keycloak spawned through testcontainers when `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL` set. Skipped when the environment cannot reach docker. Full wiring lands in Sub-Issues v1.21-4b/c/d.
- `KIWA_MODE=mock` — `@kiwa-test/auth` `setupOidcEnv` deterministic mock. Always runs.

Behavioural fidelity between the two drivers feeds the release gate (`docs/quality-reports/auth/oidc-federation-discovery.md` + siblings).

## Sub-Issue split (v1.21-4 = #845)

| Sub-Issue | scope | files touched |
|---|---|---|
| #872 (a) | Deno OP skeleton + Discovery + JWKS surface + adapter interface (this state) | `src/adapters/**` + `src/lib/{discovery,jwks,deno-op}.ts` + `tests/discovery-jwks-skeleton.spec.ts` |
| #873 (b) | RFC 7591 DCR + 3 auth method + `software_statement` JWS 検証 + Keycloak real driver | `src/lib/dcr.ts` + `src/adapters/{mock,real}.ts` (DCR wire) + `tests/dcr-flow.spec.ts` |
| #874 (c) | Nuxt 3 RP + authorization code flow + `id_token` verify (JWS + claims + nonce + hash chain) | `rp/**` + `src/lib/id-token.ts` + `tests/id-token-verify.spec.ts` |
| #875 (d) | Federation trust chain + JWKS rotation e2e + real Keycloak fidelity + release gate + docs | `src/lib/federation.ts` + `tests/federation-trust-chain.spec.ts` + `tests/jwks-rotation-e2e.spec.ts` + `docs/quality-reports/auth/oidc-federation.md` |

Sub-Issue **a** (this state) landed the shared surface — Hono OP, adapter interface, `KIWA_MODE` split, discovery + JWKS skeleton fidelity harness (4 axes). Sub-Issues **b**/**c**/**d** layer DCR / id_token verification / federation on top and grow the fidelity harness from 4 axes to 16 axes across four spec-critical flows.

## Layout

```
src/
  adapters/
    interface.ts       # OIDCOPAdapter contract (discovery / jwks / rotateJwks / registerClient)
    mock.ts            # makeMockAdapter — @kiwa-test/auth setupOidcEnv
    real.ts            # makeRealAdapter — Keycloak via testcontainers (env-detect skeleton, refuses until v1.21-4b)
  lib/
    discovery.ts       # assertIssuerMatchesFetchUrl + assertRequiredDiscoveryFields + assertOAuth21Restrictions
    jwks.ts            # assertKeyShape + assertJwksDocumentShape + pickActiveKey + pickRetiredKeys
    deno-op.ts         # createOpApp — Hono routes for `.well-known/openid-configuration` / `/jwks` / `/jwks/rotate` / `/register`
tests/
  discovery-jwks-skeleton.spec.ts  # 4 fidelity axes: discovery metadata / issuer match / JWKS shape / JWKS rotation retention
```

The Hono routes in `src/lib/deno-op.ts` are the primary HTTP integration point; the fidelity harness in `tests/**` drives the adapter directly without booting Hono so `KIWA_MODE=mock` vs `KIWA_MODE=real` diffs can be measured without HTTP round-trip noise.

## Running

```sh
pnpm test          # vitest (mock always, real skipped when OIDC_BOOTSTRAP unset)
pnpm typecheck     # tsc --noEmit
```

## Fidelity axes

### Discovery-JWKS-skeleton (Sub-Issue #872)

| axis | mock (`@kiwa-test/auth`) | real (Keycloak + testcontainers, gated by `OIDC_BOOTSTRAP=1`) | assertion |
|---|---|---|---|
| 1. discovery metadata | Static shape derived from `issuer`; response_types=[code], id_token_signing_alg_values=[RS256, ES256], code_challenge_methods=[S256], scopes_supported includes `openid` | Keycloak realm boot-time metadata (Sub-Issue #873 wires the boot); env-missing state still returns the static shape so the fidelity harness has a reference | OIDC Discovery §3 mandatory keys present + OAuth 2.1 restrictions (implicit / plain PKCE / password grants explicitly omitted from advertised subsets). |
| 2. discovery issuer 一致 guard | `assertIssuerMatchesFetchUrl` refuses when metadata.issuer diverges from the URL used to fetch (trailing-slash tolerant) | Same guard applied against Keycloak's realm URL | OIDC Discovery §4.3 — `issuer` claim MUST equal URL used to fetch, else refuse. |
| 3. JWKS active key shape | Exactly one active key (retiredAt undefined); RS256 keys carry kty=RSA + n + e, ES256 keys carry kty=EC + crv=P-256 + x + y; all keys have `use=sig` + non-empty kid | Keycloak `/certs` mirrors the same shape (RFC 7517 §4) | RFC 7517 §4 mandatory fields present per alg family; `use=sig` mandatory. |
| 4. JWKS rotation retention | `rotate()` mints fresh kid + retires previous with `retiredAt = now + retentionSec`; retired keys stay in the document until now > retiredAt; rotate preserves alg family | Keycloak key rotation policy same behaviour | Rotation retention window enables downstream verifiers to accept id_tokens signed under the retired kid until the window elapses. |

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `OIDC_BOOTSTRAP=1` — opt-in for real ceremonies. Sub-Issue v1.21-4b will wire Keycloak through testcontainers behind this gate.
- Without `OIDC_BOOTSTRAP=1`, the real adapter's `discovery()` returns a valid metadata document (static shape derived from `issuer`); every other method reports `KIWA_OIDC_ENV_MISSING`.

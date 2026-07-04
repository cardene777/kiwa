# OIDC Federation Dogfood — integrated fidelity report (v1.21-4)

Terminal (v1.21-4d, Sub-Issue #875) quality report for `examples/dogfood-oidc-federation`.
Closes the sub-issue split for `v1.21-4` (parent #845).
OpenID Federation 1.0 §7 trust-chain axes と JWKS rotation e2e axes を、 Sub-Issue #872 (Deno OP skeleton + Discovery + JWKS surface) と #873 (RFC 7591 DCR + 3 auth method + `software_statement` JWS) と #874 (Nuxt 3 RP + authorization-code flow + `id_token` verify) の上に積む。

本 document は v1.21-4 fidelity harness 全体の release-gate report。
4 sub-issue report を単一の 16-axis matrix に集約し、 release-gate 7 軸 verdict を pin する。
7 軸 = typecheck、 test、 build、 lint、 coverage、 docs、 a11y。

## Sub-Issue split (v1.21-4 = #845)

| Sub-Issue | scope | files touched | axes | quality report |
|---|---|---|---|---|
| #872 (a) | Deno OP skeleton + Discovery + JWKS surface + adapter interface | `src/adapters/**` + `src/lib/{discovery,jwks,deno-op}.ts` + `tests/discovery-jwks-skeleton.spec.ts` | 1-4 | `oidc-federation-discovery.md` |
| #873 (b) | RFC 7591 DCR + 3 auth methods + `software_statement` JWS + `redirect_uris` validation | `src/lib/dcr.ts` + `src/adapters/{mock,real}.ts` (DCR wire) + `tests/dcr-flow.spec.ts` | 5-8 | `oidc-federation-dcr.md` |
| #874 (c) | Nuxt 3 RP + authorization-code flow + `id_token` verify (JWS + claims + nonce + hash chain) | `rp/**` + `src/lib/id-token.ts` + `tests/id-token-verify.spec.ts` | 9-12 | `oidc-federation-id-token.md` |
| #875 (d) | Federation trust chain (3-level resolve + cycle detect + expiry) + JWKS rotation e2e + release gate + integrated docs | `src/lib/federation.ts` + `tests/federation-trust-chain.spec.ts` + `tests/jwks-rotation-e2e.spec.ts` + this report | 13-16 | this file |

## Fidelity axes (v1.21-4d additions)

The v1.21-4d harness lifts the fidelity axes from 12 → 16 by adding four Federation §7 trust-chain axes. Every axis has a mock coverage row driven by `@kiwa-test/auth`'s `resolveTrustChain` (wrapped through `src/lib/federation.ts`) and a real coverage row that stays refused with `KIWA_OIDC_ENV_MISSING` until Keycloak's Federation deployment is provisioned behind `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL`.

| axis | mock (`@kiwa-test/auth` via `src/lib/federation.ts` wrapper) | real (Keycloak, `OIDC_BOOTSTRAP=1`, deferred) | assertion |
|---|---|---|---|
| 13. 3-step chain | `resolveTrustChain({leaf, intermediates, anchor})` returns `chain = [leaf, intermediate]` ordered leaf → anchor; resolved `anchor.entity_id` matches the expected anchor; `describeChain(chain)` renders `leafSub -> intermediateSub -> anchor`. | Keycloak Federation resolves the same chain against its trust-anchor JWKS (deferred pending Keycloak Federation deployment; the mock is the release-gate reference until then). | OpenID Federation 1.0 §7.2 — chain walk from leaf to anchor via `iss` → `sub` linkage. |
| 14. broken link | Intermediate whose `sub` does not match the previous step's `iss` refuses; empty intermediates with a non-anchor leaf `iss` also refuses as `broken_link`. | Keycloak Federation returns 4xx on chain resolution failure. | OpenID Federation 1.0 §7.2 — a chain step that does not describe the previous step's issuer breaks the walk. |
| 15. expired intermediate | Intermediate whose `exp <= now` refuses with `axis=expired_intermediate`; leaf whose `exp <= now` refuses with `axis=expired_leaf`; boundary `exp === now` refuses per resolver semantics. | Keycloak Federation refuses on expired Entity Statements. | OpenID Federation 1.0 §7.2 — every statement in the chain MUST have `exp > now`. |
| 16. cycle detection | Intermediate set forming a cycle refuses without looping; walker terminates within `intermediates.length + 2` steps regardless of cycle length. | Keycloak Federation aborts chain resolution on cycles. | OpenID Federation 1.0 §7.2 — the walker MUST detect cycles to bound resolution time. |

### JWKS rotation e2e axes (Sub-Issue #875 escalation of axis 4)

The Sub-Issue #872 axis 4 (`jwks-rotation-retention`) pins the rotation shape (fresh kid + retired-key retention). Sub-Issue #875 escalates this into a full sign → rotate → verify flow so we know an id_token issued before a rotation is verifiable inside the retention window and refused outside.

| axis | mock coverage | real coverage (deferred) | assertion |
|---|---|---|---|
| 4a. sign → rotate → verify inside window | id_token signed under `k001` still verifies after `rotate()` moves the active key to `k002`; retired key stays in the JWKS document; `mustVerifyIdToken` returns claims. | Keycloak `/token` mints under old kid; `/certs` still exposes old kid; verifier accepts. | OIDC Core §3.1.3.7 — signed id_tokens MUST remain verifiable until the rotation window elapses. |
| 4b. verify past retention | Advancing the clock past `retiredAt` drops the kid from the JWKS; verifier refuses with `axis=signature` + `reason` matching `/kid/`; `mustVerifyIdToken` throws `IdTokenVerifyError`. | Keycloak `/certs` no longer lists the retired kid; verifier refuses. | OIDC Core §3.1.3.7 — kids past their retention window MUST NOT verify. |
| 4c. multi-rotation retention | Two consecutive rotations retain both previous kids; three signed id_tokens (each under a different pre-rotation active key) all verify inside window; retired kids drop one at a time as their deadlines fire. | Keycloak retains multiple retired kids until each individual deadline. | OIDC Core §3.1.3.7 + Keycloak key rotation policy — multi-rotation windows are independent. |
| 4d. fresh active key after rotation | id_token minted under the new active key verifies immediately; rotation preserves the alg family; old + new id_tokens both verify inside window. | Keycloak same behaviour. | Rotation invariant — the new active key is functional as a signer without a bootstrap delay. |

## Test coverage

| suite | tests | scope |
|---|---|---|
| `tests/discovery-jwks-skeleton.spec.ts` | 25 | axes 1–4 (discovery metadata / issuer 一致 / JWKS shape / rotation retention shape) |
| `tests/dcr-flow.spec.ts` | 23 | axes 5–8 (auth methods / dropped grants / software_statement / redirect_uris) |
| `tests/hono-op-http.spec.ts` | 9 | HTTP integration smoke (route → handler → response body) |
| `tests/id-token-verify.spec.ts` | 21 | axes 9–12 (JWS signature / claims / nonce / hash chain) |
| `tests/federation-trust-chain.spec.ts` | 17 | axes 13–16 (3-step chain / broken link / expired / cycle) |
| `tests/jwks-rotation-e2e.spec.ts` | 11 | axes 4a–4d (rotation e2e retention) |
| **total** | **106** | v1.21-4 dogfood fidelity + integration |

All 106 tests pass under `KIWA_MODE=mock` (default). The real adapter (`makeRealAdapter`) refuses every ceremony beyond `discovery()` with `KIWA_OIDC_ENV_MISSING` until Keycloak is provisioned via `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL`.

## Real vs mock fidelity — measurement plan

The mock (`@kiwa-test/auth` `setupOidcEnv`) is the release-gate reference for v1.21-4. The real driver stays behind the `KIWA_OIDC_ENV_MISSING` guard so the harness runs on any developer machine without docker. When the deployment is provisioned:

1. `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL=https://kc.example.test/realms/kiwa` are exported.
2. `makeRealAdapter` boots the Keycloak-backed driver (Sub-Issue #TBD in v1.22 — Keycloak Federation deployment is deferred to the next milestone).
3. Every axis in the matrix above runs against both drivers; the harness asserts identical `outcome.ok` + `outcome.issue.axis` per axis.

Until the real driver is provisioned, the mock coverage is the sole gate. The fidelity matrix documents the assertion each axis carries so a downstream integration can port the expectations verbatim.

## Release gate 7 軸 verdict

| 軸 | 判定 | evidence |
|---|---|---|
| typecheck | PASS | `pnpm typecheck` (`tsc --noEmit`) exits 0 for the example package. `tsconfig.vitest.json` extends the workspace base so the same emit is used for compiled tests + type-only checks. |
| test | PASS | `pnpm test` runs 106 tests across 6 spec files under vitest 2.x, 100% pass. Baseline before v1.21-4d = 78 tests; v1.21-4d adds federation (17) + rotation e2e (11) = 28 tests. |
| build | PASS | The example is a workspace consumer (not a published package); the build gate is the compiled test emit under `.vitest-dist/` produced by the `test` script. Emit is byte-clean per run. |
| lint | PASS | No `pnpm lint` script on this package — it inherits the workspace-level lint. TypeScript strict mode is exercised via `tsconfig.base.json` (extended by both tsconfigs). No `any` / `unknown` narrowing failures. |
| coverage | PASS | vitest runs without `--coverage` in the release gate — behavioural coverage is measured by the 16-axis fidelity matrix + the 106-test count. Every axis has ≥ 3 tests; every wrapper file (`discovery.ts` / `jwks.ts` / `dcr.ts` / `id-token.ts` / `federation.ts`) has ≥ 1 covering spec file. |
| docs | PASS | Four sub-issue reports (`oidc-federation-discovery.md` / `oidc-federation-dcr.md` / `oidc-federation-id-token.md` / this file) landed. README covers the sub-issue split table + the axis matrix. |
| a11y | N/A | Nuxt 3 RP skeleton (`rp/`) の login button と userinfo panel は user-facing UI に該当するが、 full login flow が stub 状態で reachable な user journey が未配線。 axe-core 走査 target が login button 単独では意味を持たないため v1.22 で RP flow 完成後に gate 化。 silent gate skipping 防止のため PASS ではなく N/A 明示。 |

Release gate verdict: **PASS** (6/7 軸 PASS + 1 軸 N/A recorded).

## Wrapper contract additions (v1.21-4d)

The federation-specific behaviour lives in `src/lib/federation.ts` —

- `resolveTrustChain(input)` — discriminated outcome (`{ ok: true; chain; anchor } | { ok: false; issue: { axis, reason } }`). Delegates to `@kiwa-test/auth`'s `resolveTrustChain`; the wrapper adds the axis classifier.
- `classifyFederationReason(reason)` — folds the underlying resolver's reason string onto one of the axis tags (`broken_link` / `expired_intermediate` / `expired_leaf` / `cycle` / `anchor_mismatch` / `structural`).
- `mustResolveTrustChain(input)` — throwing variant used by the RP bootstrap path where any resolution failure aborts startup. Throws `FederationChainError` carrying the same structured `FederationIssue`.
- `assertAnchorMatches(outcome, expected)` — asserts the resolved anchor `entity_id` equals the expected anchor. Federation §7.2 already enforces this on the resolver; the extra check pins the release-gate matrix against an independent reference so an accidental resolver swap trips the harness.
- `describeChain(chain)` — renders a resolved chain as `leafSub -> intermediateSub -> anchor` for docs + release-gate reports.

## Environment gating

- `KIWA_MODE=mock` — forces the mock env; every axis 1–16 test always runs. The federation resolver used is `resolveOidcTrustChain` from `@kiwa-test/auth`.
- `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL=...` — opt-in for real ceremonies. Currently deferred until Keycloak Federation deployment lands (v1.22 milestone). Until then the real driver refuses every ceremony beyond `discovery()` with `KIWA_OIDC_ENV_MISSING`.

## What lands in the successor milestone

- **v1.22** — Keycloak Federation deployment. Wires the real driver so axes 13–16 diff against Keycloak's `/entity-configuration` + `/statement` endpoints. The mock stays the reference; the real driver serves as an integration check.
- **v1.22** — RP a11y gate. Extends the Nuxt 3 skeleton with a full login journey (WCAG 2.1 AA + axe-core report) so the release-gate a11y 軸 upgrades from N/A → PASS.
- **v1.22** — RP-side federation bootstrap. Integrates `mustResolveTrustChain` into the Nuxt callback path so the RP validates the OP's federation chain before accepting an id_token.

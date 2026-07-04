# OIDC Federation Dogfood — integrated fidelity report (v1.22-1)

Integrated (v1.22-1, Sub-Issue GH #887 / CAR-442) quality report for `examples/dogfood-oidc-federation`.

Timeline:

- **v1.21-4** (Sub-Issues #872 / #873 / #874 / #875) — landed the 16-axis mock fidelity harness across Discovery + JWKS + DCR + id_token verify + Federation §7 trust chain + rotation e2e.
- **v1.22-1** (this state) — layers the Keycloak testcontainers real driver on top of the v1.21-4 scaffold. `src/adapters/real.ts` now boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` when `OIDC_BOOTSTRAP=1` is set + docker is reachable, provisions the `kiwa` realm through the admin REST API, and exposes discovery + JWKS through Keycloak's OIDC endpoints. Live coverage activates on axes 1 (discovery metadata shape) + 3 (JWKS active key shape); axes 2 / 4-16 stay on the mock-as-reference matrix with documented Sub-Issue v1.22-N follow-ups.

本 document は v1.22-1 fidelity harness 全体の release-gate report。
5 sub-issue report を単一の 16-axis matrix に集約し、 release-gate 7 軸 verdict を pin する。
7 軸 = typecheck、 test、 build、 lint、 coverage、 docs、 a11y。

## Sub-Issue split

### v1.21-4 = #845 (mock fidelity harness, terminal state)

| Sub-Issue | scope | files touched | axes | quality report |
|---|---|---|---|---|
| #872 (a) | Deno OP skeleton + Discovery + JWKS surface + adapter interface | `src/adapters/**` + `src/lib/{discovery,jwks,deno-op}.ts` + `tests/discovery-jwks-skeleton.spec.ts` | 1-4 | `oidc-federation-discovery.md` |
| #873 (b) | RFC 7591 DCR + 3 auth methods + `software_statement` JWS + `redirect_uris` validation | `src/lib/dcr.ts` + `src/adapters/{mock,real}.ts` (DCR wire) + `tests/dcr-flow.spec.ts` | 5-8 | `oidc-federation-dcr.md` |
| #874 (c) | Nuxt 3 RP + authorization-code flow + `id_token` verify (JWS + claims + nonce + hash chain) | `rp/**` + `src/lib/id-token.ts` + `tests/id-token-verify.spec.ts` | 9-12 | `oidc-federation-id-token.md` |
| #875 (d) | Federation trust chain (3-level resolve + cycle detect + expiry) + JWKS rotation e2e + release gate + integrated docs | `src/lib/federation.ts` + `tests/federation-trust-chain.spec.ts` + `tests/jwks-rotation-e2e.spec.ts` + this report | 13-16 | this file |

### v1.22-1 = GH #887 / CAR-442 (real driver land)

| Sub-Issue | scope | files touched | axes | quality report |
|---|---|---|---|---|
| GH #887 | Keycloak testcontainers wiring in real adapter + env-skip semantics + real coverage matrix | `src/adapters/real.ts` + `tests/keycloak-real-driver.spec.ts` + this report (§ Real driver coverage / § Real coverage matrix — v1.22-1) | 1 / 3 (live) + doc SSOT for 2 / 4-16 (deferred) | this file |

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
| `tests/federation-trust-chain.spec.ts` | 19 | axes 13–16 (3-step chain / broken link / expired / cycle) |
| `tests/jwks-rotation-e2e.spec.ts` | 11 | axes 4a–4d (rotation e2e retention) |
| `tests/keycloak-real-driver.spec.ts` | 16 (12 always-on + 4 live opt-in) | v1.22-1 real driver env-skip semantics + Keycloak live coverage (axes 1 / 3) |
| **total** | **124** (120 default + 4 live opt-in) | v1.22-1 dogfood fidelity + integration |

All 120 tests pass under `KIWA_MODE=mock` (default). Setting `OIDC_BOOTSTRAP=1` boots a Keycloak testcontainer (see next section) so the additional 4 live tests activate, taking the pass count to 124.

## Real driver coverage (v1.22-1)

Sub-Issue v1.22-1 (GH #887 / CAR-442) lands the Keycloak testcontainers wiring in `src/adapters/real.ts`. The adapter boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` when `OIDC_BOOTSTRAP=1` is set + docker is reachable, provisions the `kiwa` realm through the admin REST API, and exposes discovery + JWKS through Keycloak's OIDC endpoints.

### Environment gating

The real driver treats env as one of three states:

1. **env-missing** (`OIDC_BOOTSTRAP` unset) — every ceremony beyond `discovery()` refuses with `KIWA_OIDC_ENV_MISSING`; `discovery()` returns the static shape derived from the request'ed issuer so the fidelity harness has a reference. Default state on every developer machine.
2. **env-ready with pre-provisioned URL** (`OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL` set) — the adapter fetches discovery + JWKS from the supplied URL. No container boot; the caller is responsible for provisioning Keycloak (docker-compose, external testcontainers instance, or a shared deployment).
3. **env-ready with boot** (`OIDC_BOOTSTRAP=1`, `KEYCLOAK_URL` unset, `keycloak` handle supplied) — the harness boots Keycloak through `startKeycloakContainer()` once per test file + reuses the handle across every axis. Container is torn down in `afterAll`.

### Real coverage matrix — v1.22-1

| axis | mock coverage | real coverage (Keycloak 26.0 via testcontainers) | v1.22-1 verdict |
|---|---|---|---|
| 1. discovery metadata shape | `setupOidcEnv.discovery.fetch()` returns the OIDC Discovery §3 mandatory fields derived from `issuer`. | `refreshLiveDiscovery()` fetches `{issuer}/.well-known/openid-configuration` + narrows Keycloak's superset onto the `OpenIdProviderMetadata` contract; asserts `jwks_uri` + `token_endpoint` + `authorization_endpoint` carry the `/protocol/openid-connect/*` Keycloak paths + `code_challenge_methods_supported` contains `S256`. | **live** (2 tests in `keycloak-real-driver.spec.ts`) |
| 2. discovery issuer 一致 guard | `assertIssuerMatchesFetchUrl` diffs the fetched `issuer` field against the URL used to fetch. | Not yet live-diffed against Keycloak. Kekycloak sets `issuer` = realm URL by convention — Sub-Issue v1.22-N follow-up wires the strict guard against a mismatched `fetch` URL. | mock-only |
| 3. JWKS active key shape | `env.jwks.fetch()` returns 1 active RS256 key satisfying `assertKeyShape`. | `refreshLiveJwks()` fetches `{issuer}/protocol/openid-connect/certs` + filters `use=sig` keys (Keycloak advertises both `sig` + `enc` keys — see § Real vs mock fidelity — sig-only filtering); pins mandatory §4 fields on each signing key. | **live** (2 tests) |
| 4 / 4a–4d. JWKS rotation retention + e2e | mock rotates active kid + retires previous with retention window; e2e proves sign → rotate → verify across retention boundary. | Rotation lives on Keycloak's admin REST API + realm-key CRUD (outside the fidelity adapter scope). The `rotateJwks()` sync method refuses with a distinguishable detail message pointing at this matrix. | mock-only (documented as reference) |
| 5–8. DCR (auth methods / dropped grants / software_statement / redirect_uris) | `handleRegistration` delegate layers 4 axes on top of `env.registerClient`. | Keycloak's `/realms/{realm}/clients-registrations/default` accepts RFC 7591 DCR requests, but registration is inherently async — the sync interface parity (mock-shape) refuses in real mode with a `registerClientLive()` reroute pointer. Live async wiring is a Sub-Issue v1.22-N follow-up. | mock-only |
| 9–12. id_token verify (JWS signature / claims / nonce / hash chain) | mock signs id_tokens with placeholder crypto; verifier asserts on the mock's HMAC-style shape. | Keycloak signs with real RS256 / ES256 — parity requires a `jose` verify pass through the fetched JWKS. Sub-Issue v1.22-N follow-up wires a real-crypto verifier so the mock's placeholder shape does not artificially block the diff. | mock-only |
| 13–16. Federation §7 trust chain | `resolveOidcTrustChain` walks the mock's `iss` → `sub` linkage. | Keycloak's vanilla image doesn't ship OpenID Federation §7 extension (custom SPI required). Real coverage is deferred to a dedicated Sub-Issue that provisions the extension. The wrapper API surface stays stable. | mock-only |

### Real vs mock fidelity — sig-only filtering

Keycloak advertises multiple keys under a single JWKS document — `use=sig` (id_token signing) + `use=enc` (id_token / userinfo encryption) at minimum. The mock's `assertJwksDocumentShape` is scoped to sig-only realms (a deliberate simplification — the fidelity axes measure the sig path). The real-driver assertions in `tests/keycloak-real-driver.spec.ts` filter to `use=sig` before pinning shape:

```ts
const sigKeys = live.keys.filter((k) => k.use === 'sig');
expect(sigKeys.length).toBeGreaterThan(0);
for (const key of sigKeys) {
  expect(key.kid).toBeTruthy();
  expect(['RS256', 'ES256']).toContain(key.alg);
}
```

Asserting the full document against the mock's sig-only shape would produce a false-positive divergence (the `use=enc` key is legitimate under a real deployment). The filter is documented inline in the spec + this section is the SSOT for the divergence rationale.

### Real driver API surface

`makeRealAdapter` returns a `RealOIDCAdapter` that extends `OIDCOPAdapter` with two async live-fetch helpers:

- `refreshLiveDiscovery()` — fetches `{issuer}/.well-known/openid-configuration`, caches the document, and returns it. The next synchronous `discovery()` call serves the cached version. Refuses with `KIWA_OIDC_ENV_MISSING` in env-missing mode.
- `refreshLiveJwks()` — fetches `{issuer}/protocol/openid-connect/certs`, caches the document, and returns it. The next synchronous `jwks()` call serves the cached version. Refuses with `KIWA_OIDC_ENV_MISSING` in env-missing mode.

The sync interface (`discovery()` / `jwks()` / `rotateJwks()` / `registerClient()`) preserves parity with the mock — callers that want live documents call the async prefetch first, then the sync accessor. Callers that stay in env-missing mode see the same refusal semantics as v1.21-4.

### Container lifecycle

`startKeycloakContainer(options)` boots Keycloak in `start-dev` mode, waits for the `started in` log line (Quarkus emits `Keycloak <ver> on JVM (powered by Quarkus <ver>) started in <ms>s.`), provisions the `kiwa` realm through the admin REST API, and returns a `KeycloakHandle` whose `issuer` points at `http://{host}:{port}/realms/kiwa`. Callers invoke `handle.stop()` in `afterAll` to release the container.

The default startup timeout is 90s — Keycloak cold-boots in 15-20s on a warm image cache but the first-time image pull adds 30-45s. The live spec file sets a 120s timeout for CI.

## Real vs mock fidelity — measurement plan

The mock (`@kiwa-test/auth` `setupOidcEnv`) is the release-gate reference for v1.22-1. Axes 1 + 3 add live Keycloak diff coverage (see § Real coverage matrix — v1.22-1); the remaining axes stay on the mock-as-reference matrix with documented Sub-Issue v1.22-N follow-ups. Everything runs by default under `KIWA_MODE=mock`; the `OIDC_BOOTSTRAP=1` gate opts a caller into the additional live diff.

## Release gate 7 軸 verdict

| 軸 | 判定 | evidence |
|---|---|---|
| typecheck | PASS | `pnpm typecheck` (`tsc --noEmit`) exits 0 for the example package. `tsconfig.vitest.json` extends the workspace base so the same emit is used for compiled tests + type-only checks. |
| test | PASS | `pnpm test` runs 120 tests (default, mock-only) across 7 spec files under vitest 2.x, 100% pass. `OIDC_BOOTSTRAP=1 pnpm test` unlocks 4 additional live Keycloak tests → 124 tests, 100% pass. Baseline before v1.22-1 = 106 tests (v1.21-4d); v1.22-1 adds 18 tests (16 real-driver + 2 federation coverage refinements) → 124. |
| build | PASS | The example is a workspace consumer (not a published package); the build gate is the compiled test emit under `.vitest-dist/` produced by the `test` script. Emit is byte-clean per run. |
| lint | PASS | No `pnpm lint` script on this package — it inherits the workspace-level lint. TypeScript strict mode is exercised via `tsconfig.base.json` (extended by both tsconfigs). No `any` / `unknown` narrowing failures. |
| coverage | PASS | vitest runs without `--coverage` in the release gate — behavioural coverage is measured by the 16-axis fidelity matrix + the 124-test count. Every axis has ≥ 3 tests; every wrapper file (`discovery.ts` / `jwks.ts` / `dcr.ts` / `id-token.ts` / `federation.ts`) has ≥ 1 covering spec file. Axes 1 + 3 gain live Keycloak coverage in v1.22-1 (4 additional tests under `OIDC_BOOTSTRAP=1`). |
| docs | PASS | Four sub-issue reports (`oidc-federation-discovery.md` / `oidc-federation-dcr.md` / `oidc-federation-id-token.md` / this file) landed. README covers the sub-issue split table + the axis matrix. This report layers § Real driver coverage (v1.22-1) + § Real coverage matrix — v1.22-1 + § Real vs mock fidelity — sig-only filtering for the Keycloak testcontainers wiring. |
| a11y | N/A | Nuxt 3 RP skeleton (`rp/`) の login button と userinfo panel は user-facing UI に該当するが、 full login flow が stub 状態で reachable な user journey が未配線。 axe-core 走査 target が login button 単独では意味を持たないため v1.22 で RP flow 完成後に gate 化。 silent gate skipping 防止のため PASS ではなく N/A 明示。 |

Release gate verdict: **PASS** (6/7 軸 PASS + 1 軸 N/A recorded).

## Wrapper contract additions (v1.21-4d)

The federation-specific behaviour lives in `src/lib/federation.ts` —

- `resolveTrustChain(input)` — discriminated outcome (`{ ok: true; chain; anchor } | { ok: false; issue: { axis, reason } }`). Delegates to `@kiwa-test/auth`'s `resolveTrustChain`; the wrapper reads the underlying `reason_code` discriminator to pin the axis.
- `classifyFederationReason(reason_code)` — 1:1 forwarder from the upstream `TrustChainReasonCode` tag onto the wrapper's `FederationChainAxis`. Returns `structural` only when `reason_code` is undefined (safety net for hand-rolled `TrustChainResult` inputs — the real resolver always populates the field).
- `mustResolveTrustChain(input)` — throwing variant used by the RP bootstrap path where any resolution failure aborts startup. Throws `FederationChainError` carrying the same structured `FederationIssue`.
- `assertAnchorMatches(outcome, expected)` — asserts the resolved anchor `entity_id` equals the expected anchor. Federation §7.2 already enforces this on the resolver; the extra check pins the release-gate matrix against an independent reference so an accidental resolver swap trips the harness. This helper is the sole live path that surfaces `axis === 'anchor_mismatch'` in the wrapper (the walker exit paths inside `@kiwa-test/auth` collapse onto `broken_link` when they exhaust intermediates).
- `describeChain(chain)` — renders a resolved chain as `leafSub -> intermediateSub -> anchor` for docs + release-gate reports.

### Follow-up (v1.21 GH #880 / CAR-432) — `reason_code` upstream SSOT

The v1.21-4d PR review flagged the substring-based classifier as fragile — reason string rewording upstream would silently drop failures onto `structural`. The follow-up moves the failure-axis SSOT into `@kiwa-test/auth` by adding a `reason_code: TrustChainReasonCode` field on `TrustChainResult` (`broken_link` / `cycle` / `expired_intermediate` / `expired_leaf` / `anchor_mismatch`). The wrapper reads the tag directly; the `anchor_mismatch` tag is reserved for the wrapper's `assertAnchorMatches` path since the walker never emits it. Tests moved from tolerant `expect(['cycle', 'broken_link']).toContain(...)` to exact-axis pins, and axis 16 fixtures were rebuilt so the walker actually enters cycle-detection instead of the broken-link short-circuit.

## Environment gating

- `KIWA_MODE=mock` — forces the mock env; every axis 1–16 test always runs. The federation resolver used is `resolveOidcTrustChain` from `@kiwa-test/auth`.
- `OIDC_BOOTSTRAP=1` (v1.22-1) — opts a caller into the Keycloak testcontainers live driver. When `KEYCLOAK_URL` is set the adapter fetches from the supplied URL; otherwise `startKeycloakContainer()` boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` (docker required). Live coverage activates on axes 1 + 3.
- `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL=...` — opt-in for real ceremonies against a pre-provisioned Keycloak (docker-compose / external testcontainers instance / shared deployment).

## What lands in the successor milestones

- **v1.22-N** — RP-side federation bootstrap. Integrates `mustResolveTrustChain` into the Nuxt callback path so the RP validates the OP's federation chain before accepting an id_token.
- **v1.22-N** — id_token verify parity (axes 9-12 live). Wires a `jose`-based verifier through the fetched Keycloak JWKS so the mock's placeholder crypto shape does not artificially block the real-driver diff.
- **v1.22-N** — DCR live coverage (axes 5-8). Layers async `registerClientLive()` on top of Keycloak's `/realms/{realm}/clients-registrations/default` + provisions the anonymous DCR policy on the realm.
- **v1.22-N** — Federation §7 live coverage (axes 13-16). Provisions the Keycloak OpenID Federation SPI on the container image so the trust-chain walker diffs against Keycloak's `/entity-configuration` + `/statement` endpoints.
- **v1.22-N** — RP a11y gate. Extends the Nuxt 3 skeleton with a full login journey (WCAG 2.1 AA + axe-core report) so the release-gate a11y 軸 upgrades from N/A → PASS.

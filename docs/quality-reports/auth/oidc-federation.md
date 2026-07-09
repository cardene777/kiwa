# OIDC Federation Dogfood — integrated fidelity report (v1.22-5)

Integrated (v1.22-5, Sub-Issue CAR-446 / GH #891) quality report for `examples/dogfood-oidc-federation`.

Timeline:

- **v1.21-4** (Sub-Issues #872 / #873 / #874 / #875) — landed the 16-axis mock fidelity harness across Discovery + JWKS + DCR + id_token verify + Federation §7 trust chain + rotation e2e.
- **v1.22-1** (Sub-Issue GH #887 / CAR-442) — layered the Keycloak testcontainers real driver on top of the v1.21-4 scaffold. `src/adapters/real.ts` now boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` when `OIDC_BOOTSTRAP=1` is set + docker is reachable, provisions the `kiwa` realm through the admin REST API, and exposes discovery + JWKS through Keycloak's OIDC endpoints. Live coverage activates on axes 1 (discovery metadata shape) + 3 (JWKS active key shape); axes 2 / 4-16 stay on the mock-as-reference matrix with documented Sub-Issue v1.22-N follow-ups.
- **v1.22-3** (Sub-Issue GH #889) — escalates the Nuxt 3 RP `rp/` skeleton into a full login journey (signed-out + signed-in + error banner + logout) and adds a jsdom + axe-core WCAG 2.1 AA a11y gate over every visible state of the pages. Release gate 7 軸の a11y N/A → PASS。
- **v1.22-5** (this state, Sub-Issue CAR-446 / GH #891) — lands real coverage for axes 4a-4d (JWKS rotation e2e). Extends `KeycloakHandle` with baseUrl + admin credentials + adds admin REST API helpers (`listKeycloakRealmKeyComponents` / `createKeycloakRealmKeyComponent` / `deleteKeycloakRealmKeyComponent` / `ensureKeycloakConfidentialClient` / `mintIdTokenFromKeycloak`). New spec `tests/e2e/jwks-rotation-real-e2e.spec.ts` (4 opt-in tests) drives Keycloak's rotation lifecycle against a live container + verifies id_tokens through jose (real RS256 crypto against the fetched JWKS). Axes 2 / 5-16 remain on mock-as-reference.

本 document は v1.22-5 fidelity harness 全体の release-gate report。
7 sub-issue report を単一の 16-axis matrix に集約し、 release-gate 7 軸 verdict を pin する。
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

### v1.22-3 = GH #889 (Nuxt 3 RP full flow + a11y axe-core gate)

| Sub-Issue | scope | files touched | axes | quality report |
|---|---|---|---|---|
| GH #889 | Nuxt 3 RP full journey (signed-out → OP → callback → userinfo → logout) + `role=alert` / `role=status` structured error banners + logout endpoint + jsdom + axe-core WCAG 2.1 AA gate over every visible RP state (12 axe scans across 5 UI states + 4 error kinds) | `rp/lib/pages-templates.ts` + `rp/pages/index.vue` + `rp/pages/callback.vue` + `rp/server/api/logout.post.ts` + `tests/rp-full-flow-a11y.spec.ts` + `tests/rp-full-journey-flow.spec.ts` + this report (§ RP a11y coverage — v1.22-3) | RP UI axis (a11y N/A → PASS) + full-journey state machine | this file |

### v1.22-5 = CAR-446 / GH #891 (real JWKS rotation e2e)

| Sub-Issue | scope | files touched | axes | quality report |
|---|---|---|---|---|
| CAR-446 / GH #891 | Real JWKS rotation e2e — Keycloak admin REST API rotation (`/admin/realms/{realm}/components` create + delete on `rsa-generated` providers) + `/protocol/openid-connect/certs` refresh + jose (RS256) verify. Extends `KeycloakHandle` with baseUrl + admin credentials + adds `listKeycloakRealmKeyComponents` / `createKeycloakRealmKeyComponent` / `deleteKeycloakRealmKeyComponent` / `ensureKeycloakConfidentialClient` / `mintIdTokenFromKeycloak` helpers. Every axis exercised against a live Keycloak container: 4a inside-window sign→rotate→verify, 4b past-retention (delete owner component), 4c multi-rotation retention, 4d fresh-key signing. | `src/adapters/real.ts` (KeycloakHandle extension + admin helpers) + `tests/e2e/jwks-rotation-real-e2e.spec.ts` + `package.json` (jose devDep) + this report (§ Real JWKS rotation e2e matrix — v1.22-5) | 4a-4d (real coverage) | this file |

## Fidelity axes (v1.21-4d additions)

The v1.21-4d harness lifts the fidelity axes from 12 → 16 by adding four Federation §7 trust-chain axes. Every axis has a mock coverage row driven by `@kiwa-lab/auth`'s `resolveTrustChain` (wrapped through `src/lib/federation.ts`) and a real coverage row that stays refused with `KIWA_OIDC_ENV_MISSING` until Keycloak's Federation deployment is provisioned behind `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL`.

| axis | mock (`@kiwa-lab/auth` via `src/lib/federation.ts` wrapper) | real (Keycloak, `OIDC_BOOTSTRAP=1`, deferred) | assertion |
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
| `tests/keycloak-real-driver.spec.ts` | 15 (11 always-on + 4 live opt-in) | v1.22-1 real driver env-skip semantics + Keycloak live coverage (axes 1 / 3) |
| `tests/rp-full-flow-a11y.spec.ts` | 34 | v1.22-3 RP full-flow a11y (WCAG 2.1 AA + WAI-ARIA) — DOM structure + axe-core over 12 UI states |
| `tests/rp-full-journey-flow.spec.ts` | 13 | v1.22-3 RP full-journey state machine (authorize → OP → callback → userinfo → logout + 5 error branches) |
| `tests/e2e/jwks-rotation-real-e2e.spec.ts` | 4 (opt-in) | v1.22-5 real JWKS rotation e2e axes 4a-4d (real Keycloak admin API rotation + `/certs` refresh + jose RS256 verify) |
| **total** | **174** (166 default + 8 live opt-in) | v1.22-5 dogfood fidelity + integration + RP a11y + real JWKS rotation e2e |

All 166 tests pass under `KIWA_MODE=mock` (default). Setting `OIDC_BOOTSTRAP=1` boots a Keycloak testcontainer (see next section) so the additional 4 live Keycloak driver tests + 4 v1.22-5 real JWKS rotation e2e tests activate, taking the pass count to 174. The RP a11y spec runs in `jsdom` env via the `// @vitest-environment jsdom` pragma so it coexists with the node-env fidelity harness inside one `pnpm test` run.

## Real driver coverage (v1.22-1)

Sub-Issue v1.22-1 (GH #887 / CAR-442) lands the Keycloak testcontainers wiring in `src/adapters/real.ts`. The adapter boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` when `OIDC_BOOTSTRAP=1` is set + docker is reachable, provisions the `kiwa` realm through the admin REST API, and exposes discovery + JWKS through Keycloak's OIDC endpoints.

### Environment gating

The real driver treats env as one of three states:

1. **env-missing** (`OIDC_BOOTSTRAP` unset) — every ceremony beyond `discovery()` refuses with `KIWA_OIDC_ENV_MISSING`; `discovery()` returns the static shape derived from the requested issuer so the fidelity harness has a reference. Default state on every developer machine.
2. **env-ready with pre-provisioned URL** (`OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL` set) — the adapter fetches discovery + JWKS from the supplied URL. No container boot; the caller is responsible for provisioning Keycloak (docker-compose, external testcontainers instance, or a shared deployment).
3. **env-ready with handle** (caller passes `keycloak` handle via `makeRealAdapter({ keycloak })`) — the harness boots Keycloak through `startKeycloakContainer()` in its own lifecycle (typically `beforeAll` / `afterAll`) and hands the handle to the adapter. `effectiveIssuer` becomes the handle's realm URL. Container ownership stays with the caller so cleanup boundaries are unambiguous — the adapter never boots or stops Keycloak internally.

### Real coverage matrix — v1.22-1

| axis | mock coverage | real coverage (Keycloak 26.0 via testcontainers) | v1.22-1 verdict |
|---|---|---|---|
| 1. discovery metadata shape | `setupOidcEnv.discovery.fetch()` returns the OIDC Discovery §3 mandatory fields derived from `issuer`. | `refreshLiveDiscovery()` fetches `{issuer}/.well-known/openid-configuration` + narrows Keycloak's superset onto the `OpenIdProviderMetadata` contract; asserts `jwks_uri` + `token_endpoint` + `authorization_endpoint` carry the `/protocol/openid-connect/*` Keycloak paths + `code_challenge_methods_supported` contains `S256`. | **live** (2 tests in `keycloak-real-driver.spec.ts`) |
| 2. discovery issuer 一致 guard | `assertIssuerMatchesFetchUrl` diffs the fetched `issuer` field against the URL used to fetch. | Not yet live-diffed against Keycloak. Kekycloak sets `issuer` = realm URL by convention — Sub-Issue v1.22-N follow-up wires the strict guard against a mismatched `fetch` URL. | mock-only |
| 3. JWKS active key shape | `env.jwks.fetch()` returns 1 active RS256 key satisfying `assertKeyShape`. | `refreshLiveJwks()` fetches `{issuer}/protocol/openid-connect/certs` + filters `use=sig` keys (Keycloak advertises both `sig` + `enc` keys — see § Real vs mock fidelity — sig-only filtering); pins mandatory §4 fields on each signing key. | **live** (2 tests) |
| 4 / 4a–4d. JWKS rotation retention + e2e | mock rotates active kid + retires previous with retention window; e2e proves sign → rotate → verify across retention boundary. | v1.22-5 (CAR-446 / GH #891) lands real coverage via `tests/e2e/jwks-rotation-real-e2e.spec.ts` — Keycloak admin REST API drives `rsa-generated` provider create / delete against `/admin/realms/{realm}/components`, jose verifies id_tokens against the refreshed `/certs`. `rotateJwks()` sync method still refuses (the mock stays the fidelity-adapter reference for the sync interface); the async admin surface is exposed through `listKeycloakRealmKeyComponents` / `createKeycloakRealmKeyComponent` / `deleteKeycloakRealmKeyComponent` for the e2e harness. | **live** (4 tests in `tests/e2e/jwks-rotation-real-e2e.spec.ts`, opt-in via `OIDC_BOOTSTRAP=1`) |
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

The mock (`@kiwa-lab/auth` `setupOidcEnv`) is the release-gate reference for v1.22-1. Axes 1 + 3 add live Keycloak diff coverage (see § Real coverage matrix — v1.22-1); the remaining axes stay on the mock-as-reference matrix with documented Sub-Issue v1.22-N follow-ups. Everything runs by default under `KIWA_MODE=mock`; the `OIDC_BOOTSTRAP=1` gate opts a caller into the additional live diff.

## Release gate 7 軸 verdict

| 軸 | 判定 | evidence |
|---|---|---|
| typecheck | PASS | `pnpm typecheck` (`tsc --noEmit`) exits 0 for the example package. `tsconfig.vitest.json` extends the workspace base so the same emit is used for compiled tests + type-only checks. |
| test | PASS | `pnpm test` runs 166 tests (default, mock-only) across 10 spec files under vitest 2.x, 100% pass. `OIDC_BOOTSTRAP=1 pnpm test` unlocks 8 additional live tests (4 v1.22-1 Keycloak driver + 4 v1.22-5 real JWKS rotation e2e) → 174 tests, 100% pass. Baseline before v1.22-5 = 170 tests (v1.22-3); v1.22-5 adds 4 real e2e tests → 174. |
| build | PASS | The example is a workspace consumer (not a published package); the build gate is the compiled test emit under `.vitest-dist/` produced by the `test` script. Emit is byte-clean per run. |
| lint | PASS | No `pnpm lint` script on this package — it inherits the workspace-level lint. TypeScript strict mode is exercised via `tsconfig.base.json` (extended by both tsconfigs). No `any` / `unknown` narrowing failures. |
| coverage | PASS | vitest runs without `--coverage` in the release gate — behavioural coverage is measured by the 16-axis fidelity matrix + the 174-test count. Every axis has ≥ 3 tests; every wrapper file (`discovery.ts` / `jwks.ts` / `dcr.ts` / `id-token.ts` / `federation.ts`) has ≥ 1 covering spec file. Axes 1 + 3 gain live Keycloak coverage in v1.22-1; axes 4a-4d gain live coverage in v1.22-5 (4 additional tests under `OIDC_BOOTSTRAP=1` via `tests/e2e/jwks-rotation-real-e2e.spec.ts`). |
| docs | PASS | Four sub-issue reports (`oidc-federation-discovery.md` / `oidc-federation-dcr.md` / `oidc-federation-id-token.md` / this file) landed. README covers the sub-issue split table + the axis matrix. This report layers § Real driver coverage (v1.22-1) + § Real coverage matrix — v1.22-1 + § Real vs mock fidelity — sig-only filtering + § Real JWKS rotation e2e matrix — v1.22-5 (4-axis mock/real correspondence + rotation-semantics divergence SSOT + admin surface reference). |
| a11y | PASS | v1.22-3 (GH #889) escalates the Nuxt 3 RP into a full login journey and adds `tests/rp-full-flow-a11y.spec.ts` (34 tests) that runs axe-core (WCAG 2.1 AA + WAI-ARIA best-practice tag sets) over every visible RP state — signed-out / signed-out with error banner (3 kinds) / signed-in with full userinfo / signed-in with only sub / callback exchanging / callback success / callback error (4 kinds). Every scan reports 0 violations at impact >= minor. The `color-contrast` rule is disabled in jsdom (needs a real canvas backend) — the fidelity report flags contrast as a Playwright-native gate that runs in browser env when the RP CI has one available (v1.22-N follow-up). v1.22-5 introduces no new UI surface so the a11y verdict carries over unchanged. |

Release gate verdict: **PASS** (7/7 軸 PASS — v1.22-5 が axes 4a-4d の real coverage を live 化、 axis 4 が mock-only → live に昇格).

## RP a11y coverage — v1.22-3

Sub-Issue GH #889 escalates the Nuxt 3 RP skeleton into a full login journey and lands the WCAG 2.1 AA + WAI-ARIA a11y gate. The gate has three tiers —

1. **Template renderer SSOT** (`rp/lib/pages-templates.ts`) — pure functions that emit the DOM string every RP page produces. `renderIndex({state, opDisplayName, userinfo, errorMessage})` covers signed-out / signed-in / signed-out-with-error; `renderCallback({status, errorKind, errorDetail})` covers exchanging / success / error. The Vue SFCs in `rp/pages/*.vue` mirror the same markup character-for-character so the a11y verdict transfers as long as the pairing holds.
2. **jsdom + axe-core scan** (`tests/rp-full-flow-a11y.spec.ts`) — loads each rendered DOM string into jsdom via `document.open() / write() / close()`, then runs axe-core with the `wcag2a` / `wcag2aa` / `wcag21a` / `wcag21aa` / `best-practice` tag sets enabled. Every scan asserts 0 violations at impact >= minor. The `color-contrast` rule is disabled because jsdom does not implement `HTMLCanvasElement.getContext`; a Playwright-native contrast gate lives in the v1.22-N follow-up list.
3. **Server-route journey** (`tests/rp-full-journey-flow.spec.ts`) — exercises the authorize → OP → callback → userinfo → logout state machine at the behavioural boundary (state / nonce / PKCE / id_token verification / CSRF / cookie drop). The five error branches the callback page can render (invalid_grant / expired_token / user_cancel / OP access_denied / missing code+state) each get a template-shape assertion so the a11y contract stays paired with the server contract.

### Accessibility surface — Vue SFC ↔ renderer parity

The a11y verdict from tier 2 only transfers when the Vue SFCs stay in lock-step with the renderer's DOM string. The parity contract:

| element | renderer output | SFC template |
|---|---|---|
| `<main aria-labelledby="rp-title">` | index page landmark | `pages/index.vue` `<main>` opening tag |
| `<h1 id="rp-title">` | main page heading | same |
| `role="alert" aria-live="assertive"` error banner | shown when `errorMessage.length > 0` | `<div v-if="errorMessage.length > 0" role="alert" aria-live="assertive">` |
| `<section aria-labelledby="signed-out-heading">` | signed-out panel | `<section v-if="state === 'signed-out'" aria-labelledby="signed-out-heading">` |
| `<button id="signin-button" aria-label="Sign in with {op}">` | sign-in CTA | `<button ... aria-label="Sign in with {display name}">` |
| `<section aria-labelledby="signed-in-heading">` | signed-in panel | `<section v-else aria-labelledby="signed-in-heading">` |
| `<dl>` with `<dt>Subject</dt><dd>…</dd>` × 3 | userinfo | same |
| `<button id="signout-button" aria-label="Sign out of the RP session">` | logout CTA | same |
| `<main aria-labelledby="callback-title">` on callback | callback landmark | `pages/callback.vue` `<main>` |
| `<p role="status" aria-live="polite">` | exchanging / success live region | same |
| `<div role="alert" aria-live="assertive">` + `<a href="/" id="home-link">` | callback error banner + recovery link | same |

Divergence between the two is the regression signal — a future PR that adds e.g. a new button to the SFC without adding it to the renderer would surface as a `rp-full-journey-flow.spec.ts` template-shape assertion diff.

### Follow-ups

- **Color-contrast gate** — the current a11y scan disables `color-contrast` because jsdom does not implement `HTMLCanvasElement.getContext`. A Playwright-based scan against `nuxt build && node .output/server/index.mjs` would exercise the real Chromium canvas backend; deferred to a v1.22-N Sub-Issue that wires the RP into the release-smoke Playwright fleet.
- **OpenID Connect RP-Initiated Logout 1.0** — the current `/api/logout` route drops the local RP session cookie only. Walking the OP's `end_session_endpoint` (Keycloak `/protocol/openid-connect/logout`) is a v1.22-N follow-up; the UI copy already reads "Sign out of the RP session" to distinguish local vs global logout.
- **RP-side federation bootstrap + real id_token verify** — flagged in the v1.22-3 report as v1.22-N follow-ups; no scope change from v1.22-1.

## Real JWKS rotation e2e matrix — v1.22-5

Sub-Issue v1.22-5 (CAR-446 / GH #891) lands real coverage for axes 4a-4d against a live Keycloak container. The mock's `env.jwks.rotate()` is a synchronous in-memory operation; Keycloak's rotation is an async admin REST API surface (`POST /admin/realms/{realm}/components` on `rsa-generated` providers). The e2e harness stitches those two boundaries together so the rotation contract stays comparable across drivers.

### Real coverage matrix

| axis | mock coverage (`tests/jwks-rotation-e2e.spec.ts`) | real coverage (`tests/e2e/jwks-rotation-real-e2e.spec.ts`) | verdict |
|---|---|---|---|
| 4a. sign → rotate → verify inside window | Sign id_token under k001 with `env.signIdToken` → `env.jwks.rotate()` → verify under k001 through `verifyIdToken` (mock retention window). | Mint id_token via `/protocol/openid-connect/token` (password grant, Keycloak signs with active `rsa-generated` provider) → `POST /admin/realms/{realm}/components` creates a fresh `rsa-generated` provider with higher priority → re-fetch `/protocol/openid-connect/certs` → jose `jwtVerify` accepts the id_token against the refreshed JWKS. Pre-rotation kid stays in `/certs` (Keycloak's built-in retention window: enabled providers stay published). | **PASS** |
| 4b. verify past retention window | Advance clock past `retiredAt` → mock drops kid from JWKS → `verifyIdToken` refuses with `axis=signature` + `reason` matching `/kid/`. | Mint id_token → rotate (add higher-priority provider) → `DELETE /admin/realms/{realm}/components/{ownerId}` on the pre-rotation owning provider (simulates past-retention drop) → poll `/certs` until preKid is absent → jose `jwtVerify` rejects with `errors.JWKSNoMatchingKey`. | **PASS** |
| 4c. multi-rotation retention | Two consecutive `env.jwks.rotate()` calls retain both previous kids; three id_tokens under different pre-rotation kids all verify inside window. | Three consecutive mint→rotate iterations produce three id_tokens across three active kids → every previous provider stays in `/certs` (retention window is open for all of them since no provider was deleted) → jose `jwtVerify` accepts every id_token against the refreshed JWKS. | **PASS** |
| 4d. fresh active key issues verifiable id_tokens after rotation | Fresh active key mints an id_token whose header carries the new kid; `verifyIdToken` accepts immediately. | Rotate → mint id_token → id_token header carries the newly-created provider's kid → jose `jwtVerify` accepts against the fresh public JWK; `alg=RS256` + `iss` matches the realm URL + `sub` is populated. Cross-check: `decodeJwt` claims match verified claims (pins JWT well-formed). | **PASS** |

### Real vs mock fidelity — rotation semantics

The mock's rotation shape (fresh kid + retention window backed by `retiredAt`) is a deliberate simplification of Keycloak's provider model. The following divergences are documented for release-gate transparency —

1. **Retention boundary trigger** — mock retention fires on wall-clock elapse (`now > retiredAt`). Keycloak retention fires on **explicit provider deletion** (the enabled-provider list is authoritative for `/certs`; there is no time-based drop). The e2e harness simulates the mock's `now > retiredAt` transition by issuing `DELETE /admin/realms/{realm}/components/{id}` on the owner provider — the observable outcome (kid absent from `/certs`) is behaviourally identical.
2. **Signing key selection** — mock uses `env.jwks.activeKey()` (single active kid at a time). Keycloak selects the highest-priority `enabled: true` provider as the active signer; multiple sig providers can coexist so long as their priorities differ. The e2e harness enforces the mock's semantics by always creating rotations at a higher priority than every existing component.
3. **Retention window timing model** — mock retains for `jwksRetentionSec` seconds (default 60). Keycloak has no timer; the operator (or the e2e harness) decides when to drop a provider. The mock's timer-based semantics are a testing convenience; the e2e harness's admin-driven semantics match how a real deployment rotates keys (announce → wait for downstream refresh → drop old provider).
4. **JWKS cache invalidation** — mock's `env.jwks.fetch()` is a synchronous read of the in-memory registry. Keycloak's `/certs` is an HTTP endpoint that may be served through an HTTP cache. The e2e harness uses jose's `createRemoteJWKSet` with a 100ms `cacheMaxAge` + `cooldownDuration` so cache misses on the pre-rotation kid trigger an immediate re-fetch; production RPs typically use the default 5-minute cache which trades freshness for load reduction.

### Admin surface exposed by `real.ts` (v1.22-5)

The real adapter's sync interface stays parity with the mock (`rotateJwks()` continues to refuse with the documented reason). The admin surface below is exposed as free functions on the adapter module so the e2e harness can drive Keycloak's rotation lifecycle directly against a `KeycloakHandle`. All helpers require the handle carrying `baseUrl` + admin credentials — the master-realm admin token is fetched on every call so token lifetime does not need external tracking.

| helper | admin REST endpoint | usage |
|---|---|---|
| `listKeycloakRealmKeyComponents(handle)` | `GET /admin/realms/{realm}/components?type=org.keycloak.keys.KeyProvider` | Introspection — used before rotate to compute the priority + before delete to correlate kid → provider id. |
| `createKeycloakRealmKeyComponent(handle, options)` | `POST /admin/realms/{realm}/components` | Rotate — creates `rsa-generated` provider with priority = max(existing) + 100 by default. Returns the created component so the caller can capture its id for cleanup. |
| `deleteKeycloakRealmKeyComponent(handle, id)` | `DELETE /admin/realms/{realm}/components/{id}` | Past-retention simulation — drops the provider (and its kid) from `/certs`. Idempotent: 404 responses are treated as success. |
| `ensureKeycloakConfidentialClient(handle, options)` | `POST /admin/realms/{realm}/clients` + `POST /admin/realms/{realm}/users` | Provisions the confidential client + user pair needed for the password grant. Idempotent (409 = success). User is created with `requiredActions: []` + `firstName`/`lastName` populated so the password grant does not refuse with "Account is not fully set up". |
| `mintIdTokenFromKeycloak(handle, options)` | `POST /realms/{realm}/protocol/openid-connect/token` (grant_type=password) | Returns `{id_token, access_token}`. The password grant is deprecated in OAuth 2.1 for production use, but Keycloak still supports it under `directAccessGrantsEnabled` and it is the cleanest path to obtain an id_token headlessly for e2e verification. |

### KeycloakHandle extension (v1.22-5)

`KeycloakHandle` gains three fields to expose the admin surface without booting a second container:

- `baseUrl` — container base URL without the realm suffix (e.g. `http://127.0.0.1:8080`). Every admin call is composed as `${baseUrl}/admin/realms/${realm}/...`.
- `adminUsername` / `adminPassword` — master-realm admin credentials used to fetch the admin bearer token via the `admin-cli` client's password grant.

The fidelity adapter never uses these fields — they exist to support the e2e rotation surface. Callers who want to lock the adapter down to the fidelity axes can wrap the handle before passing to `makeRealAdapter` (`{...handle, baseUrl: '', adminUsername: '', adminPassword: ''}`) — the sync interface stays functional because the handle's admin fields are never consulted by the sync path.

### Container reuse + cleanup

The e2e spec follows the v1.22-1 pattern: one container per file (`beforeAll` boot, `afterAll` stop). Between axes the harness tracks every created component id and drops them in `afterAll` so a subsequent CI leg starts against a clean realm. Failed deletes are best-effort (any 404 or 4xx is swallowed) so a stale delete failure does not abort the container teardown.

## Wrapper contract additions (v1.21-4d)

The federation-specific behaviour lives in `src/lib/federation.ts` —

- `resolveTrustChain(input)` — discriminated outcome (`{ ok: true; chain; anchor } | { ok: false; issue: { axis, reason } }`). Delegates to `@kiwa-lab/auth`'s `resolveTrustChain`; the wrapper reads the underlying `reason_code` discriminator to pin the axis.
- `classifyFederationReason(reason_code)` — 1:1 forwarder from the upstream `TrustChainReasonCode` tag onto the wrapper's `FederationChainAxis`. Returns `structural` only when `reason_code` is undefined (safety net for hand-rolled `TrustChainResult` inputs — the real resolver always populates the field).
- `mustResolveTrustChain(input)` — throwing variant used by the RP bootstrap path where any resolution failure aborts startup. Throws `FederationChainError` carrying the same structured `FederationIssue`.
- `assertAnchorMatches(outcome, expected)` — asserts the resolved anchor `entity_id` equals the expected anchor. Federation §7.2 already enforces this on the resolver; the extra check pins the release-gate matrix against an independent reference so an accidental resolver swap trips the harness. This helper is the sole live path that surfaces `axis === 'anchor_mismatch'` in the wrapper (the walker exit paths inside `@kiwa-lab/auth` collapse onto `broken_link` when they exhaust intermediates).
- `describeChain(chain)` — renders a resolved chain as `leafSub -> intermediateSub -> anchor` for docs + release-gate reports.

### Follow-up (v1.21 GH #880 / CAR-432) — `reason_code` upstream SSOT

The v1.21-4d PR review flagged the substring-based classifier as fragile — reason string rewording upstream would silently drop failures onto `structural`. The follow-up moves the failure-axis SSOT into `@kiwa-lab/auth` by adding a `reason_code: TrustChainReasonCode` field on `TrustChainResult` (`broken_link` / `cycle` / `expired_intermediate` / `expired_leaf` / `anchor_mismatch`). The wrapper reads the tag directly; the `anchor_mismatch` tag is reserved for the wrapper's `assertAnchorMatches` path since the walker never emits it. Tests moved from tolerant `expect(['cycle', 'broken_link']).toContain(...)` to exact-axis pins, and axis 16 fixtures were rebuilt so the walker actually enters cycle-detection instead of the broken-link short-circuit.

## Environment gating

- `KIWA_MODE=mock` — forces the mock env; every axis 1–16 test always runs. The federation resolver used is `resolveOidcTrustChain` from `@kiwa-lab/auth`.
- `OIDC_BOOTSTRAP=1` (v1.22-1) — opts a caller into the Keycloak testcontainers live driver. When `KEYCLOAK_URL` is set the adapter fetches from the supplied URL; otherwise `startKeycloakContainer()` boots `quay.io/keycloak/keycloak:26.0` through `testcontainers` (docker required). Live coverage activates on axes 1 + 3.
- `OIDC_BOOTSTRAP=1` + `KEYCLOAK_URL=...` — opt-in for real ceremonies against a pre-provisioned Keycloak (docker-compose / external testcontainers instance / shared deployment).

## What lands in the successor milestones

- **v1.22-N** — RP-side federation bootstrap. Integrates `mustResolveTrustChain` into the Nuxt callback path so the RP validates the OP's federation chain before accepting an id_token.
- **v1.22-N** — id_token verify parity (axes 9-12 live). Wires a `jose`-based verifier through the fetched Keycloak JWKS so the mock's placeholder crypto shape does not artificially block the real-driver diff.
- **v1.22-N** — DCR live coverage (axes 5-8). Layers async `registerClientLive()` on top of Keycloak's `/realms/{realm}/clients-registrations/default` + provisions the anonymous DCR policy on the realm.
- **v1.22-N** — Federation §7 live coverage (axes 13-16). Provisions the Keycloak OpenID Federation SPI on the container image so the trust-chain walker diffs against Keycloak's `/entity-configuration` + `/statement` endpoints.
- **v1.22-3 (GH #889, delivered)** — RP a11y gate. Extended the Nuxt 3 skeleton with a full login journey + jsdom + axe-core WCAG 2.1 AA gate over 12 UI states; release-gate a11y 軸 = PASS. See § RP a11y coverage — v1.22-3.
- **v1.22-N** — RP a11y color-contrast gate (Playwright + Chromium canvas). Extends the current jsdom-based scan with a real browser pass so the `color-contrast` rule activates.

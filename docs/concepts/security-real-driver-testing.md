# Security real-driver testing — 8 axis × 4 provider = 32 cell grid + real-driver env-gate (SSOT)

kiwa's v1.37-1 security package (`@kiwa-test/security` v0.1.0) covers **8 axes** that model the security posture of a real production stack — CSP + rate limiting + authorization + WAF + threat modeling + secrets scanning + SBOM + advanced security headers. This concept doc is the SSOT for those 8 axes; the tutorials (76-78) and dogfood apps (v1.37-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production security stack hits within the first quarter.

| Axis | Real-world failure it catches | v0.1 API |
|---|---|---|
| CSP | "The `'strict-dynamic'` directive silently disabled the whole `script-src` policy because no nonce was present, so every inline script fired unblocked and the CSP header showed green" (no build-time invariant, no strict-dynamic + nonce co-requirement) | `buildCspHeader` / `validateNonce` / `toCspEvent` |
| Rate limit | "The distributed rate limiter reset the token bucket every time the Redis key expired mid-window because the leaky bucket implementation double-counted the drain step" (no window contract, no distributed drift guard) | `TokenBucket` / `LeakyBucket` / `SlidingWindow` / `DistributedRateLimiter` / `resolveClientId` / `toRateLimitEvent` |
| Authorization | "The `admin` role stopped inheriting `viewer` permissions after a role rename but nobody caught it until a support ticket asked why the audit UI was blank" (no role-hierarchy cycle guard, no combined RBAC + ABAC evaluator) | `createRbacPolicy` / `expandRoles` / `rbacAllows` / `evaluateAbac` / `evaluateCombined` / `toAuthorizationEvent` |
| WAF | "The custom WAF rule fired allow before the OWASP CRS default fired deny because the rule-precedence order was undefined, and a SQL injection made it past" (no rule precedence contract, no false-positive suppression) | `createWafPolicy` / `evaluateWaf` / `addCustomRule` / `suppressFalsePositive` / `OWASP_CRS_DEFAULT` / `toWafEvent` |
| Threat model | "The STRIDE scoring drifted after a data-flow rewrite because the boundary crossings were never re-detected and DREAD row exposure jumped from 25 to 40 without a review" (no boundary-crossing detector, no PASTA stage coverage) | `scoreStride` / `scoreDread` / `detectBoundaryCrossings` / `pastaCoverage` / `toThreatModelEvent` |
| Secrets scan | "The Gitleaks rule caught a 40-char base64 string that was actually a natural-language sentence because the regex fired but the entropy gate was off" (no Shannon-entropy floor, no signature deduplication) | `scanSecrets` / `DEFAULT_SIGNATURES` / `shannonEntropy` / `isRotationOverdue` / `markRotated` / `toSecretsEvent` |
| SBOM | "The SBOM said 0 vulnerable components but the OSV feed had a critical for `left-pad@1.3.0` because the version-range parser only handled exact matches, not `< 2.0.0`" (no OR-clause range parser, no advisory-feed join) | `toCycloneDx` / `toSpdx` / `validateSbom` / `lookupAdvisories` / `versionInRange` / `evaluateLicense` / `DEFAULT_LICENSE_POLICY` / `toSbomEvent` |
| Security headers | "The `Strict-Transport-Security` preload flag was set without `includeSubDomains`, and the browser accepted the header but the preload list rejected the submission — the operator only found out after a manual audit" (no HSTS preload invariant, no Permissions-Policy syntax check) | `buildSecurityHeaders` / `validateSecurityHeaders` / `toSecurityHeadersEvent` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real helmet / express-rate-limit / casbin / coraza, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 76 covers the CSP axis end-to-end (build → nonce → hash → strict-dynamic → trusted-types → report-only), tutorial 77 covers the authorization axis (RBAC + role hierarchy + ABAC combining + combined RBAC + ABAC), tutorial 78 covers the SBOM + secrets-scan axes (CycloneDX + SPDX + advisory + license + secret finding + rotation SLA).

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across helmet + express-rate-limit + casbin + coraza), the emitted event dialects are provider-specific (`helmet.csp.violation` vs. `coraza.csp.violation` vs. `casbin.authorization.decision` vs. `express-rate-limit.rate-limit.exceeded`), and the fidelity harness reports the coverage explicitly through `SECURITY_FIDELITY_GRID`.

| Provider | CSP | Rate limit | Authorization | WAF | Threat model | Secrets scan | SBOM | Security headers |
|---|---|---|---|---|---|---|---|---|
| helmet | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| express-rate-limit | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| casbin | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| coraza | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v1.37 security grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a policy that runs under helmet + express-rate-limit + casbin + coraza without change) even possible.

### Why the security grid is fully covered

helmet + express-rate-limit + casbin + coraza converged on the same neutral events at the "read a request header, decide an allow / deny, emit an audit event" primitive — the "security policy over an HTTP request" shape is the same across all 4 providers, even though the wire encodings differ (Node middleware vs. Redis-backed limiter vs. policy-engine adapter vs. WAF rules engine). The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.37 fidelity grid at 32/32 = 100 % implemented reflects that convergence at the "policy decision" level.

## The `KIWA_MODE=real` env-gate contract

`skipUnlessReal(provider, env)` returns `{ skip: false, reason: 'KIWA_MODE=real + required env present — real driver' }` when `env.KIWA_MODE === 'real'` and the required env for that provider is set, and `{ skip: true, reason: 'KIWA_MODE!=real (got "unset") — mock driver' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip)` block.

Per-provider required-env mapping (`REAL_DRIVER_REQUIRED_KEYS`).

- **helmet** → `KIWA_MODE` only (helmet is Node-in-process, no external service needed)
- **express-rate-limit** → `KIWA_MODE` + `KIWA_REDIS_URL` (real Redis-backed distributed rate limiter)
- **casbin** → `KIWA_MODE` + `KIWA_CASBIN_POLICY_PATH` (real casbin policy file on disk)
- **coraza** → `KIWA_MODE` + `KIWA_CORAZA_RULES_PATH` (real coraza / OWASP CRS rule file on disk)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required env are present. That means CI stays cheap by default (mock only, ms scale), the nightly job flips `KIWA_MODE=real` + the required `_URL` / `_PATH` envs, and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode — the test still runs, the real-driver assertions get skipped. Absent `KIWA_MODE` means fall back to mock. An invalid `KIWA_MODE` value (anything other than `real`) also falls back to mock so a typo does not break tests.

## The dogfood app new pattern

The 3 dogfood apps (v1.37-2/3/4) each expose a `pnpm test` command that keeps the mock-only path green sub-second, and are wired for `pnpm test:real` follow-up phases when the required envs are present.

- `examples/dogfood-security-csp-headers-app` — Next.js middleware + CSP nonce + strict-dynamic + trusted-types + security headers advanced + `pnpm test:real` that walks the CSP chain (build policy → attach nonce → strict-dynamic → trusted-types → report-only) against a real Next.js middleware runtime. 70 test.
- `examples/dogfood-security-rbac-abac-app` — casbin + RBAC + ABAC + policy engine + role hierarchy + `pnpm test:real` that walks the authorization flow (RBAC allow → ABAC evaluate → combined RBAC + ABAC) against a real casbin policy adapter. 86 test.
- `examples/dogfood-security-sbom-scanning-app` — Trivy + CycloneDX + SPDX + Gitleaks + OSV / NVD + license policy + `pnpm test:real` that walks the SBOM + secrets scan flow (emit CycloneDX / SPDX → advisory lookup → license gate → secret finding → rotation SLA) against real Trivy + Gitleaks + OSV-Scanner. 62 test.

The pattern each new app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:e2e` command that spins the docker-compose stack (Next.js runtime + Redis + casbin adapter + Trivy scanner, subset per app) and walks the real security policy flow.
3. Add a `pnpm test:real` command that requires the axis-specific `_URL` / `_PATH` env(s) and routes through the real provider endpoint.
4. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
5. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 32-cell grid at v1.37 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `zero-trust-mtls` or `content-integrity-signing`), it will start as `planned` for all 4 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.37 does not add a 14th release-gate axis. The 8 security axes gate the security package's own tests (via `pnpm --filter @kiwa-test/security test`) but do not surface as a per-package `@kiwa-test/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not export to helmet / express-rate-limit / casbin / coraza has nothing to assert on. When a future milestone adds a `security.fidelity` axis that describes "which security providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.37 keeps the axis count at 13.

## SSOT boundaries

- The 8 security axes live in this doc. Tutorials 76-78 and the migration guide (v1.36 → v1.37) link back here for the axis SSOT.
- The 4-provider × 8-axis grid is the harness's data structure. The `SECURITY_FIDELITY_GRID` constant in `packages/security/src/fidelity.ts` is the code SSOT — this doc's grid table is derived from that constant.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, the v1.32 database real-driver concept doc, the v1.33 payment real-driver concept doc, the v1.34 frontend real-driver concept doc, the v1.35 observability real-driver concept doc, and the v1.36 search real-driver concept doc. All seven use the same `skipUnlessReal(env)` pattern; the security axes just add provider `_URL` + `_PATH` envs (`KIWA_REDIS_URL` / `KIWA_CASBIN_POLICY_PATH` / `KIWA_CORAZA_RULES_PATH`) instead of `_URL`-only envs.

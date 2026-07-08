# Security advanced II testing — v0.2 8 axis × 4 provider = 32 cell advanced grid + real-driver env-gate (SSOT)

kiwa's v1.39-1 security v0.2 package (`@kiwa/security` v0.2.0) covers **8 advanced axes** that model the deepening security posture of a real production stack beyond the v0.1 base HTTP-header + policy-engine surface — mTLS handshake + zero-trust access + SIEM audit + incident response + cryptography advanced + container / Kubernetes hardening + supply chain SLSA + web vitals security. This concept doc is the SSOT for those 8 advanced axes; the tutorials (82-84) and dogfood apps (v1.39-2/3/4) are the concrete implementations.

The v0.2 grid is orthogonal to the v0.1 base grid — the base grid (`SECURITY_FIDELITY_GRID`) covers the "read a request, decide allow / deny, emit audit event" primitive across 4 provider (`helmet` / `express-rate-limit` / `casbin` / `coraza`), and the advanced grid (`SECURITY_ADV_FIDELITY_GRID`) covers the "service mesh + policy engine + SIEM + secrets vault" primitives across a different 4 provider (`istio` / `opa` / `siem-splunk` / `vault`). Read the `security-real-driver-testing.md` concept doc first for the v0.1 base grid, then read this doc for the v0.2 advanced grid.

## The 8 advanced axes grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production security stack hits after the base v0.1 axes land.

| Axis | Real-world failure it catches | v0.2 API |
|---|---|---|
| mTLS | "The OCSP staple was missing but the handshake still completed because the middleware treated `stapled: false` as `unknown` instead of `deny`" (no fail-closed staple check, no SPKI-only pinning that survives cert rotation, no SCT-count guard) | `startMtlsSession` / `completeHandshake` / `verifyPin` / `verifyOcsp` / `checkCtLog` |
| Zero-trust | "The user's laptop had no disk encryption but the JIT role grant fired because the posture check ran on a stale cache" (no 4-signal posture check, no 0-100 risk score, no 50-threshold JIT gate, no allowlist micro-segmentation) | `startZeroTrustSession` / `evaluatePosture` / `scoreRisk` / `requestJit` / `enforceMicroSegment` |
| SIEM audit | "The SIEM ingested the raw event but the correlation rule never fired because the retention step was skipped and the event id was missing from the correlation set" (no Splunk-CIM shape, no tamper-evident seal chain, no hot / warm / cold retention, no all-required correlation rule) | `startSiemAuditSession` / `structureEvent` / `sealEvents` / `applyRetention` / `correlate` |
| Incident response | "The post-mortem said `oops, we restarted the service` and shipped as-is because the harness never enforced a root-cause floor or an action-item minimum" (no 5-tier severity, no channel + primary on-call check, no artifact-size record, no root-cause 10-char floor) | `startIncidentSession` / `triggerPlaybook` / `classifySeverity` / `escalate` / `captureForensics` / `recordPostMortem` |
| Cryptography advanced | "The envelope-encrypted key rotated but the KDF derived the same key material because the nonce reuse was not caught, and the AEAD sealed a payload with a stale key without a rotation event" (no AEAD nonce-reuse guard, no KDF salt uniqueness, no envelope key rotation, no HSM sign path, no post-quantum KEM) | `startCryptoSession` / `sealAead` / `deriveKey` / `wrapEnvelope` / `rotateKey` / `signWithHsm` / `encapsulatePq` |
| Container / K8s | "The pod ran as root because the Pod Security Standard was `baseline` instead of `restricted`, and the network policy skipped the workload namespace" (no pod-security enforcement, no network policy allowlist, no admission-controller deny path) | `startK8sSession` / `enforcePodSecurity` / `applyNetworkPolicy` / `decideAdmission` |
| Supply chain | "The build claimed SLSA 3 but the isolation signal was false and the CI operator only noticed after a downstream consumer rejected the attestation" (no 8-signal SLSA level classifier, no reproducible-build hash match, no builder-id + materials-count provenance, no 1+ valid-signature attestation check) | `startSupplyChainSession` / `verifySlsaLevel` / `matchReproducibleBuild` / `signProvenance` / `verifyAttestation` |
| Web Vitals security | "The subresource-integrity hash was set but the trusted-types policy was missing, and the permissions policy allowed `microphone` in an iframe that had no need for it" (no SRI hash verify, no trusted-types enforce, no permissions-policy allowlist, no cross-origin isolation `same-origin` gate) | `startWvsSession` / `verifySri` / `enforceTrustedTypes` / `applyPermissionsPolicy` / `enforceCrossOriginIsolation` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Istio / OPA / Splunk HEC / Vault, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 82 covers the mTLS + zero-trust chain end-to-end (handshake → pin → OCSP → CT → posture → risk → JIT → segment), tutorial 83 covers the SIEM audit + incident response chain (structure → seal → retention → correlate → playbook → severity → escalate → forensics → post-mortem), tutorial 84 covers the supply chain SLSA chain (level → reproducible → provenance → attestation). The remaining 3 axes (cryptography advanced, container / K8s, web vitals security) have full API coverage in v1.39-1 and dedicated tutorial coverage in a later milestone.

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across istio + opa + siem-splunk + vault), the emitted event dialects are provider-specific (`istio.mtls.handshake` vs. `opa.mtls.handshake` vs. `splunk.mtls.handshake` vs. `vault.mtls.handshake`), and the advanced fidelity harness reports the coverage explicitly through `SECURITY_ADV_FIDELITY_GRID`.

| Provider | mTLS | Zero-trust | SIEM audit | Incident resp | Crypto adv | Container / K8s | Supply chain | Web Vitals sec |
|---|---|---|---|---|---|---|---|---|
| istio | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| opa | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| siem-splunk | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| vault | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v0.2 advanced grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a policy that runs under istio + opa + splunk + vault without change) even possible. The neutral event names live in the v0.2 `types.ts` SSOT and the per-provider dialect table is a static lookup — a new provider drops into the same shape.

### Why the advanced grid is fully covered

istio + opa + siem-splunk + vault converged on the same neutral events at the "operate on a security signal, decide an outcome, emit an audit event" primitive — the "advanced security policy over a service-mesh + policy-engine + SIEM + secrets-vault stack" shape is the same across all 4 providers, even though the wire encodings differ (sidecar-injected mTLS vs. rego evaluation vs. HEC event ingest vs. transit engine call). The `providerAdvEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.39 advanced fidelity grid at 32/32 = 100 % implemented reflects that convergence at the "advanced security decision" level.

## The `KIWA_MODE=real` env-gate contract for the advanced grid

`skipUnlessAdvReal(provider, env)` returns `{ skip: false, reason: 'KIWA_MODE=real + required env present — real driver' }` when `env.KIWA_MODE === 'real'` and the required env for that provider is set, and `{ skip: true, reason: 'KIWA_MODE!=real (got "unset") — mock driver' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip)` block.

Per-provider required-env mapping (`ADV_REQUIRED_KEYS`).

- **istio** → `KIWA_MODE` + `KIWA_ISTIO_URL` (Istio control plane / pilot; `KIWA_ISTIO_TOKEN` optional bearer)
- **opa** → `KIWA_MODE` + `KIWA_OPA_URL` (OPA data API endpoint; `KIWA_OPA_TOKEN` optional bearer)
- **siem-splunk** → `KIWA_MODE` + `KIWA_SPLUNK_HEC_URL` + `KIWA_SPLUNK_HEC_TOKEN` (Splunk HEC ingest endpoint + HEC token)
- **vault** → `KIWA_MODE` + `KIWA_VAULT_URL` + `KIWA_VAULT_TOKEN` (HashiCorp Vault API endpoint + auth token)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required env are present. That means CI stays cheap by default (mock only, ms scale), the nightly job flips `KIWA_MODE=real` + the required `_URL` / `_TOKEN` envs, and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode — the test still runs, the real-driver assertions get skipped. Absent `KIWA_MODE` means fall back to mock. An invalid `KIWA_MODE` value (anything other than `real`) also falls back to mock so a typo does not break tests.

## The dogfood app new pattern

The 3 dogfood apps (v1.39-2/3/4) each expose a `pnpm test` command that keeps the mock-only path green sub-second, and are wired for `pnpm test:real` follow-up phases when the required envs are present.

- `examples/dogfood-security-mtls-zero-trust-app` — Istio mTLS + certificate pinning + OCSP stapling + CT log + OPA zero-trust posture + risk score + JIT + micro-segmentation + `pnpm test:real` that walks the mTLS + zero-trust chain against a real Istio sidecar + OPA data API. 74 test.
- `examples/dogfood-security-siem-incident-app` — Splunk HEC structured logging + tamper-evident seal + retention + correlation + Vault-backed incident response playbook + severity + escalation + forensics + post-mortem + orchestrator + `pnpm test:real` that walks the SIEM + IR chain against a real Splunk HEC + Vault backend. 85 test.
- `examples/dogfood-security-supply-chain-slsa-app` — sigstore + in-toto SLSA level + reproducible build + signed provenance + attestation + `pnpm test:real` that walks the supply chain against a real sigstore + in-toto attestation engine. 76 test.

The pattern each new app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:e2e` command that spins the docker-compose stack (Istio sidecar + OPA data API + Splunk HEC + Vault, subset per app) and walks the real security policy flow.
3. Add a `pnpm test:real` command that requires the axis-specific `_URL` / `_TOKEN` env(s) and routes through the real provider endpoint.
4. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
5. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.

## The `not-implemented` failure mode

If the advanced fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 32-cell advanced grid at v1.39 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th advanced axis (e.g., `confidential-computing-tee` or `runtime-app-self-protection`), it will start as `planned` for all 4 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.39 does not add a 14th release-gate axis. The 8 advanced security axes gate the security package's own tests (via `pnpm --filter @kiwa/security test`) but do not surface as a per-package `@kiwa/quality-metrics` axis. The reasoning — the advanced fidelity harness is provider-shape-specific, and a package that does not export to istio / opa / splunk / vault has nothing to assert on. When a future milestone adds a `security.advanced.fidelity` axis that describes "which advanced security providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.39 keeps the axis count at 13.

## The v0.1 → v0.2 pair 深化 relationship

v1.39 is the 9th pair 2 段拡張 in kiwa's 縦深化 progression. The v0.1 base grid + the v0.2 advanced grid together form a full "security posture at the HTTP request layer + service mesh + policy engine + SIEM + secrets vault" coverage — the base grid covers the request-time decision layer (CSP / rate limit / authorization / WAF / threat model / secrets scan / SBOM / security headers), and the advanced grid covers the "beyond request time" layers (mTLS / zero-trust / SIEM / IR / crypto / K8s / supply chain / web vitals security). A production stack usually adopts the base grid first (fast to land, low blast radius) and layers the advanced grid on top as the stack matures.

Naming convention — the base grid uses "security" as the axis prefix (`csp` / `rate-limit` / `authorization` / `waf` / `threat-model` / `secrets-scan` / `sbom` / `security-headers`), and the advanced grid uses topic prefixes (`mtls` / `zero-trust` / `siem-audit` / `incident-response` / `crypto-advanced` / `container-k8s` / `supply-chain` / `web-vitals-security`). The two prefix families do not collide, so a downstream consumer can pick both grids without renaming.

## SSOT boundaries

- The 8 advanced security axes live in this doc. Tutorials 82-84 and the migration guide (v1.38 → v1.39) link back here for the axis SSOT.
- The v0.1 base security axes live in `security-real-driver-testing.md` (v1.37). This doc does not restate the v0.1 axes — read that doc first if you have not already onboarded the v0.1 base grid.
- The `KIWA_MODE=real` env-gate contract lives in the `real-driver-testing.md` general concept doc. This doc does not restate the general contract, only the per-advanced-provider mapping (`ADV_ENDPOINT_ENV_KEY` + `ADV_API_KEY_ENV_KEY` + `ADV_REQUIRED_KEYS`).
- The fidelity harness that ties the mock output back to the real driver output lives in the `payment-real-driver-testing.md` / `frontend-real-driver-testing.md` / `observability-real-driver-testing.md` / `search-real-driver-testing.md` / `security-real-driver-testing.md` / `ai-llm-real-driver-testing.md` concept docs (per milestone). The advanced grid uses the same harness shape as the base grid; the only differences are the provider set and the axis prefix family.

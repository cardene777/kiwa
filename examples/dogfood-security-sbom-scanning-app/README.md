# dogfood-security-sbom-scanning-app (v1.37-4)

A Trivy + Gitleaks style SBOM + secret scanning service that drives CycloneDX 1.5 emission + SPDX 2.3 emission + OSV / NVD advisory lookup + SPDX license policy + TruffleHog / Gitleaks signatures + rotation SLA tracking across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa-lab/security` v0.1 sbom + secrets-scan semantics) and real (Trivy + Gitleaks scanner stack driver when `SBOM_SCANNER_READY=1` + `KIWA_TRIVY_ENDPOINT` + `KIWA_GITLEAKS_ENDPOINT` + `KIWA_ADVISORY_FEED_URL` are set) implementations satisfy the same 14-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-sbom-scanning-app test
pnpm --filter dogfood-security-sbom-scanning-app test:e2e
```

The vitest suite drives the mock adapter through the same sbom / secrets-scan / scanner handlers the runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export SBOM_SCANNER_READY=1
export KIWA_TRIVY_ENDPOINT=http://localhost:8080
export KIWA_GITLEAKS_ENDPOINT=http://localhost:8081
export KIWA_ADVISORY_FEED_URL=https://osv.dev/api/v1/
pnpm --filter dogfood-security-sbom-scanning-app test
```

The real adapter defers the Trivy + Gitleaks scanner driver wiring to a follow-up milestone. Until `SBOM_SCANNER_READY=1` + the 3 endpoint env keys are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_SBOM_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 14 ops across 3 domain surfaces + 3 axes.

- **sbom surface (sbom axis: CycloneDX + SPDX + validation + license)**
  - `startSbom` — begin an SBOM assembly session
  - `addComponent` — append a component (name + version + purl + optional license) to the session
  - `emitCycloneDx` — emit a CycloneDX 1.5 document with the collected components
  - `emitSpdx` — emit an SPDX 2.3 document with the collected components
  - `validateSbom` — validate mandatory fields + purl syntax and report errors
  - `evaluateLicense` — apply the SPDX license policy across components and reduce to `allow` / `warn` / `deny`
  - `closeSbom` — finalize the session (subsequent addComponent raises)
- **secrets-scan surface (secrets-scan axis: TruffleHog + Gitleaks + rotation)**
  - `startSecrets` — begin a secret scanning session with a rotation SLA (days)
  - `scanSource` — apply TruffleHog + Gitleaks style signatures + entropy filter against a source string
  - `trackRotation` — record a finding under the session's rotation policy
  - `markRotated` — flip a tracker into rotated state and report whether rotation was overdue
  - `closeSecrets` — finalize the session (subsequent scanSource raises)
- **scanner surface (scanner axis: OSV / NVD + Trivy-style report)**
  - `lookupAdvisories` — join the session SBOM against an in-memory OSV / NVD advisory feed
  - `buildReport` — compose SBOM component count + advisory count + secret count + license verdict into a single Trivy-style report

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-lab/quality-metrics` picks up for the 13-axis release gate. The doc counterpart is added alongside the existing security dogfood entries.

# dogfood-security-csp-headers-app (v1.37-2)

A Next.js 15.4 + React 19.1 App Router app that drives CSP (nonce + hash + strict-dynamic + trusted-types + report-only) + advanced security headers (HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy) + CSP violation reporting across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa-test/security` v0.1 csp + security-headers semantics) and real (Playwright + Chromium headless when `CSP_BROWSER_READY=1`) implementations satisfy the same 15-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-csp-headers-app test
pnpm --filter dogfood-security-csp-headers-app test:e2e
```

The vitest suite drives the mock adapter through the same csp / violation / headers handlers the Next.js runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export CSP_BROWSER_READY=1
pnpm --filter dogfood-security-csp-headers-app test
```

The real adapter defers the Playwright + Chromium browser session wiring to a follow-up milestone. Until `CSP_BROWSER_READY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_CSP_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 15 ops across 3 domain surfaces + 3 axes.

- **csp surface (csp axis: nonce + hash + strict-dynamic + trusted-types + report-only)**
  - `startCsp` — begin a CSP builder session
  - `attachNonce` — append per-request nonce to script-src (validates >= 22 base64url chars)
  - `attachHash` — append sha256 / sha384 / sha512 inline script hash
  - `applyStrictDynamic` — enable `'strict-dynamic'` (raises if no nonce or hash present at emit time)
  - `applyTrustedTypes` — enable `trusted-types` + optional `require-trusted-types-for 'script'`
  - `emitCspHeader` — return `Content-Security-Policy` or `Content-Security-Policy-Report-Only` header
- **violation surface (violation axis: report-to + report-uri + violation trace)**
  - `startViolation` — begin a violation reporting session
  - `ingestViolation` — capture directive + blocked-uri + disposition (enforce / report)
  - `recordViolationEvent` — attach allow / deny / warn verdict + reason to the last ingested violation
  - `closeViolation` — finalize the session (subsequent ingest raises)
- **headers surface (headers axis: HSTS + X-Frame + X-Content-Type + Referrer + Permissions)**
  - `startHeaders` — begin an advanced security headers session
  - `applyHsts` — write `Strict-Transport-Security` (raises on preload without includeSubDomains or max-age < 1 year)
  - `applyReferrerPolicy` — write `Referrer-Policy` (validates against the 8 canonical values)
  - `applyPermissionsPolicy` — write `Permissions-Policy` (per-feature allowlist, formerly Feature-Policy)
  - `emitHeaderBundle` — return the full bundle, folding in `X-Frame-Options` and `X-Content-Type-Options: nosniff`

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-test/quality-metrics` picks up for the 13-axis release gate. The doc counterpart lives at `docs/quality-reports/security/csp-headers-app.md`.

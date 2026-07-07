# kiwa v1.37 x-thread (English)

## Tweet 1 — hook

kiwa v1.37 is out — Security 深化 land.

@kiwa-test/security v0.1.0 new package. 8 axis security semantics across 4 provider × 8 axis = 32 cell fidelity grid.

Real driver env-gate (KIWA_MODE=real + HELMET_VERSION / RATE_LIMIT_VERSION / CASBIN_VERSION / CORAZA_VERSION). 3 dogfood app new (security-csp-headers-app + security-rbac-abac-app + security-sbom-scanning-app) 全 7 軸 release gate PASS.

Vertical deepening pair pattern 第 9 pair 連続化 (Security new base pair).

## Tweet 2 — 8 axis security semantics

- CSP — strict-dynamic + nonce + hash + trusted-types + report-only
- Rate limit — token bucket + leaky bucket + sliding window + fixed window
- Authorization — RBAC + ABAC + role hierarchy + policy engine + combining algorithm
- WAF — Coraza + OWASP CRS + rule syntax + phase transition
- Threat model — STRIDE + PASTA + DREAD + attack tree
- Secrets scanning — TruffleHog + Gitleaks + entropy gate + secret detection
- SBOM — CycloneDX + SPDX + OSV advisory + license policy
- Security headers — HSTS + permissions-policy + helmet + x-frame-options + referrer-policy

## Tweet 3 — vertical deepening pair pattern 9 pair grid

Auth / Realtime / Streaming / Database / Payment / Frontend / Observability / Search + Security new base. kiwa 系 monorepo 35 → 36 package 到達.

## Tweet 4 — snippet streak + npm publish

15 milestone 連続 snippet validation streak (v1.23-v1.37) 達成.

`pnpm add -D @kiwa-test/security` で v0.1.0 が入る. zero breaking changes. migration guide は https://cardene777.github.io/kiwa/migrations/v1.36-to-v1.37

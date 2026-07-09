# kiwa v1.37 released — Security 深化 (@kiwa-lab/security v0.1.0 新規 + 8 axis security + 縦深化 pair 第 9 pair 連続化 + 新規 base pair)

## TL;DR

- **kiwa v1.37 released** — Security 深化 milestone
- **`@kiwa-lab/security` v0.1.0 新規 package** — 8 axis security semantics + real driver env-gate + 4 provider × 8 axis neutral state machine
- **8 axis semantics** = CSP + Rate limit + Authorization + WAF + Threat model + Secrets scanning + SBOM + Security headers advanced
- **3 dogfood app 新規** — security-csp-headers-app + security-rbac-abac-app + security-sbom-scanning-app
- **縦深化 pair pattern 第 9 pair 連続化** — Security 新規 base pair (v1.37 base、 v1.38+ で II 予定)
- **15 milestone 連続 snippet validation streak** (v1.23-v1.37)
- **kiwa 系 monorepo 35 → 36 package 到達**
- v1.11 以降 27 milestone 連続完遂

## v1.37 が解決したい問題 — Security production semantics の testing gap

kiwa は v1.36 まで dApp / web app / full-stack framework / 実 backend / real-time / payment / observability / search の 34 layer + release-invariants + a11y + component / performance / mutation の quality gate maximum grid を cover していたが、 security 領域は auth (v1.21-v1.22 で cover) 以外の CSP / Rate limit / Authorization / WAF / Threat model / Secrets scanning / SBOM / Security headers advanced が **未 cover** の状態だった.

v1.37 で `@kiwa-lab/security` v0.1.0 を **新規 package** として追加、 8 axis を helmet + express-rate-limit + casbin + coraza の 4 provider 統一 mock として実装、 CSP nonce + strict-dynamic + trusted-types、 Rate limit token bucket + leaky bucket + sliding window、 Authorization RBAC + ABAC、 WAF OWASP CRS、 Threat model STRIDE、 Secrets scanning TruffleHog + Gitleaks、 SBOM CycloneDX + SPDX + OSV、 Security headers HSTS + permissions-policy を 1 test surface で扱える security backbone testing 基盤を追加した.

## v1.37 で追加した 8 axis security semantics

### 1. CSP strict-dynamic

nonce + hash + trusted-types + report-only + report-to + report-uri.

### 2. Rate limit

token bucket + leaky bucket + sliding window + fixed window + distributed rate limit + per-user / per-ip.

### 3. Authorization (RBAC + ABAC)

role hierarchy + policy engine + combining algorithm + attribute + condition + ABAC-XACML alignment.

### 4. WAF (Coraza + OWASP CRS)

rule syntax + phase transition + anomaly scoring + paranoia level + rule tuning.

### 5. Threat model

STRIDE + PASTA + DREAD + attack tree + threat actor.

### 6. Secrets scanning

TruffleHog + Gitleaks + entropy gate + secret detection + custom signature.

### 7. SBOM

CycloneDX + SPDX + OSV advisory + NVD lookup + license policy + vulnerability aggregation.

### 8. Security headers advanced

HSTS + permissions-policy + helmet + x-frame-options + referrer-policy + cross-origin isolation.

## 3 dogfood security app 新規

### `dogfood-security-csp-headers-app` 新規

Next.js + CSP nonce + strict-dynamic + trusted-types + security headers advanced walkthrough、 70 test.

### `dogfood-security-rbac-abac-app` 新規

Casbin + RBAC + ABAC + policy engine + role hierarchy walkthrough、 86 test.

### `dogfood-security-sbom-scanning-app` 新規

Trivy + CycloneDX + SPDX + Gitleaks + OSV/NVD + license policy walkthrough、 62 test.

## Try it

```bash
pnpm add -D @kiwa-lab/security
```

Migration guide (additive-only、 breaking change なし):

- [v1.36 → v1.37 migration guide](https://cardene777.github.io/kiwa/migrations/v1.36-to-v1.37)
- [Security real-driver testing SSOT concept doc](https://cardene777.github.io/kiwa/concepts/security-real-driver-testing)

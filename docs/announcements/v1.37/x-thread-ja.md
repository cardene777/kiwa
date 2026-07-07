# kiwa v1.37 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.37 リリース — Security 深化 が land.

@kiwa-test/security v0.1.0 新規 package. 4 provider (helmet + express-rate-limit + casbin + coraza) 上に security semantics 8 axis を追加.

real driver env-gate (KIWA_MODE=real + HELMET_VERSION / RATE_LIMIT_VERSION / CASBIN_VERSION / CORAZA_VERSION) で opt-in production fidelity 走査. dogfood 3 app 新規 (security-csp-headers-app + security-rbac-abac-app + security-sbom-scanning-app) 全 7 軸 release gate PASS.

## Tweet 2 — 8 axis security semantics

CSP strict-dynamic / Rate limit / Authorization RBAC-ABAC / WAF Coraza / Threat model STRIDE / Secrets scanning / SBOM CycloneDX / Security headers HSTS.

## Tweet 3 — 縦深化 pair pattern 9 pair grid

Security v1.37 は 新規 base pair として登場. Auth + Realtime + Streaming + Database + Payment + Frontend + Observability + Search に続く 9 pair 目. kiwa 系 monorepo 35 → 36 package 到達.

## Tweet 4 — snippet streak + npm publish

15 milestone 連続 snippet validation streak (v1.23-v1.37) 達成.

`pnpm add -D @kiwa-test/security` で v0.1.0 が入る. breaking change なし. migration guide は https://cardene777.github.io/kiwa/migrations/v1.36-to-v1.37

# kiwa v1.37 released — Security 深化 (@kiwa/security v0.1.0 新規 + 8 axis security + 3 dogfood app + 縦深化 pair 第 9 pair 連続化 + 15 milestone snippet streak)

v1.37 is out. **`@kiwa/security` v0.1.0 新規 package** で kiwa 系 monorepo 35 → 36 package 到達。 CSP + Rate limit + Authorization + WAF + Threat model + Secrets scanning + SBOM + Security headers advanced の 8 axis を 4 provider (helmet + express-rate-limit + casbin + coraza) 統一 mock として実装、 4 provider × 8 axis = 32 combination fidelity harness + real driver env-gate を確立、 kiwa の縦深化戦略 SSOT を security production layer に拡張した milestone.

## What shipped

- **`@kiwa/security` v0.1.0 新規 package**. kiwa 系 monorepo 36 package 目 (v1.29 release-invariants + v1.36 search v0.3 に続く 3 個目の 新規 package 追加、 v1.14 payment omission avoidance pattern SSOT 継続適用).
- **v1.37-1 security v0.1 8 axis semantics** (Issue #1087). CSP strict-dynamic / Rate limit / Authorization RBAC + ABAC / WAF Coraza + OWASP CRS / Threat model STRIDE / Secrets scanning TruffleHog + Gitleaks / SBOM CycloneDX + SPDX / Security headers HSTS + permissions-policy の 8 axis を統一実装、 4 provider (helmet + express-rate-limit + casbin + coraza) × 8 axis = 32 cell fidelity grid を確立、 258 test.
- **v1.37-2 dogfood-security-csp-headers-app 新規** (Issue #1089). Next.js + CSP nonce + strict-dynamic + trusted-types + security headers advanced walkthrough、 70 test.
- **v1.37-3 dogfood-security-rbac-abac-app 新規** (Issue #1090). Casbin + RBAC + ABAC + policy engine + role hierarchy walkthrough、 86 test.
- **v1.37-4 dogfood-security-sbom-scanning-app 新規** (Issue #1091). Trivy + CycloneDX + SPDX + Gitleaks + OSV/NVD + license policy walkthrough、 62 test.
- **v1.37-5 docs 補強** (Issue #1092). `docs/tutorials/76-csp-strict-dynamic.md` + `docs/tutorials/77-rbac-abac-policy.md` + `docs/tutorials/78-sbom-license-scanning.md` + `docs/migrations/v1.36-to-v1.37.md` + `docs/concepts/security-real-driver-testing.md` + `packages/security/tests/docs-tutorial-v1.37.test.ts` snippet validation で **15 milestone 連続 snippet validation pattern** (v1.23-v1.37) 達成.
- **v1.37-6 publish** (Issue #1093, this PR). `.claude-plugin/plugin.json` 1.36.0 → 1.37.0 + description v1.37 marker + security keywords + Roadmap ✅ v1.37 row + announcement 4 file + release-smoke `v1-37-publish.test.ts` + release script filter に `@kiwa/security` 存在確認 (12 度目の適用).

## Numbers

- **6 sub-Issues resolved** (#1087 / #1089 / #1090 / #1091 / #1092 / #1093)
- **1 npm 新規 package** (`@kiwa/security` v0.1.0)
- **8 axis security semantics** (CSP + Rate limit + Authorization + WAF + Threat model + Secrets scanning + SBOM + Security headers)
- **32 cell fidelity grid** (4 provider × 8 axis = 32 cell)
- **3 dogfood security app** (security-csp-headers-app + security-rbac-abac-app + security-sbom-scanning-app、 全て 新規)
- **15 milestone 連続 snippet validation streak** (v1.23-v1.37)
- **kiwa 系 monorepo 35 → 36 package 到達**

## Why 縦深化 pair pattern 第 9 pair 連続化 (新規 base pair)

Security は v1.37 で **新規 base pair** として登場 (既存 pair とは異なり pair の第 1 stage を v1.37 で確立、 v1.38+ で II を追加する予定). Auth / Realtime / Streaming / Database / Payment / Frontend / Observability / Search で 8 pair 連続化 + Security 新規 base で 9 pair 連続化.

## Try it

```bash
pnpm add -D @kiwa/security
```

See the migration guide at https://cardene777.github.io/kiwa/migrations/v1.36-to-v1.37. Zero breaking changes.

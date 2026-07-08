---
title: DevSecOps library integration — skill 置換 pattern SSOT
---

# DevSecOps library integration — skill 置換 pattern SSOT

## What this covers

`@kiwa-test/security-devsecops` v0.1 (v1.46-4) を dev-flow の security 4 skill 経路 (security-audit + security-audit-supply-chain + security-audit-specialty + security-audit-threat-model) から使う統一 pattern。 これまで各 skill が bash / Codex 委譲で個別に scan tool を叩いていた経路を、 library 経由で test 可能な形に置換する SSOT。

## v1.46 の置換方針

### 従来 skill 経路 (置換前)

- **security-audit** — `bash` で SAST/SCA/Secrets/IaC/DAST/Container の 6 scan を CLI 経由 (semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype) で個別実行、 結果を markdown 集約
- **security-audit-supply-chain** — SCA + Container 特化、 CVE + license + typosquatting を bash で走査
- **security-audit-specialty** — API / Crypto / OAuth 等 domain 別 scan、 別 skill 委譲 pattern
- **security-audit-threat-model** — STRIDE / DREAD 手動 threat model、 skill 内で prompt 誘導

**問題** — bash / Codex 委譲経路のため、 skill 出力の再現性 test / regression test が書けない。 kiwa 側で「library として提供して skill が呼ぶ」 pattern に統一することで、 library 側で test 可能になる。

### 置換後 skill 経路 (v1.46 SSOT)

各 skill は `@kiwa-test/security-devsecops` v0.1 の 6 axis semantics を経由して scan を state machine 化する。 skill 実行 = library の state machine を driving + neutral event 収集 + 結果集約。

```ts
// security-audit skill 内部で呼ぶ pattern
import {
  startSastScan,
  detectSastFinding,
  completeSastScan,
  startScaScan,
  detectScaVuln,
  completeScaScan,
  startSecretScan,
  matchSecretPattern,
  completeSecretScan,
  startIacScan,
  detectIacMisconfig,
  completeIacScan,
  startDastScan,
  attemptDastAttack,
  confirmDastVuln,
  completeDastScan,
  startContainerScan,
  detectContainerCve,
  flagContainerMalware,
  completeContainerScan,
} from '@kiwa-test/security-devsecops';

// SAST axis
const sast = startSastScan({ scanId: 'audit-1', target: 'src/' });
// bash / adapter 経由で実 semgrep 結果を取得 → detectSastFinding に流し込む
// (v0.1 は semantics only、 v0.2 で adapter 経由の実 scan 統合予定)
for (const finding of semgrepResults) {
  detectSastFinding(sast, finding);
}
const sastReport = completeSastScan(sast);
```

## 4 skill × 6 axis 対応 map

| skill | 主 axis | 副 axis |
|---|---|---|
| security-audit | SAST + SCA + Secret + IaC + DAST + Container (全 6 axis) | — |
| security-audit-supply-chain | SCA + Container | SBOM (v0.2 追加予定) |
| security-audit-specialty | Domain-specific config → 6 axis 選択呼出 | ワークフローで組合せ |
| security-audit-threat-model | 全 axis の結果 → STRIDE / DREAD 分類 | 手動 review 併用 |

## 置換手順 (skill 側 SKILL.md 更新)

各 skill の SKILL.md に追加する section。

```markdown
## v1.46+ library 経路 (SSOT)

本 skill は v1.46 以降 `@kiwa-test/security-devsecops` v0.1 の 6 axis semantics 経由で scan を state machine 化する。

- SAST → `startSastScan` + `detectSastFinding` + `completeSastScan`
- SCA → `startScaScan` + `detectScaVuln` + `completeScaScan`
- Secret → `startSecretScan` + `matchSecretPattern` + `completeSecretScan`
- IaC → `startIacScan` + `detectIacMisconfig` + `completeIacScan`
- DAST → `startDastScan` + `attemptDastAttack` + `completeDastScan`
- Container → `startContainerScan` + `detectContainerCve` + `completeContainerScan`

skill 実行結果は library の neutral event history を経由するため、 skill 出力を test / regression check 可能。 従来の bash / Codex 委譲経路は fallback として `--legacy` flag で利用可能。
```

## 段階的移行 pattern

- **Phase 1 (v1.46)** = library v0.1 semantics のみ提供、 skill は semantics 経由に move
- **Phase 2 (v1.47+)** = library v0.2 で adapter 経由の実 scan 統合 (semgrep / trivy CLI 呼出を library 内に隠蔽)
- **Phase 3 (v1.48+)** = 4 skill を library single entry (`runSecurityAudit`) 経由に統合、 skill 個別化を減らす

## 関連

- `@kiwa-test/security` v0.2 (v1.39) — runtime security (CSP + mTLS + SIEM + SLSA) を扱う別 package
- `@kiwa-test/security-devsecops` v0.1 (v1.46) — build-time / CI-time security scanning を扱う本 package
- `docs/quality/perf-thresholds.md` — perf threshold SSOT (v0.4 strict と関連)
- `rules/quality.md` — dev-flow quality gate SSOT

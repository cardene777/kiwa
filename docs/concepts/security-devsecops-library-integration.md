---
title: DevSecOps library integration — skill 置換 pattern SSOT
---

# DevSecOps library integration — skill 置換 pattern SSOT

## What this covers

`@kiwa/security-devsecops` v0.1 (v1.46-4) を dev-flow の security 4 skill 経路 (security-audit + security-audit-supply-chain + security-audit-specialty + security-audit-threat-model) から使う統一 pattern。 これまで各 skill が bash / Codex 委譲で個別に scan tool を叩いていた経路を、 library 経由で test 可能な形に置換する SSOT。

## v1.46 の置換方針

### 従来 skill 経路 (置換前)

- **security-audit** — `bash` で SAST/SCA/Secrets/IaC/DAST/Container の 6 scan を CLI 経由 (semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype) で個別実行、 結果を markdown 集約
- **security-audit-supply-chain** — SCA + Container 特化、 CVE + license + typosquatting を bash で走査
- **security-audit-specialty** — API / Crypto / OAuth 等 domain 別 scan、 別 skill 委譲 pattern
- **security-audit-threat-model** — STRIDE / DREAD 手動 threat model、 skill 内で prompt 誘導

**問題** — bash / Codex 委譲経路のため、 skill 出力の再現性 test / regression test が書けない。 kiwa 側で「library として提供して skill が呼ぶ」 pattern に統一することで、 library 側で test 可能になる。

### 置換後 skill 経路 (v1.46 SSOT)

各 skill は `@kiwa/security-devsecops` v0.1 の 6 axis semantics を経由して scan を state machine 化する。 skill 実行 = library の state machine を driving + neutral event 収集 + 結果集約。

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
} from '@kiwa/security-devsecops';

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

本 skill は v1.46 以降 `@kiwa/security-devsecops` v0.1 の 6 axis semantics 経由で scan を state machine 化する。

- SAST → `startSastScan` + `detectSastFinding` + `completeSastScan`
- SCA → `startScaScan` + `detectScaVuln` + `completeScaScan`
- Secret → `startSecretScan` + `matchSecretPattern` + `completeSecretScan`
- IaC → `startIacScan` + `detectIacMisconfig` + `completeIacScan`
- DAST → `startDastScan` + `attemptDastAttack` + `completeDastScan`
- Container → `startContainerScan` + `detectContainerCve` + `completeContainerScan`

skill 実行結果は library の neutral event history を経由するため、 skill 出力を test / regression check 可能。 従来の bash / Codex 委譲経路は fallback として `--legacy` flag で利用可能。
```

## 段階的移行 pattern

- **Phase 1 (v1.46) ✅** = library v0.1 semantics のみ提供、 skill は semantics 経由に move
- **Phase 2 (v1.47) ✅** = library v0.2 で adapter 経由の実 scan 統合 (semgrep / trivy CLI 呼出を library 内に隠蔽)
- **Phase 3 (v1.48) ✅** = 4 skill を library single entry (`runSecurityAudit`) 経由に統合、 skill 個別化を排除

## Phase 3 完成 SSOT (v1.48)

v1.48 で `@kiwa/security-devsecops` v0.3 を release、 `runSecurityAudit` single entry + 4 preset SSOT + summary API 追加。 Phase 1 + Phase 2 の上に乗る optional path、 従来経路も動作継続。

### 3 段の階層構造

- **Phase 1 semantics** = 細かい finding driving (低レベル)、 use case = custom logic 挟む、 test fixture
- **Phase 2 adapter** = axis 単位 workflow (中レベル)、 use case = 特定 axis のみ mock/real 切替
- **Phase 3 orchestrator** = skill / workflow (高レベル)、 use case = 4 preset で skill 置換

### 4 preset × skill 対応 map

| preset | axis 実行数 | 対応 skill | 特徴 |
|---|---|---|---|
| audit-all | 6 (全 axis) | security-audit | 全 axis 実行 |
| supply-chain | 2 (SCA + Container) | security-audit-supply-chain | 供給チェーン特化 |
| specialty | 3 (SAST + Secret + DAST) | security-audit-specialty | domain 特化 |
| threat-model | 6 (全 axis) + STRIDE tag | security-audit-threat-model | STRIDE 分類添付 |

### single entry 実装 pattern

```ts
import {
  runSecurityAudit,
  summarizeAuditReport,
  type AuditPreset,
} from '@kiwa/security-devsecops';

// skill 4 種を library で置換
async function runSkill(preset: AuditPreset, target: string) {
  const report = await runSecurityAudit({ preset, target, mode: 'mock' });
  const summary = summarizeAuditReport(report);
  return { report, summary };
}

// audit-all skill 実行
const audit = await runSkill('audit-all', '/repo');
console.log(audit.summary.completedAxis); // 6

// threat-model skill 実行 (STRIDE tag 添付)
const threat = await runSkill('threat-model', '/repo');
console.log(threat.summary.stridDreadTags); // 6 tags
```

### AuditReport → AuditSummary 集約 SSOT

- totalAxis / completedAxis = 完了状態
- totalEvents = 全 axis event 総数
- totalDurationMs = 全体実行時間
- perAxis = axis 単位 completed + eventCount
- stridDreadTags = threat-model preset のみ添付 (他 preset は undefined)

### DevSecOps library 化計画完遂

Phase 1 (semantics) → Phase 2 (adapter) → Phase 3 (orchestrator) の 3 段完成で、 skill 4 種は library single entry 経由に置換可能に。 skill 個別化の workload を library に集約、 kiwa の DevSecOps library 化計画は v1.48 で完遂。

## Phase 4 (v1.49+) 計画

- **v0.4 spawn 実装** = real adapter が実 semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype CLI を child_process.spawn で呼出、 fidelity harness で mock/real 差分を実 CLI 経路で監視
- **7 axis 目 / 8 axis 目 追加** = SBOM (CycloneDX / SPDX) + SLSA provenance (build-time attestation)
- **perf-harness strict mode 統合** = adapter 呼出 latency baseline 化

## Phase 2 完成 SSOT (v1.47)

v1.47 で `@kiwa/security-devsecops` v0.2 を release、 6 axis × mock/real adapter pair 追加。 backward compat 維持で v0.1 semantics 直接使用は継続、 adapter は新規 optional path。

### v0.2 adapter interface

```ts
import type {
  AdapterInvocation,
  AdapterResult,
  SastAdapter,
  ScaAdapter,
  SecretAdapter,
  IacAdapter,
  DastAdapter,
  ContainerAdapter,
} from '@kiwa/security-devsecops';

// 6 axis 共通契約 = scan(input) → AdapterResult<TState>
export interface CommonAdapter {
  axis: DevSecOpsAxis;
  scan(input: AdapterInvocation): Promise<AdapterResult<TState>>;
}
```

### adapter 経由 skill 実装 pattern

```ts
// v1.47 security-audit skill 内部で使う adapter 経路
import {
  sastMockAdapter,
  sastRealAdapter,
  scaMockAdapter,
  scaRealAdapter,
  secretScanMockAdapter,
  secretScanRealAdapter,
  iacScanMockAdapter,
  iacScanRealAdapter,
  dastMockAdapter,
  dastRealAdapter,
  containerSecurityMockAdapter,
  containerSecurityRealAdapter,
  type AdapterMode,
} from '@kiwa/security-devsecops';

// mode 切替 = default mock、 KIWA_SECURITY_MODE=real で real 呼出
async function runAudit(mode: AdapterMode, target: string) {
  const adapters = mode === 'mock'
    ? [sastMockAdapter, scaMockAdapter, secretScanMockAdapter, iacScanMockAdapter, dastMockAdapter, containerSecurityMockAdapter]
    : [sastRealAdapter, scaRealAdapter, secretScanRealAdapter, iacScanRealAdapter, dastRealAdapter, containerSecurityRealAdapter];
  const results = [];
  for (const adapter of adapters) {
    results.push(await adapter.scan({ scanId: crypto.randomUUID(), target, mode }));
  }
  return results;
}
```

### env-gate SSOT (real adapter)

real adapter は以下 env 全部揃った時のみ CLI 呼出。 それ以外は explicit throw。

| env | 用途 | 必須 tier |
|---|---|---|
| `KIWA_SECURITY_MODE=real` | real 経路発動 SSOT | required |
| `KIWA_SEMGREP_URL` | SAST | required if SAST 実行 |
| `KIWA_TRIVY_URL` | SCA | required if SCA 実行 |
| `KIWA_GITLEAKS_URL` | Secret | required if Secret 実行 |
| `KIWA_TFSEC_URL` | IaC | required if IaC 実行 |
| `KIWA_ZAP_URL` | DAST | required if DAST 実行 |
| `KIWA_GRYPE_URL` | Container | required if Container 実行 |

### fidelity harness (mock vs real)

`examples/dogfood-security-devsecops-adapter-app/` で mock vs real の一致検証 harness を提供。

- `runAdapterWorkflow(mode, target)` = 6 adapter 横断実行
- `diffFidelity(mock, real)` = mock/real の完了状態 + event count 一致検証
- v0.3 で real adapter が実 CLI spawn 実装に置換されても harness は継続使用可能

### skill 4 種の adapter 経由経路 (Phase 2 完成)

| skill | mock 経路 | real 経路 |
|---|---|---|
| security-audit | 6 mock adapter 全実行、 test 可能 | env-gate 通過時 6 real adapter 全実行 |
| security-audit-supply-chain | scaMockAdapter + containerSecurityMockAdapter | env-gate 通過時 scaRealAdapter + containerSecurityRealAdapter |
| security-audit-specialty | domain 選択で adapter 部分実行 | env-gate 通過時 real adapter 部分実行 |
| security-audit-threat-model | 全 axis mock 結果 → STRIDE/DREAD 分類 | 全 axis real 結果 → STRIDE/DREAD 分類 |

- default 経路 = mock、 test で常時走る、 regression detect 可能
- real 経路 = local 実行時 env 設定で opt-in、 skill 出力を実 CLI 結果で置換
- 従来の bash / Codex 委譲経路は `--legacy` flag fallback として残す (Phase 3 で削除予定)

## Phase 3 (v1.48+) 計画

- 4 skill を library single entry (`runSecurityAudit`) 経由に統合、 skill 個別化を減らす
- adapter を extend して SBOM / SLSA provenance 生成 axis 追加
- perf-harness strict mode で adapter 呼出 latency baseline 化

## 関連

- `@kiwa/security` v0.2 (v1.39) — runtime security (CSP + mTLS + SIEM + SLSA) を扱う別 package
- `@kiwa/security-devsecops` v0.1 (v1.46) — build-time / CI-time security scanning を扱う本 package
- `docs/quality/perf-thresholds.md` — perf threshold SSOT (v0.4 strict と関連)
- `rules/quality.md` — dev-flow quality gate SSOT

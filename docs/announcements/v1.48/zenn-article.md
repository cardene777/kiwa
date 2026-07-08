# kiwa v1.48 リリース — security-devsecops v0.3 Phase 3 runSecurityAudit single entry 統合 (DevSecOps library 化 3 段完成、 26 milestone snippet streak)

## 概要

kiwa v1.48 をリリースしました。 **security-devsecops v0.3 Phase 3 runSecurityAudit single entry 統合** の単軸 milestone、 **DevSecOps library 化 3 段完成**。 v1.46 (Phase 1 semantics 化) + v1.47 (Phase 2 adapter 統合) の上に v0.3 orchestrator (Phase 3 single entry) を lay、 skill 4 種を library single entry で置換可能に。

## 何が変わったか

### `@kiwa-test/security-devsecops` v0.2 → v0.3 (Phase 3 完成)

- `runSecurityAudit({ preset, target, mode })` single entry 追加、 skill 個別化の workload を library に集約
- 4 preset SSOT map = audit-all / supply-chain / specialty / threat-model
- `summarizeAuditReport` 集約 API + threat-model preset のみ STRIDE tag 添付
- backward compat 絶対維持 = v0.1 semantics + v0.2 adapter API 変更 0

### Phase 1-2-3 の 3 段階層構造

3 段の階層は backward compat 絶対維持、 use case に応じて使い分け可能。

- **Phase 1 semantics** = 細かい finding driving (低レベル)、 use case = custom logic 挟む、 test fixture
- **Phase 2 adapter** = axis 単位 workflow (中レベル)、 use case = 特定 axis のみ mock/real 切替
- **Phase 3 orchestrator** = skill / workflow (高レベル)、 use case = 4 preset で skill 置換

### 4 preset × skill 対応 map

| preset | axis 実行数 | 対応 skill |
|---|---|---|
| audit-all | 6 (全 axis) | security-audit |
| supply-chain | 2 (SCA + Container) | security-audit-supply-chain |
| specialty | 3 (SAST + Secret + DAST) | security-audit-specialty |
| threat-model | 6 (全 axis) + STRIDE tag | security-audit-threat-model |

### 1 new dogfood app + 1 tutorial + migration + concept 更新

- **dogfood-security-devsecops-orchestrator-app** = runSkill(preset, target, mode) + runAllSkills() wrapper、 11 test
- **[Tutorial 106 — DevSecOps single entry](https://cardene777.github.io/kiwa/tutorials/106-security-orchestrator)** = runSecurityAudit + 4 preset + summary walkthrough (8 min)
- Migration guide v1.47 → v1.48 = additive-only + Phase 1/2/3 の 3 pattern SSOT
- Concept doc Phase 3 完成節 = 3 段階層構造 + 4 preset × skill 対応 map + Phase 4 (v1.49+) 計画

## 26 milestone 連続 snippet validation streak 達成

v1.23 → v1.48 = 26 milestone 連続、 kiwa 史上最長記録更新継続。

## インストール

```bash
pnpm add -D @kiwa-test/security-devsecops@^0.3
```

## Migration guide

[v1.47 → v1.48](https://cardene777.github.io/kiwa/migrations/v1.47-to-v1.48)

## 次に何が来るか

v1.49 前後 = 4 候補。

- **v0.4 spawn 実装** = real adapter が実 semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype CLI を child_process.spawn で呼出、 fidelity harness で mock/real 差分を実 CLI 経路で監視
- **7 axis 目 / 8 axis 目 追加** = SBOM (CycloneDX / SPDX) + SLSA provenance (build-time attestation)、 supply-chain 特化
- **他 pair 2 3 段化 or new-base pair 第 13 導入** = Streaming / Database / Frontend or Blockchain / IoT / Mobile / Desktop 系新 base
- **横串 sweep 4 例目** = v1.30 a11y + v1.25 perf + v1.27 mutation に続く 4 例目

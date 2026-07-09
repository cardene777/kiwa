# kiwa v1.48 released — security-devsecops v0.3 Phase 3 runSecurityAudit single entry 統合 (DevSecOps library 化 3 段完成)

## Summary

kiwa v1.48 is out. **security-devsecops v0.3 Phase 3 runSecurityAudit single entry 統合** の単軸 milestone、 **DevSecOps library 化 3 段完成**。 v0.1 semantics (Phase 1) + v0.2 adapter (Phase 2) の上に v0.3 orchestrator (Phase 3) を lay、 skill 4 種を library single entry で置換可能に。

## What's new

### `@kiwa-lab/security-devsecops` v0.2 → v0.3

- `runSecurityAudit(input)` single entry 追加、 skill 4 種を library で置換可能
- 4 preset SSOT map = audit-all (6 axis) / supply-chain (SCA + Container) / specialty (SAST + Secret + DAST) / threat-model (6 axis + STRIDE tag)
- `summarizeAuditReport` 集約 API = totalAxis / completedAxis / totalEvents / totalDurationMs / perAxis + threat-model のみ stridDreadTags 添付
- backward compat 絶対維持 = v0.1 semantics + v0.2 adapter API 変更 0

### 1 new dogfood app

- `examples/dogfood-security-devsecops-orchestrator-app` — 4 preset workflow reference、 11 test (skill 4 種 + real env-gate 3 pattern)

### 1 new tutorial + migration + concept Phase 3 完成節

- **[Tutorial 106 — DevSecOps single entry](https://cardene777.github.io/kiwa/tutorials/106-security-orchestrator)**
- Migration guide v1.47 → v1.48 (additive-only、 Phase 1/2/3 の 3 pattern 使い分け SSOT)
- Concept doc Phase 3 完成節 = 3 段階層構造 + 4 preset × skill 対応 map + AuditReport 集約 SSOT + Phase 4 (v1.49+) 計画

### 26-milestone consecutive snippet validation streak

v1.23 → v1.48 = 26 milestones、 kiwa 史上最長記録更新継続。

## Install

```bash
pnpm add -D @kiwa-lab/security-devsecops@^0.3
```

## Migration guide

[v1.47 → v1.48](https://cardene777.github.io/kiwa/migrations/v1.47-to-v1.48)

## What's next

- v1.49 前後 = v0.4 spawn 実装 (実 semgrep / trivy CLI child_process 経路) or 7 axis 目 / 8 axis 目 (SBOM + SLSA provenance) 追加 or 他 pair 2 3 段化 or new-base pair 第 13 導入

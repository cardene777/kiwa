# kiwa v1.47 リリース — security-devsecops v0.2 adapter 統合 Phase 2 完成 (25 milestone snippet streak 継続)

## 概要

kiwa v1.47 をリリースしました。 **security-devsecops v0.2 adapter 統合 Phase 2 完成** の単軸 milestone。 v1.46 で新規追加した `@kiwa-test/security-devsecops` v0.1 の semantics に加えて、 6 axis × mock/real adapter pair (12 adapter) を追加、 実 CLI (semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype) 呼出隠蔽の interface + env-gate + fidelity harness を確立しました。

## 何が変わったか

### `@kiwa-test/security-devsecops` v0.1 → v0.2

- 6 adapter interface = SastAdapter / ScaAdapter / SecretAdapter / IacAdapter / DastAdapter / ContainerAdapter
- 12 adapter 実装 = 6 axis × mock (deterministic replay) + real (env-gate opt-in CLI 呼出隠蔽 stub)
- env-gate = `KIWA_SECURITY_MODE=real` + 各 CLI URL env 全部揃った時のみ real 呼出、 未設定時 explicit throw で fail-closed
- backward compat 絶対維持 = v0.1 semantics function API 変更 0、 adapter は新規 optional path

### adapter 経由 skill 4 種経路 SSOT

- security-audit → 6 mock/real adapter 全実行、 test 可能
- security-audit-supply-chain → SCA + Container mock/real 部分実行
- security-audit-specialty → domain 選択で adapter 部分実行
- security-audit-threat-model → 全 axis mock/real 結果 → STRIDE/DREAD 分類

### fidelity harness

`examples/dogfood-security-devsecops-adapter-app/` で mock vs real の 完了状態 + event count 一致検証 harness を提供、 v0.3 で real adapter が spawn 実装に置換されても継続使用可能。

### 1 new tutorial + migration + concept 更新

- **[Tutorial 105 — DevSecOps adapter](https://cardene777.github.io/kiwa/tutorials/105-security-adapter)** = 6 axis × mock/real × env-gate × fidelity walkthrough (10 min)
- Migration guide v1.46 → v1.47 = additive-only + 3 pattern (mock / real / v0.1 semantics 継続) SSOT
- Concept doc Phase 2 完成節 = adapter interface + env-gate 表 + skill 4 種 × mock/real 経路 map

## 25 milestone 連続 snippet validation streak 達成

v1.23 → v1.47 = 25 milestone 連続、 kiwa 史上最長記録更新継続。

## インストール

```bash
pnpm add -D @kiwa-test/security-devsecops@^0.2
```

## Migration guide

[v1.46 → v1.47](https://cardene777.github.io/kiwa/migrations/v1.46-to-v1.47)

## 次に何が来るか

v1.48 前後 = Phase 3 `runSecurityAudit` single entry 統合 or v0.3 spawn 実装 (実 semgrep / trivy CLI 呼出 child_process 経路) or 他 pair 3 段化 (Streaming / Database / Frontend) or new-base pair 第 13 導入。 5-milestone new-base cadence 復帰 or 中間 quality 補強 milestone の 2 段組み rhythm 継続。

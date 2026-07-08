# kiwa v1.47 released — security-devsecops v0.2 adapter integration Phase 2 完成

## Summary

kiwa v1.47 is out. **security-devsecops v0.2 adapter 統合 Phase 2 完成** の単軸 milestone。 v0.1 semantics に加えて 6 axis × mock/real adapter pair (12 adapter) を追加、 実 CLI 呼出隠蔽 interface + env-gate + fidelity harness を確立。

## What's new

### `@kiwa/security-devsecops` v0.1 → v0.2

- 6 adapter interface = SastAdapter / ScaAdapter / SecretAdapter / IacAdapter / DastAdapter / ContainerAdapter
- 12 adapter 実装 = 6 axis × mock (deterministic replay) + real (env-gate opt-in CLI 呼出隠蔽 stub)
- env-gate = `KIWA_SECURITY_MODE=real` + `KIWA_SEMGREP_URL` / `KIWA_TRIVY_URL` / `KIWA_GITLEAKS_URL` / `KIWA_TFSEC_URL` / `KIWA_ZAP_URL` / `KIWA_GRYPE_URL` 全設定時のみ real 呼出、 未設定時 explicit throw で fail-closed
- backward compat 絶対維持 = v0.1 semantics function API 変更 0、 adapter は新規 optional path

### 1 new dogfood app

- `examples/dogfood-security-devsecops-adapter-app` — 6 axis × 2 mode × fidelity harness、 14 test (mock 8 + real env-gate 3 + fidelity 3)

### 1 new tutorial + migration + concept 更新

- **[Tutorial 105 — DevSecOps adapter](https://cardene777.github.io/kiwa/tutorials/105-security-adapter)**
- Migration guide v1.46 → v1.47 (additive-only、 3 pattern SSOT)
- Concept doc `security-devsecops-library-integration.md` § Phase 2 完成節追加

### 25-milestone consecutive snippet validation streak

v1.23 → v1.47 = 25 milestones、 kiwa 史上最長記録更新継続。

## Install

```bash
pnpm add -D @kiwa/security-devsecops@^0.2
```

## Migration guide

[v1.46 → v1.47](https://cardene777.github.io/kiwa/migrations/v1.46-to-v1.47)

## What's next

- v1.48 前後 = Phase 3 (`runSecurityAudit` single entry 統合) or v0.3 spawn 実装 or 他 pair 3 段化 or new-base pair 第 13 導入

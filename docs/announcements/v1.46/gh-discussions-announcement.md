# kiwa v1.46 released — quality gate integrity + DevSecOps library (2 軸 milestone、 40 package 到達)

## Summary

kiwa v1.46 is out. **quality gate integrity 回復 + DevSecOps library 化 の 2 軸 milestone**。 v1.25 docs 記載と実態 gap (33 package sweep 記載 vs 実 15 package) + v1.42-v1.45 の advanced III baseline gap を解消、 dev-flow の security 4 skill を library 経由に置換する Phase 1 提供。

## What's new

### 3 package updated / new

- `@kiwa-test/perf-harness` v0.2 → v0.3 — strict mode 追加 (`detectRegressionStrict` + `runPerf3LayerStrict`)、 iter 400 + Welch |t|>3 + delta 10%、 backward compat 維持
- `@kiwa-test/quality-metrics` v0.3 → v0.4 — perf.strict axis 追加 (13 → 15 axis)、 `PerfMetric.strict` + `.baselineExists` field 追加
- `@kiwa-test/security-devsecops` v0.1 新規 (40 package 到達) — 6 axis (SAST + SCA + Secret + IaC + DAST + Container) state machine

### 38 package perf baseline 完全 sweep

- security package の perf test + baseline 追加 (残 gap 解消)
- 4 stale baseline refresh (realtime v0.3 / observability v2.2 / ai-llm v0.5 / auth v0.6)
- 38 package quality gate SSOT integrity 完全回復

### 1 new dogfood app

- `examples/dogfood-security-devsecops-app` — 6 axis chain 実行 workflow、 8 test

### 2 new tutorials

- **[Tutorial 103 — DevSecOps 6 axis](https://cardene777.github.io/kiwa/tutorials/103-security-devsecops)**
- **[Tutorial 104 — Perf strict mode](https://cardene777.github.io/kiwa/tutorials/104-perf-strict)**

### 24-milestone consecutive snippet validation streak

v1.23 → v1.46 = 24 milestones with tutorial code snippet validation tests.

## Install

```bash
pnpm add -D @kiwa-test/perf-harness@^0.3
pnpm add -D @kiwa-test/quality-metrics@^0.4
pnpm add -D @kiwa-test/security-devsecops@^0.1
```

## Migration guide

[v1.45 → v1.46](https://cardene777.github.io/kiwa/migrations/v1.45-to-v1.46)

## What's next

- v1.47 = security-devsecops v0.2 adapter 統合 (実 semgrep / trivy CLI 呼出隠蔽) or 他 pair-2 3 段化
- v1.48 前後 = new base pair 第 13 導入 (5-milestone cadence)

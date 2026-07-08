# kiwa v1.46 リリース — quality gate integrity 回復 + DevSecOps library 化 (2 軸 milestone、 40 package 到達)

## 概要

kiwa v1.46 をリリースしました。 **quality gate integrity 回復 + DevSecOps library 化 の 2 軸 milestone**。 v1.25 で docs 記載した「33 package sweep」 と実態 15 package の gap + v1.42-v1.45 で追加された advanced III axis の baseline 未生成 gap を解消、 dev-flow の /security-audit skill 4 種を library 経由で test 可能な形に置換する Phase 1 完成。

## 何が変わったか

### `@kiwa-test/perf-harness` v0.3.0 strict mode

- `detectRegressionStrict` (|t|>3 + delta 10%) 追加
- `runPerf3LayerStrict` (iter 400 + concurrency 20 + memory 400) 追加
- v0.2 lax mode (|t|>2 + 20% + iter 200) は backward compat として維持
- test 漏れゼロを狙う fail-fast mode

### `@kiwa-test/quality-metrics` v0.4.0 15 axis

- `PerfMetric` に `strict` + `baselineExists` field 追加
- `ReleaseGateThresholds` に `perfStrictP95Ms` (default 50) + `perfStrictRequireBaseline` (default true) 追加
- `evaluateReleaseGate` に `perf.strict.p95Ms` + `perf.strict.baseline` axis 追加 (`strict = true` 時のみ発火)
- 13 → 15 axis 拡張、 backward compat

### `@kiwa-test/security-devsecops` v0.1.0 新規 (40 package 到達)

6 axis の state machine + neutral event pattern。

- **SAST** (Semgrep-style) — startSastScan + detectSastFinding + suppressSastFinding + completeSastScan
- **SCA** (Trivy-style) — startScaScan + analyzeScaDependency + detectScaVuln + flagScaLicense + completeScaScan
- **Secret scan** (Gitleaks-style) — startSecretScan + matchSecretPattern + flagSecretEntropy + allowlistSecret + completeSecretScan
- **IaC scan** (tfsec-style) — startIacScan + analyzeIacResource + detectIacMisconfig + checkIacCompliance + completeIacScan
- **DAST** (OWASP ZAP-style) — startDastScan + crawlDastUrls + attemptDastAttack + confirmDastVuln + completeDastScan
- **Container security** (Grype-style) — startContainerScan + scanContainerImage + detectContainerCve + flagContainerMalware + completeContainerScan

### 38 package perf baseline 完全 sweep

- security package の perf test + baseline 追加 (残 gap 解消)
- 4 stale baseline refresh (realtime v0.3 / observability v2.2 / ai-llm v0.5 / auth v0.6)
- 38 package quality gate SSOT integrity 完全回復

### 1 new dogfood app + 2 tutorial

- `dogfood-security-devsecops-app` — 6 axis chain 実行 (8 test)
- **[Tutorial 103 — DevSecOps 6 axis](https://cardene777.github.io/kiwa/tutorials/103-security-devsecops)**
- **[Tutorial 104 — Perf strict mode](https://cardene777.github.io/kiwa/tutorials/104-perf-strict)**

## 24 milestone 連続 snippet validation streak 達成

v1.23 → v1.46 で 24 milestone 連続。 kiwa 史上最長記録更新継続。

## インストール

```bash
pnpm add -D @kiwa-test/perf-harness@^0.3
pnpm add -D @kiwa-test/quality-metrics@^0.4
pnpm add -D @kiwa-test/security-devsecops@^0.1
```

## Migration guide

[v1.45 → v1.46](https://cardene777.github.io/kiwa/migrations/v1.45-to-v1.46)

## 次に何が来るか

v1.47 = security-devsecops v0.2 adapter 統合 (実 semgrep / trivy CLI 隠蔽) or 他 pair-2 3 段化 (Streaming / Database / Frontend / Security)。 v1.48 前後 = new base pair 第 13 導入 (5-milestone cadence)。

# @kiwa-lab/observability

## 2.1.0

### Minor Changes

- feat: v2.1 advanced 8-axis observability semantics (縦深化 pair 第 7 pair 連続化)。 追加 axis = SLO/SLI/error budget (burn rate + multi-window multi-burn-rate) / RED-USE/four golden signals / exemplar tracing (metric↔trace 双方向) / OpenTelemetry advanced (batch processor + resource detection + baggage + W3C context) / log correlation advanced (structured log + trace_id/span_id + LogQL/PromQL join) / alert routing advanced (silence + inhibit + escalation chain + oncall) / continuous profiling (CPU/memory/off-CPU + flame graph) / cardinality control (high-cardinality detection + label reduction + histogram bucket)。
  - 4 provider target (Grafana OSS / Prometheus / Loki / OpenTelemetry Collector) x 8 axis = 32 grid fidelity harness (`semantics.collectFidelityCoverage()`)。
  - Provider-neutral event 名 (`slo.burn_rate_evaluated` 等) と provider-specific dialect (`grafana.slo.burn.eval` 等) を `providerEventName()` で切替、 テストは neutral 名で assert、 実配線は dialect で観測。
  - Real driver env-gate (`isKiwaModeReal()` + `resolveObservabilityEndpoint()` + `skipUnlessReal()`) が KIWA_MODE=real 時に Grafana OSS/Prometheus/Loki/OTel Collector backend endpoint を解決。 KIWA_MODE≠real 時は skip=true を返して mock semantics に fallback。
  - namespaced export ... `semantics/*` は `import { semantics } from '@kiwa-lab/observability'` 経由、 v2.0 の `Silence` / `EscalationStep` / `FlameNode` と競合しない構造で追加。
  - v2.0 の既存 API (dashboard-mock / alert / trace-flame / log-correlation) と v1.1 telemetry mock は無変更、 v1.0 flaky/coverage も無変更。
  - Refs #1061 (v1.35-1、 CAR-798)、 #1060 (v1.35 parent)、 縦深化 pair 第 7 pair 連続化 (v1.14 base → v1.17 v2 → v1.35 v2.1)。

## 2.0.0

### Major Changes

- bd156ba: feat: v2.0 — 4 additional axes on top of the v1.1 telemetry mock foundation. `dashboard-mock` (Grafana-style panel + metric query + refresh + threshold badge), `alert` (Prometheus AlertManager style rule + routing tree + silence + escalation state machine), `trace-flame` (span tree aggregate + flame graph collapse + drill-down + self / total ms), `log-correlation` (log ↔ span bidirectional index over trace_id / span_id keys with alt-key fallback).

  - `DashboardMock` + `buildDashboardMock` — bind a dashboard to a `TelemetryCollector`, evaluate N panel queries (sum / avg / max / min / count / last) with optional tag filter + time window, attach `PanelThreshold[]` for `ok` / `warn` / `critical` badge selection. `refresh()` returns `PanelResult[]` and increments `refreshCount`; `panel(id)` looks up by id from the most recent results.
  - `AlertRouter` — register `AlertRule[]` against a `TelemetryCollector`; `evaluate()` transitions pending → firing under `forSamples` gate, resolves back when the metric drops. `setRoute` walks a nested `RouteEntry` tree (deepest match wins). `addSilence` suppresses fires while the label match holds and `expiresAt` is in the future. `setEscalation` + `tickEscalation()` walks a state machine so kiwa tests can assert "reached tier 2 at t=15min" without any wall clock.
  - `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — pure transforms over `SpanRecord[]` (v1.1 shape unchanged) that reconstruct the span parent chain, compute `totalMs` / `selfMs`, collapse siblings by name into `FlameNode` (samples counted), and extract a subtree with depth normalized to 0. Orphan spans (parent not found) become roots.
  - `LogCorrelationIndex` + `correlateLogsAndSpans` — build a bidirectional index from `LogRecord[]` and `SpanRecord[]`; look up `logsForSpan` / `logsForTrace` / `spansForTrace` / `linkAll`. Configurable `CorrelationKeys` (`traceIdKey` / `spanIdKey` / `altTraceIdKeys`) covers OpenTelemetry (`trace_id` / `span_id`) + Datadog (`dd.trace_id` / `dd.span_id`) + Sentry (`sentry-trace`) conventions. `correlatedCount` measures the SUT's instrumentation coverage of its own log surface.
  - Fixture builders — `panel_httpErrorRate` / `panel_p99Latency` / `panel_queueDepth`, `rule_errorRateCritical` / `rule_latencyDegraded` / `rule_queueBackpressure`, `defaultRoute` / `escalation_pagerDutyTwoStep` / `silence_maintenanceWindow`, `trace_httpHandler` / `trace_fanoutParallel` / `trace_nestedRetry`, `logs_forHttpTrace`. 40+ new behavior tests (67 added, 145 total pass).
  - Backward compatibility — v1.0 API (`renderDashboard` / `detectFlaky` / `analyzeSpecCoverage` / `fromIstanbulCoverageSummary` / `checkThresholds`) and v1.1 API (`TelemetryCollector` + `createOtelMock` / `createDatadogMock` / `createSentryMock`) unchanged. The v1 `renderDashboard` markdown emitter for test-run dashboards coexists with the new `DashboardMock` runtime.
  - Major bump reason — new public surface additions cross the module boundary (11 new exports + 13 fixture builders) and the v2 module name signals the "Observability v2" milestone (v1.17). No breaking change to existing signatures.

  Refs #777 (v1.17 milestone), #778 (v1.17-1 sub-Issue).

## 1.2.0

### Minor Changes

- v1.1: telemetry provider mocks added (OpenTelemetry + Datadog + Sentry). Unified `TelemetryCollector` shape (spans / metrics / logs / exceptions / transactions) so assertions read the same regardless of provider. Sentry fingerprint dedupe + breadcrumb lifecycle match the real SDK. Existing v1.0 API (flaky / spec-coverage / dashboard / coverage) unchanged.

## 1.0.1

### Patch Changes

- 32a6c10: 📦 11 packages initial v1.0.x npm publish (改名後初回)。

  PR #476 で `@kiwa-lab/core` ↔ `@kiwa-lab/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

  本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

  ## 影響範囲

  - 旧 `@kiwa-lab/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
  - 旧 `@kiwa-lab/spec` は廃止 (`@kiwa-lab/core` に統合)
  - 新 `@kiwa-lab/dapp` (404 → v1.0.1 として初公開)
  - 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
  - v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

  ## 確認方法

  ```bash
  npm view @kiwa-lab/core version    # → 1.0.1
  npm view @kiwa-lab/dapp version    # → 1.0.1 (新規公開)
  npm view @kiwa-lab/e2e version     # → 1.0.1
  npm view @kiwa-lab/a11y version    # → 1.0.1
  npm view @kiwa-lab/visual version  # → 1.0.1
  ```

- Updated dependencies [32a6c10]
  - @kiwa-lab/core@1.0.1

## 0.2.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-lab/core@0.1.1

## 0.2.0

### Minor Changes

- 0a07815: v6.2 — vitest coverage 統合 + observability dashboard 取込 + ui Vue 対応

  ## A: vitest coverage 統合

  - spec / api / ui / data / cli-test / observability / e2e / cli / core の package.json に `test:cov` script 追加
  - `@vitest/coverage-v8` を devDep に追加
  - v8 provider で line / branch / function / statement coverage を JSON + text reporter で出力

  ## B: @kiwa-lab/observability に coverage 取込 (minor)

  - `fromIstanbulCoverageSummary` ... v8 / istanbul coverage-summary.json を `CoverageSummary` に正規化、 total 不在時は files から自動集計
  - `checkThresholds` ... lines / branches / functions / statements の最低 % を gate
  - `renderDashboard({ coverage })` に Code coverage section 追加 (total line/branch/function/statement の表)
  - 6 件 test 追加 (合計 21 件 PASS)

  ## C: @kiwa-lab/ui に Vue 3 対応 (minor)

  - `setupVueComponentEnv({ mode, component, props, slots })` ... `@vue/test-utils` を lazy load して mount、 jsdom 環境で動作 (PoC 2 件 PASS)
  - `setupSvelteComponentEnv({ mode, component, props })` ... `@testing-library/svelte` を lazy load する API のみ提供 (test は PoC 側で実装)
  - 既存 React 経路 + 実 Chromium browser mode は完全互換
  - peer dep に `@vue/test-utils` / `vue` / `@testing-library/svelte` / `svelte` を optional 追加

## 0.1.0

### Minor Changes

- 8afad1c: v5 — @kiwa-lab/observability v0.1.0 新設: test 集計 + flaky 検出 + spec coverage gap dashboard

  設計 × 実装 × 観測 ループの観測 → 上流 spec フィードバック経路を SSOT 化する終端 adapter。

  ## 新規 API

  - `collectRunHistory` ... vitest 出力を history に追加、 maxPerTest で FIFO eviction
  - `fromVitestJson` ... vitest JSON reporter 出力を TestRunRecord[] に変換、 fullName から `T-XXX-NNN` ID を抽出
  - `detectFlaky` ... minRuns + threshold で pass/fail mixed test を抽出 (always-pass / always-fail は除外)
  - `analyzeSpecCoverage` ... spec markdown と test code を突き合わせ、 missingTcIds / extraTcIds 抽出
  - `renderDashboard` ... Summary + Flaky tests + Spec coverage gaps の markdown dashboard を出力

  ## skill SSOT

  - `.claude/skills/kiwa-observe/SKILL.md` ... 新設、 vitest 実行 → dashboard 生成 → user 提示までの Layer 3 flow

---
title: "kiwa v1.17 released — Observability v2 (dashboard + alert + trace flame graph + log correlation)"
emoji: "🌱"
type: "tech"
topics: ["oss", "typescript", "testing", "kiwa", "release"]
published: true
---

# kiwa v1.17 released

v1.17 は kiwa の 7 milestone 目です。 v1.16 (component test 縦軸、 Storybook 8 + Playwright CT + Chromatic) の後、 v1.17 は 2026 SaaS production team のほぼ全てが導入済の **observability stack (Grafana dashboard + Prometheus AlertManager + trace flame graph + log correlation) を 1 統一 mock harness に land** しました。

v1.14-4 で land した `@kiwa-test/observability` v1.1 telemetry mock 3 provider (OpenTelemetry / Datadog / Sentry) を基盤に、 実運用の dashboard 描画 + alert routing + trace flame graph + log ↔ span correlation の 4 追加軸を major bump として重ねる縦軸思想です。

## 主な追加

### `@kiwa-test/observability` v2.0 (major bump)

v1.14-4 で land した telemetry mock 3 provider (OpenTelemetry / Datadog / Sentry) を基盤に、 4 追加軸を統一 API で扱う mock harness に発展。 v1.0 (`renderDashboard` / `detectFlaky` / `analyzeSpecCoverage` / `checkThresholds`) + v1.1 (`TelemetryCollector` + 3 provider mock) surface は 100% backward compatible です。 major bump は「新 public surface が module 境界を跨ぐ (11 export + 13 fixture builder) 」 と「v2 module name で Observability v2 milestone を signal する」 の 2 意味。

```ts
import {
  DashboardMock,
  AlertRouter,
  buildDashboardMock,
  buildSpanTree,
  renderFlameGraph,
  drillDown,
  flattenFlame,
  LogCorrelationIndex,
  correlateLogsAndSpans,
  createOtelMock,
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
  defaultRoute,
  escalation_pagerDutyTwoStep,
  silence_maintenanceWindow,
  trace_httpHandler,
  trace_nestedRetry,
  logs_forHttpTrace,
} from '@kiwa-test/observability';

// 1) Dashboard — panel + query + refresh + threshold badge
const otel = createOtelMock({ now: () => 1_000 });
const dashboard = buildDashboardMock({
  id: 'sre-overview',
  collector: otel.collector,
  panels: [panel_httpErrorRate(), panel_p99Latency(), panel_queueDepth()],
});
otel.collector.record({ metric: 'http.errors', value: 5, timestamp: 1_000 });
otel.collector.record({ metric: 'http.p99.latency.ms', value: 850, timestamp: 1_000 });
otel.collector.record({ metric: 'queue.depth', value: 120, timestamp: 1_000 });
const results = dashboard.refresh();
// results[0].badge === 'critical' (http.errors > 3 threshold)
// dashboard.refreshCount === 1

// 2) Alert — rule + route + silence + escalation
const router = new AlertRouter({ collector: otel.collector });
router.register(rule_errorRateCritical());
router.register(rule_latencyDegraded());
router.register(rule_queueBackpressure());
router.setRoute(defaultRoute());
router.setEscalation('http_error_rate_critical', escalation_pagerDutyTwoStep());
const fires = router.evaluate({ at: 1_000 });
// fires: [{ ruleId: 'http_error_rate_critical', route: { severity: 'critical', team: 'platform', channel: 'pagerduty' } }]
router.tickEscalation({ at: 1_000 + 30 * 60 * 1000 });
// escalated to L2 after 30min

// 3) Trace flame graph — buildSpanTree + renderFlameGraph + drillDown
const spans = trace_httpHandler().spans;
const tree = buildSpanTree(spans);
// tree.root.name === 'http.request', tree.root.totalMs / selfMs computed
const flame = renderFlameGraph(tree);
// flame.nodes.forEach(n => { n.samples, n.totalMs, n.selfMs, n.depth })
const subtree = drillDown(tree, 'db.query');
// subtree.depth === 0 (normalized)

// 4) Log ↔ span correlation
const logs = logs_forHttpTrace(tree.root.traceId);
const index = new LogCorrelationIndex({ logs, spans });
const forSpan = index.logsForSpan(tree.root.spanId);
const forTrace = index.logsForTrace(tree.root.traceId);
// index.correlatedCount / logs.length gives SUT instrumentation coverage
```

- `DashboardMock` + `buildDashboardMock` — `TelemetryCollector` に bind、 N panel query (6 aggregate: sum / avg / max / min / count / last) + optional tag filter + time window + `PanelThreshold[]` で ok / warn / critical badge、 `refresh()` は `PanelResult[]` + `refreshCount` tick
- `AlertRouter` — `AlertRule[]` を collector に登録、 `evaluate()` で `pending → firing` 遷移を `forSamples` gate 経由で駆動、 `setRoute` は nested `RouteEntry` tree deepest match で解決、 `addSilence` は literal + regex label match、 `setEscalation` + `tickEscalation()` state machine
- `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — `SpanRecord[]` (v1.1 shape 無変更) の pure transform、 parent chain 復元 + `totalMs` / `selfMs` 算出 + 同名 sibling `FlameNode` 集約 (samples 数計上) + 部分木 depth 0 normalize、 orphan span は root 昇格
- `LogCorrelationIndex` + `correlateLogsAndSpans` — `LogRecord[]` + `SpanRecord[]` 双方向 index、 `logsForSpan` / `logsForTrace` / `spansForTrace` / `linkAll` + configurable `CorrelationKeys` で OpenTelemetry / Datadog / Sentry の 3 convention を統一 API で扱う
- fixture builder 13 種 — `panel_*` 3 + `rule_*` 3 + `defaultRoute` / `escalation_pagerDutyTwoStep` / `silence_maintenanceWindow` + `trace_*` 3 + `logs_forHttpTrace`
- 40+ 新 behavior test (67 added、 145 total pass)、 backward compatibility test で v1.0 + v1.1 API 全 pass 確認

### dogfood-observability-dashboard

Next.js App Router style Grafana dashboard を provider-neutral `DashboardAdapter` behind に land。 5 canonical panel (line / bar / gauge / stat / table) — 1 per `chart_type`、 shared PromQL-style query builder で backing、 `line` と `bar` は observability package の `timeseries` PanelKind に map するが app 側 `chart_type` は `PanelRenderResult.chartType` に保持 (server component が chart component を正しく選択できる)。

- `makeMockAdapter` — 4 metric name (`http.errors` / `http.p99.latency.ms` / `queue.depth` / `http.requests`) を `TelemetryCollector` に seed + `DashboardMock` に drive、 refresh + query + badge を deterministic に
- `makeRealAdapter` — Prometheus instant-query endpoint (`GET /api/v1/query`) を `PROMETHEUS_URL` env で駆動、 未設定は `PROMETHEUS_ENV_MISSING` trace + fetch 未対応は `PROMETHEUS_FETCH_MISSING` trace で honest downgrade、 `queryToPromQL` で `DashboardQuery` を PromQL に compile
- `createDashboardPageController` — Next.js App Router server component が直接 call する controller (`load()` / `refresh()`)、 `KIWA_MODE=mock` (default) / `real` で adapter 選択
- 22 vitest test (18 e2e mock + 3 fidelity + 1 emit) + 2 perf spec (mock 3-layer + live Prometheus 3-layer env-skip)
- `docs/quality-reports/observability/dashboard.md` に canonical fidelity snapshot 昇格、 7 軸 release gate PASS

### dogfood-alert-orchestrator

Node.js style Prometheus AlertManager orchestrator を provider-neutral `AlertOrchestratorAdapter` behind に land。 10 canonical alert rule — 4 threshold (HTTP 5xx / p99 latency / queue depth / disk usage) + 3 rate (5xx rate / request rate / route error rate) + 3 anomaly (memory rss / cpu / gc pause)、 rate + anomaly kind は mock adapter で threshold 計算に compile (rate = cumulative counter / elapsed window、 anomaly = latest sample vs trailing mean + `stddevMult × stddev`)。

- 3-level routing tree (`severity → team → channel`) — 6 leaf receiver (`pagerduty-platform` / `pagerduty-infra` / `slack-platform` / `slack-data` / `slack-infra` / `slack-info`) + fallback `pagerduty` root、 `walkRoute` は `AlertRouter.walkRoute` semantics (deepest match wins) を mirror
- silence store — literal + regex label match、 regex compile は silence 単位で cache (malformed pattern で orchestrator brick を防止)
- escalation ladder L1 30s → L2 5min → L3 30min で PagerDuty 3-tier policy を mirror、 mock で full state machine を exercise
- `makeMockAdapter` — deterministic lifecycle transition (fire → route → silence → escalate → resolve)、 fidelity test で receiver identity + silence suppression + escalation timing を wall clock 依存なしで assert
- `makeRealAdapter` — AlertManager `/api/v2/alerts` に POST + GET (via `ALERTMANAGER_URL`)、 `emitMetric` は Prometheus scrape owned なので real path で noop (trace parity を honest に)
- 27 vitest test (23 e2e mock + 3 fidelity + 1 emit) + 2 perf spec、 `docs/quality-reports/observability/alert-orchestrator.md` に canonical fidelity snapshot 昇格、 7 軸 release gate PASS

### dogfood-trace-flame-graph

React SPA style trace flame graph explorer を provider-neutral `FlameExplorerAdapter` behind に land。 10 canonical trace fixture (100 span + 34 log) — flat HTTP handler / fanout-parallel worker / 3-level nested retry / 6-level React SSR / batched DB write / chunked upload / API gateway fan-out / async event bus / cache miss + fill / heartbeat + checkpoint background job。 全 fixture は sibling-collapse rule を stress するよう設計 (worker.process samples=2、 http.retry nested x3、 db.batch samples=4、 chunk.upload samples=3、 bus.subscribe samples=4、 heartbeat samples=5、 component.datapoint samples=4)。

- 5 pure-TS component — `FlameGraph.ts` (`layoutFlameGraph` + `summariseFlameGraph`、 stacked-bar layout + per-name aggregate)、 `SpanTree.ts` (`buildSpanTreeRows` + `collapseSubtree`、 indented DFS + disclosure)、 `LogPanel.ts` (`buildLogPanelRows` + level + span filter)、 `Drilldown.ts` (breadcrumb + summary + header stats)。 同 pure function を browser SPA render path に直接 import 可能 (DOM 依存なし)
- `makeMockAdapter` — v1.17-1 span tree + flame graph + log correlation helper を drive + memoised per-`traceId` cache で 2 度目の latency は Map lookup、 全 op で `TraceEvent[]` emit
- `makeRealAdapter` — Jaeger `/api/traces/{id}` GET (`JAEGER_URL` 経由)、 Jaeger v3 payload (spanID + operationName + tags + logs、 µs → ms) を mock `LoadedTrace` shape に normalize、 未設定 / fetch 未対応 / 404 は honest downgrade trace で報告
- `TraceLogIndex` — v1.17-1 `LogCorrelationIndex` の thin wrapper、 observability SpanRecord shape を dogfood span shape に adapt、 override 可能な correlation key で OpenTelemetry / Jaeger / Datadog / Sentry の 4 convention を統一 support
- `createFlameService` — React `App.tsx` context provider 直呼出想定 (`focus()` / `drill()` / `filter()`)、 `KIWA_MODE=mock` / `real` で adapter 選択
- 29 vitest test (25 e2e mock + 3 fidelity + 1 emit) + 2 perf spec (mock 3-layer + live Jaeger 3-layer env-skip)、 `docs/quality-reports/observability/trace-flame-graph.md` に canonical fidelity snapshot 昇格、 7 軸 release gate PASS

### docs 3 pillars + concept doc

- Tutorial 22 (Observability dashboard、 5 panel + threshold + refresh) / 23 (Alert orchestrator、 10 rule + 3-level route + silence + escalation) / 24 (Trace flame graph、 span tree + flame + drill-down + log correlation)
- Migration guide `v1.16 → v1.17` (additive-only、 既存 test は無変更で pass、 `@kiwa-test/observability` v1.x → v2.0 major bump は import 追加のみで移行完了)
- Concept doc `docs/concepts/observability-v2-testing.md` — 4 追加軸 (dashboard / alert / trace-flame / log-correlation) × 6 semantic axis (panel query resolution / threshold badge / routing tree / silence + escalation / span aggregate / log ↔ span correlation) を SSOT 化
- VitePress sidebar 追記 (Observability v2 (v1.17) section + concept doc link + migration link)
- `/docs-publish-kiwa` 経由 gh-pages 反映済

## 7 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張、 telemetry v1.1 基盤 land) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → **v1.17 (Observability v2)**。 v1.11 以降の全 milestone で 6 sub-Issue を full-land。

## v2.0 候補

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- Framework 深化 (SolidJS / Fresh / HonoJS)
- Coverage 100% milestone
- Blockchain 深化 (Reth Rust Ethereum execution client + Foundry-rs 深化 + dApp e2e 拡張)
- Cache / Data 深化 (Dragonfly / Materialize / Neon)

## まとめ

v1.17 は Observability v2 milestone。 v1.14-4 で land した telemetry mock 3 provider (OpenTelemetry / Datadog / Sentry) を基盤に、 実運用 SaaS observability stack の 4 追加軸 (dashboard + alert + trace flame + log correlation) を major bump として land しました。 v1.11 - v1.17 で **43 sub-Issue 完遂 + 43 PR merge**、 kiwa の provider coverage は 7 milestone 連続で拡大しています。

Roadmap: https://github.com/cardene777/kiwa/issues/777
